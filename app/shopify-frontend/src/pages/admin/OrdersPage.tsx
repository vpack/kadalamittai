import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../lib/api';
import { Order, OrderStatus } from '../../types';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { formatDate } from '../../lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast({
        title: 'Success',
        description: 'Order status updated successfully.',
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    }
  };

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

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return OrderStatus.PAID;
      case OrderStatus.PAID:
        return OrderStatus.SHIPPED;
      case OrderStatus.SHIPPED:
        return OrderStatus.DELIVERED;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
          <p className="text-gray-500">There are no orders in the system yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  
                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link to={`/orders/${order.id}`} className="hover:text-blue-600">
                          #{order.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        User #{order.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link to={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          
                          {nextStatus && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, nextStatus)}
                            >
                              Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                            </Button>
                          )}
                          
                          {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, OrderStatus.CANCELLED)}
                              className="text-red-500 border-red-500 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
