export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin"
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export enum ProductCategory {
  ELECTRONICS = "electronics",
  CLOTHING = "clothing",
  HOME = "home",
  BOOKS = "books",
  TOYS = "toys",
  OTHER = "other"
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: ProductCategory;
  inventory_count: number;
  created_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  user_id: number;
  product: Product;
}

export enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled"
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  order_id: number;
  product: Product;
}

export interface Order {
  id: number;
  user_id: number;
  shipping_address: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface PaymentIntent {
  client_secret: string;
}
