import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Input } from '../components/ui/input';

export default function CartPage() {
  const { items, updateItemQuantity, removeItem, totalPrice, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await updateItemQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quantity. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
      toast({
        title: 'Item removed',
        description: 'Item has been removed from your cart.',
      });
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please login to proceed to checkout.',
      });
      navigate('/login', { state: { returnTo: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <p className="mb-6">Looks like you haven't added any products to your cart yet.</p>
        <Link to="/">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-4">Product</th>
                    <th className="text-center pb-4">Quantity</th>
                    <th className="text-right pb-4">Price</th>
                    <th className="text-right pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-4">
                        <div className="flex items-center">
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded mr-4"
                          />
                          <div>
                            <Link to={`/products/${item.product.id}`} className="font-medium hover:text-blue-600">
                              {item.product.name}
                            </Link>
                            <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex justify-center items-center">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center"
                          />
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <Button
                onClick={handleCheckout}
                className="w-full mt-6"
                size="lg"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
