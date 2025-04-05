import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import { cartApi } from '../lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addItem: (product: Product, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartItems();
    } else {
      setItems([]);
    }
  }, [isAuthenticated]);

  async function fetchCartItems() {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const cartItems = await cartApi.getItems();
      setItems(cartItems);
    } catch (error) {
      console.error('Failed to fetch cart items:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addItem(product: Product, quantity: number) {
    try {
      setIsLoading(true);
      await cartApi.addItem(product.id, quantity);
      await fetchCartItems();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateItemQuantity(itemId: number, quantity: number) {
    try {
      setIsLoading(true);
      await cartApi.updateItem(itemId, quantity);
      await fetchCartItems();
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function removeItem(itemId: number) {
    try {
      setIsLoading(true);
      await cartApi.removeItem(itemId);
      await fetchCartItems();
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function clearCart() {
    try {
      setIsLoading(true);
      await cartApi.clearCart();
      setItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce(
    (total, item) => total + item.quantity * item.product.price,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
