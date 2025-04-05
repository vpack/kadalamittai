import { AuthResponse, CartItem, Order, PaymentIntent, Product, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }
  
  return response.json();
}

export const authApi = {
  register: (data: { email: string; full_name: string; password: string }) =>
    fetchApi<User>('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  login: (email: string, password: string) =>
    fetch(`${API_URL}/users/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: email,
        password,
      }),
    }).then(response => {
      if (!response.ok) {
        throw new Error('Login failed');
      }
      return response.json() as Promise<AuthResponse>;
    }),
    
  getCurrentUser: () => fetchApi<User>('/users/me'),
};

export const productsApi = {
  getAll: () => fetchApi<Product[]>('/products'),
  
  getById: (id: number) => fetchApi<Product>(`/products/${id}`),
  
  create: (data: Omit<Product, 'id' | 'created_at'>) =>
    fetchApi<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  update: (id: number, data: Omit<Product, 'id' | 'created_at'>) =>
    fetchApi<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: (id: number) =>
    fetchApi<void>(`/products/${id}`, {
      method: 'DELETE',
    }),
};

export const cartApi = {
  getItems: () => fetchApi<CartItem[]>('/cart'),
  
  addItem: (productId: number, quantity: number) =>
    fetchApi<CartItem>('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
    
  updateItem: (itemId: number, quantity: number) =>
    fetchApi<CartItem>(`/cart/${itemId}?quantity=${quantity}`, {
      method: 'PUT',
    }),
    
  removeItem: (itemId: number) =>
    fetchApi<void>(`/cart/${itemId}`, {
      method: 'DELETE',
    }),
    
  clearCart: () =>
    fetchApi<void>('/cart', {
      method: 'DELETE',
    }),
};

export const ordersApi = {
  getAll: () => fetchApi<Order[]>('/orders'),
  
  getById: (id: number) => fetchApi<Order>(`/orders/${id}`),
  
  create: (data: { shipping_address: string; total_amount: number; items: Array<{ product_id: number; quantity: number; price_at_purchase: number }> }) =>
    fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  updateStatus: (id: number, status: string) =>
    fetchApi<Order>(`/orders/${id}/status?status=${status}`, {
      method: 'PUT',
    }),
    
  createPaymentIntent: (orderId: number) =>
    fetchApi<PaymentIntent>('/orders/payment', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    }),
};
