import React, { useEffect, useState } from 'react';
import { productsApi } from '../../lib/api';
import { Product, ProductCategory } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../components/ui/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreateProduct = () => {
    setCurrentProduct({
      name: '',
      description: '',
      price: 0,
      image_url: '',
      category: ProductCategory.OTHER,
      inventory_count: 0,
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      await productsApi.delete(id);
      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentProduct({
      ...currentProduct,
      [name]: name === 'price' || name === 'inventory_count' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isCreating) {
        await productsApi.create(currentProduct as Omit<Product, 'id' | 'created_at'>);
        toast({
          title: 'Success',
          description: 'Product created successfully.',
        });
      } else if (isEditing && currentProduct.id) {
        await productsApi.update(
          currentProduct.id,
          currentProduct as Omit<Product, 'id' | 'created_at'>
        );
        toast({
          title: 'Success',
          description: 'Product updated successfully.',
        });
      }
      
      setIsEditing(false);
      setIsCreating(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setCurrentProduct({});
  };

  if (loading && !isEditing && !isCreating) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Products</h1>
        {!isEditing && !isCreating && (
          <Button onClick={handleCreateProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>
      
      {(isEditing || isCreating) ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">
            {isCreating ? 'Create New Product' : 'Edit Product'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Product Name
              </label>
              <Input
                id="name"
                name="name"
                value={currentProduct.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={currentProduct.description || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-1">
                  Price
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentProduct.price || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="inventory_count" className="block text-sm font-medium mb-1">
                  Inventory Count
                </label>
                <Input
                  id="inventory_count"
                  name="inventory_count"
                  type="number"
                  min="0"
                  value={currentProduct.inventory_count || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={currentProduct.category || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {Object.values(ProductCategory).map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium mb-1">
                  Image URL
                </label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={currentProduct.image_url || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button type="submit">
                {isCreating ? 'Create Product' : 'Update Product'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.inventory_count === 0 ? 'bg-red-100 text-red-800' :
                        product.inventory_count < 5 ? 'bg-orange-100 text-orange-800' :
                        product.inventory_count < 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.inventory_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
