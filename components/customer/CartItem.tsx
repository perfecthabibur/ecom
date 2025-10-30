
import React from 'react';
import { CartItem } from '../../types';
import Button from '../ui/Button';

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemoveItem }) => {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1 && newQuantity <= item.stock) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
      <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-md mr-4" />
      <div className="flex-grow">
        <h4 className="font-semibold text-lg text-text dark:text-gray-100">{item.name}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-sm">${item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min="1"
          max={item.stock}
          value={item.quantity}
          onChange={handleQuantityChange}
          className="w-16 p-2 border border-gray-300 dark:border-gray-600 rounded-md text-center bg-white dark:bg-gray-700 dark:text-gray-100"
        />
        <span className="text-lg font-medium text-primary">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
        <Button variant="danger" size="sm" onClick={() => onRemoveItem(item.id)} className="ml-2">
          Remove
        </Button>
      </div>
    </div>
  );
};

export default CartItem;