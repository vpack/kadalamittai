from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .users import get_current_active_user
from .products import products_db, Product

router = APIRouter(
    prefix="/cart",
    tags=["cart"],
)

cart_items_db = {}
cart_item_id_counter = 1

class CartItemBase(BaseModel):
    product_id: int
    quantity: int

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: int
    user_id: int
    product: Product

    class Config:
        orm_mode = True

@router.get("", response_model=List[CartItem])
async def get_cart_items(current_user: dict = Depends(get_current_active_user)):
    user_id = current_user["id"]
    user_cart_items = []
    
    for item_id, item in cart_items_db.items():
        if item["user_id"] == user_id:
            product = products_db.get(item["product_id"])
            if product:
                cart_item = {
                    **item,
                    "product": product
                }
                user_cart_items.append(cart_item)
    
    return user_cart_items

@router.post("", response_model=CartItem)
async def add_to_cart(
    cart_item: CartItemCreate,
    current_user: dict = Depends(get_current_active_user)
):
    global cart_item_id_counter
    user_id = current_user["id"]
    
    if cart_item.product_id not in products_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    
    product = products_db[cart_item.product_id]
    if product["inventory_count"] < cart_item.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough inventory available",
        )
    
    for item_id, item in cart_items_db.items():
        if item["user_id"] == user_id and item["product_id"] == cart_item.product_id:
            new_quantity = item["quantity"] + cart_item.quantity
            
            if product["inventory_count"] < new_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Not enough inventory available",
                )
            
            item["quantity"] = new_quantity
            
            return {
                **item,
                "product": product
            }
    
    new_cart_item = {
        "id": cart_item_id_counter,
        "user_id": user_id,
        **cart_item.dict()
    }
    
    cart_items_db[cart_item_id_counter] = new_cart_item
    cart_item_id_counter += 1
    
    return {
        **new_cart_item,
        "product": product
    }

@router.put("/{item_id}", response_model=CartItem)
async def update_cart_item(
    item_id: int,
    quantity: int,
    current_user: dict = Depends(get_current_active_user)
):
    user_id = current_user["id"]
    
    if item_id not in cart_items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    
    cart_item = cart_items_db[item_id]
    if cart_item["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this cart item",
        )
    
    product_id = cart_item["product_id"]
    if product_id not in products_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    
    product = products_db[product_id]
    if product["inventory_count"] < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough inventory available",
        )
    
    cart_item["quantity"] = quantity
    
    return {
        **cart_item,
        "product": product
    }

@router.delete("/{item_id}")
async def remove_from_cart(
    item_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    user_id = current_user["id"]
    
    if item_id not in cart_items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    
    cart_item = cart_items_db[item_id]
    if cart_item["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove this cart item",
        )
    
    del cart_items_db[item_id]
    
    return {"message": "Cart item removed successfully"}

@router.delete("")
async def clear_cart(current_user: dict = Depends(get_current_active_user)):
    user_id = current_user["id"]
    
    items_to_remove = []
    for item_id, item in cart_items_db.items():
        if item["user_id"] == user_id:
            items_to_remove.append(item_id)
    
    for item_id in items_to_remove:
        del cart_items_db[item_id]
    
    return {"message": "Cart cleared successfully"}
