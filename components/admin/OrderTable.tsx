
import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { ORDER_STATUS_OPTIONS } from '../../constants';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

interface OrderTableProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  loading: boolean;
  error?: string;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, onUpdateStatus, loading, error }) => {
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [updateLoading, setUpdateLoading] = useState<string | null>(null); // Stores ID of order being updated

  const handleEditClick = (order: Order) => {
    setEditingOrderId(order.id);
    setNewStatus(order.status);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus(e.target.value as OrderStatus);
  };

  const handleSaveStatus = async (orderId: string) => {
    if (newStatus && newStatus !== orders.find(o => o.id === orderId)?.status) {
      setUpdateLoading(orderId);
      try {
        await onUpdateStatus(orderId, newStatus);
      } catch (err) {
        console.error("Failed to update order status:", err);
        // Error message will be handled by parent component's state
      } finally {
        setUpdateLoading(null);
        setEditingOrderId(null);
        setNewStatus('');
      }
    } else {
      setEditingOrderId(null);
      setNewStatus('');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case OrderStatus.SHIPPED: return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return <Spinner className="mt-8" />;
  }

  if (error) {
    return <div className="text-red-600 p-4 bg-red-100 dark:bg-red-900 dark:text-red-100 rounded-md">Error: {error}</div>;
  }

  if (orders.length === 0) {
    return <div className="text-gray-600 dark:text-gray-300 text-center py-8">No orders placed yet.</div>;
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Order ID
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.id.substring(0, 8)}...</div>
              </td>
              <td className="px-3 py-4">
                <div className="text-sm text-gray-900 dark:text-gray-100">{order.customerInfo.firstName} {order.customerInfo.lastName}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">${order.totalAmount.toFixed(2)}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.orderDate).toLocaleDateString()}</div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                {editingOrderId === order.id ? (
                  <select
                    value={newStatus}
                    onChange={handleStatusChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  >
                    {ORDER_STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingOrderId === order.id ? (
                  <Button
                    size="sm"
                    onClick={() => handleSaveStatus(order.id)}
                    loading={updateLoading === order.id}
                  >
                    Save
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(order)}>
                    Edit Status
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;