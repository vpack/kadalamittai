import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../lib/api';
import { Product, ProductCategory } from '../types';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../components/ui/use-toast';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await productsApi.getAll();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [toast]);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: ProductCategory.ELECTRONICS, label: 'Electronics' },
    { value: ProductCategory.CLOTHING, label: 'Clothing' },
    { value: ProductCategory.HOME, label: 'Home' },
    { value: ProductCategory.BOOKS, label: 'Books' },
    { value: ProductCategory.TOYS, label: 'Toys' },
    { value: ProductCategory.OTHER, label: 'Other' },
  ];

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product, 1);
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to ShopifyClone</h1>
        <p className="text-gray-600 max-w-2xl">
          Browse our collection of high-quality products. From electronics to clothing, we have everything you need.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.value as ProductCategory | 'all')}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading products...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Link to={`/products/${product.id}`}>
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <div className="p-4">
                <Link to={`/products/${product.id}`}>
                  <h2 className="text-lg font-semibold mb-2 hover:text-blue-600">{product.name}</h2>
                </Link>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                  <Button onClick={() => handleAddToCart(product)} size="sm">
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
