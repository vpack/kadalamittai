import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/use-toast';
import { ordersApi } from '../lib/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_your_stripe_public_key');

function CheckoutForm() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }
    
    if (!name || !address || !city || !state || !zip || !country) {
      toast({
        title: 'Error',
        description: 'Please fill in all shipping information.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      setPaymentError('');
      
      const shippingAddress = `${name}\n${address}\n${city}, ${state} ${zip}\n${country}`;
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price
      }));
      
      const order = await ordersApi.create({
        shipping_address: shippingAddress,
        total_amount: totalPrice,
        items: orderItems
      });
      
      const { client_secret } = await ordersApi.createPaymentIntent(order.id);
      
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: name,
            address: {
              line1: address,
              city: city,
              state: state,
              postal_code: zip,
              country: country
            }
          }
        }
      });
      
      if (result.error) {
        setPaymentError(result.error.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: result.error.message || 'Payment failed. Please try again.',
          variant: 'destructive',
        });
      } else if (result.paymentIntent.status === 'succeeded') {
        await clearCart();
        toast({
          title: 'Order Placed',
          description: 'Your order has been placed successfully!',
        });
        navigate(`/orders/${order.id}`);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast({
        title: 'Checkout Failed',
        description: 'Failed to process your order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">
              Address
            </label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">
                City
              </label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium mb-1">
                State/Province
              </label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="zip" className="block text-sm font-medium mb-1">
                ZIP/Postal Code
              </label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-1">
                Country
              </label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="card" className="block text-sm font-medium mb-1">
              Credit Card
            </label>
            <div className="border rounded-md p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            {paymentError && (
              <p className="text-sm text-red-500 mt-1">{paymentError}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <div className="flex justify-between mb-4">
          <span className="font-semibold">Total:</span>
          <span className="font-bold">${totalPrice.toFixed(2)}</span>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}`}
        </Button>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          By placing your order, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Elements stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-gray-500 block text-sm">Qty: {item.quantity}</span>
                    </div>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
