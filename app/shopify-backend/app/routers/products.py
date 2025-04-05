from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum
from .users import get_current_active_user, UserRole

router = APIRouter(
    prefix="/products",
    tags=["products"],
)

products_db = {}
product_id_counter = 1

class ProductCategory(str, Enum):
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    HOME = "home"
    BOOKS = "books"
    TOYS = "toys"
    OTHER = "other"

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category: ProductCategory
    inventory_count: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

def init_sample_products():
    global product_id_counter
    
    sample_products = [
        {
            "name": "Smartphone X",
            "description": "Latest smartphone with advanced features and high-resolution camera.",
            "price": 799.99,
            "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "category": ProductCategory.ELECTRONICS,
            "inventory_count": 25,
        },
        {
            "name": "Laptop Pro",
            "description": "Powerful laptop for professionals with high performance and long battery life.",
            "price": 1299.99,
            "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "category": ProductCategory.ELECTRONICS,
            "inventory_count": 15,
        },
        {
            "name": "Casual T-Shirt",
            "description": "Comfortable cotton t-shirt for everyday wear.",
            "price": 24.99,
            "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "category": ProductCategory.CLOTHING,
            "inventory_count": 50,
        },
        {
            "name": "Coffee Table",
            "description": "Modern coffee table with wooden top and metal legs.",
            "price": 149.99,
            "image_url": "https://images.unsplash.com/photo-1532372320572-cda25653a694?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "category": ProductCategory.HOME,
            "inventory_count": 10,
        },
        {
            "name": "Bestselling Novel",
            "description": "Award-winning fiction novel that topped the charts this year.",
            "price": 19.99,
            "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "category": ProductCategory.BOOKS,
            "inventory_count": 30,
        },
        {
            "name": "Building Blocks Set",
            "description": "Educational building blocks for children to develop creativity.",
            "price": 34.99,
            "image_url": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "category": ProductCategory.TOYS,
            "inventory_count": 20,
        },
    ]
    
    for product_data in sample_products:
        product = {
            "id": product_id_counter,
            "created_at": datetime.utcnow(),
            **product_data
        }
        products_db[product_id_counter] = product
        product_id_counter += 1

init_sample_products()

@router.get("", response_model=List[Product])
async def get_products():
    return list(products_db.values())

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: int):
    if product_id not in products_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return products_db[product_id]

@router.post("", response_model=Product)
async def create_product(
    product: ProductCreate,
    current_user: dict = Depends(get_current_active_user)
):
    global product_id_counter
    
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create products",
        )
    
    new_product = {
        "id": product_id_counter,
        "created_at": datetime.utcnow(),
        **product.dict()
    }
    
    products_db[product_id_counter] = new_product
    product_id_counter += 1
    
    return new_product

@router.put("/{product_id}", response_model=Product)
async def update_product(
    product_id: int,
    product: ProductCreate,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update products",
        )
    
    if product_id not in products_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    
    updated_product = {
        "id": product_id,
        "created_at": products_db[product_id]["created_at"],
        **product.dict()
    }
    
    products_db[product_id] = updated_product
    
    return updated_product

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    current_user: dict = Depends(get_current_active_user)
):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete products",
        )
    
    if product_id not in products_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    
    del products_db[product_id]
    
    return {"message": "Product deleted successfully"}
