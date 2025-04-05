from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
import os
import stripe
from .users import get_current_active_user, UserRole
from .products import products_db
from .cart import cart_items_db

stripe.api_key = os.getenv("STRIPE_API_KEY", "your_stripe_api_key")

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
)

orders_db = {}
order_id_counter = 1
order_item_id_counter = 1

class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price_at_purchase: float

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    product: dict

    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    shipping_address: str
    total_amount: float
    items: List[OrderItemBase]

class Order(BaseModel):
    id: int
    user_id: int
    shipping_address: str
    total_amount: float
    status: OrderStatus
    created_at: datetime
    items: List[OrderItem]

    class Config:
        orm_mode = True

class PaymentIntent(BaseModel):
    order_id: int

class PaymentIntentResponse(BaseModel):
    client_secret: str

@router.get("", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_active_user)):
    user_id = current_user["id"]
    user_orders = []
    
    for order_id, order in orders_db.items():
        if current_user["role"] == UserRole.ADMIN or order["user_id"] == user_id:
            user_orders.append(order)
    
    return user_orders

@router.get("/{order_id}", response_model=Order)
async def get_order(
    order_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    if order_id not in orders_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    order = orders_db[order_id]
    
    if current_user["role"] != UserRole.ADMIN and order["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this order",
        )
    
    return order

@router.post("", response_model=Order)
async def create_order(
    order_data: OrderBase,
    current_user: dict = Depends(get_current_active_user)
):
    global order_id_counter, order_item_id_counter
    user_id = current_user["id"]
    
    new_order = {
        "id": order_id_counter,
        "user_id": user_id,
        "shipping_address": order_data.shipping_address,
        "total_amount": order_data.total_amount,
        "status": OrderStatus.PENDING,
        "created_at": datetime.utcnow(),
        "items": []
    }
    
    for item_data in order_data.items:
        if item_data.product_id not in products_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item_data.product_id} not found",
            )
        
        product = products_db[item_data.product_id]
        
        if product["inventory_count"] < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough inventory for product {product['name']}",
            )
        
        new_order_item = {
            "id": order_item_id_counter,
            "order_id": order_id_counter,
            "product_id": item_data.product_id,
            "quantity": item_data.quantity,
            "price_at_purchase": item_data.price_at_purchase,
            "product": product
        }
        
        new_order["items"].append(new_order_item)
        order_item_id_counter += 1
        
        product["inventory_count"] -= item_data.quantity
    
    orders_db[order_id_counter] = new_order
    order_id_counter += 1
    
    items_to_remove = []
    for item_id, item in cart_items_db.items():
        if item["user_id"] == user_id:
            items_to_remove.append(item_id)
    
    for item_id in items_to_remove:
        del cart_items_db[item_id]
    
    return new_order

@router.put("/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: int,
    status: OrderStatus,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update order status",
        )
    
    if order_id not in orders_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    orders_db[order_id]["status"] = status
    
    return orders_db[order_id]

@router.post("/payment", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntent,
    current_user: dict = Depends(get_current_active_user)
):
    if payment_data.order_id not in orders_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    order = orders_db[payment_data.order_id]
    
    if order["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to pay for this order",
        )
    
    if order["status"] != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in pending status",
        )
    
    try:
        amount = int(order["total_amount"] * 100)  # Convert to cents
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            metadata={"order_id": order["id"]},
        )
        
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
