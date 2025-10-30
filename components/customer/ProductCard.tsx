
import React from 'react';
import { Product } from '../../types';
import Button from '../ui/Button';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col">
      <div className="relative w-full h-48 sm:h-56 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => (e.currentTarget.src = 'https://picsum.photos/300/300?grayscale')}
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-lg font-bold">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-text dark:text-gray-100 mb-2">{product.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-baseline justify-between mb-4 mt-auto">
          <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
          {product.stock > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">In Stock: {product.stock}</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(product.id)} className="flex-grow">
            View Details
          </Button>
          <Button
            size="sm"
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className="flex-grow"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;