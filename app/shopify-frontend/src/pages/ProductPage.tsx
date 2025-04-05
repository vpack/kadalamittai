import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi } from '../lib/api';
import { Product } from '../types';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/use-toast';
import { Input } from '../components/ui/input';
import { Minus, Plus } from 'lucide-react';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await productsApi.getById(parseInt(id));
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product details. Please try again later.',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id, navigate, toast]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addItem(product, quantity);
      toast({
        title: 'Added to cart',
        description: `${quantity} ${quantity === 1 ? 'item' : 'items'} added to your cart.`,
      });
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.inventory_count) {
      setQuantity(quantity + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600 mb-4">${product.price.toFixed(2)}</p>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Category</h2>
            <p className="text-gray-700 capitalize">{product.category}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Availability</h2>
            <p className="text-gray-700">
              {product.inventory_count > 0
                ? `In Stock (${product.inventory_count} available)`
                : 'Out of Stock'}
            </p>
          </div>
          
          {product.inventory_count > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Quantity</h2>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={product.inventory_count}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-20 mx-2 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={increaseQuantity}
                  disabled={quantity >= product.inventory_count}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleAddToCart}
            disabled={product.inventory_count === 0}
            className="w-full"
            size="lg"
          >
            {product.inventory_count === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
