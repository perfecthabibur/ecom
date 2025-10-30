
import React, { useState } from 'react';
import { Product } from '../../types';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import { ModalState } from '../../types';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => Promise<void>;
  loading: boolean;
  error?: string;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete, loading, error }) => {
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null); // Stores ID of product being deleted
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, title: '', message: '' });

  const openDeleteConfirmModal = (product: Product) => {
    setModalState({
      isOpen: true,
      title: 'Confirm Delete',
      message: `Are you sure you want to delete product "${product.name}"? This action cannot be undone.`,
      onConfirm: () => handleDelete(product.id),
      onCancel: () => closeModal(),
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, title: '', message: '' });
  };

  const handleDelete = async (productId: string) => {
    setDeleteLoading(productId);
    try {
      await onDelete(productId);
    } catch (err) {
      console.error("Failed to delete product:", err);
      // Error message will be handled by parent component's state
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return <Spinner className="mt-8" />;
  }

  if (error) {
    return <div className="text-red-600 p-4 bg-red-100 dark:bg-red-900 dark:text-red-100 rounded-md">Error: {error}</div>;
  }

  if (products.length === 0) {
    return <div className="text-gray-600 dark:text-gray-300 text-center py-8">No products found.</div>;
  }

  return (
    <>
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Image
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-3 py-4 whitespace-nowrap">
                  <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{product.name}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{product.category}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">${product.price.toFixed(2)}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="outline" size="sm" onClick={() => onEdit(product)} className="mr-2">
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openDeleteConfirmModal(product)}
                    loading={deleteLoading === product.id}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal modalState={modalState} onClose={closeModal} />
    </>
  );
};

export default ProductTable;