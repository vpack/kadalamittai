import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '../lib/api';
import { Order, OrderStatus } from '../types';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { formatDate, formatCurrency } from '../lib/utils';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await ordersApi.getById(parseInt(id));
        setOrder(data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast({
          title: 'Error',
          description: 'Failed to load order details. Please try again later.',
          variant: 'destructive',
        });
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id, navigate, toast]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PAID:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="mb-6">The order you're looking for doesn't exist or has been removed.</p>
        <Link to="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order #{order.id}</h1>
        <Link to="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-2">Order Information</h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="ml-2">{formatDate(order.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-semibold">${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
          <p className="whitespace-pre-line">{order.shipping_address}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <h2 className="text-lg font-semibold p-6 border-b">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded mr-4"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">{item.product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    ${item.price_at_purchase.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    ${(item.price_at_purchase * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  Total
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                  ${order.total_amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
