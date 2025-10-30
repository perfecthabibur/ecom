
import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { geminiService } from '../../services/geminiService';

interface ProductFormProps {
  product?: Product; // If provided, form is for editing
  onSubmit: (productData: Omit<Product, 'id'> | Product) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel, loading, error }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'> | Product>(
    product || {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      stock: 0,
      category: '',
    }
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
  };

  const validate = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
      isValid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
      isValid = false;
    }
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
      isValid = false;
    }
    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
      isValid = false;
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      setFormErrors(prev => ({ ...prev, name: 'Product name is required to generate description.' }));
      return;
    }
    setGeminiLoading(true);
    setGeminiError(null);
    try {
      const keywords = formData.description.split(',').map(k => k.trim()).filter(Boolean);
      const generatedDescription = await geminiService.generateProductDescription(formData.name, keywords.length > 0 ? keywords : [formData.name, formData.category]);
      setFormData(prev => ({ ...prev, description: generatedDescription }));
    } catch (err: any) {
      setGeminiError(err.message || 'Failed to generate description.');
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-6">
        {product ? 'Edit Product' : 'Add New Product'}
      </h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Product Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={formErrors.name}
          required
        />
        <Input
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          error={formErrors.category}
          required
        />
      </div>
      <div className="relative mb-4">
        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          error={formErrors.description || geminiError}
          rows={4}
          required
          className="pr-24"
        />
        <Button
          type="button"
          onClick={handleGenerateDescription}
          loading={geminiLoading}
          variant="secondary"
          size="sm"
          className="absolute top-1 right-1 sm:top-8 sm:right-1 md:top-8 md:right-1 mt-1 mr-1"
        >
          Generate
        </Button>
      </div>


      <Input
        label="Image URL"
        name="imageUrl"
        value={formData.imageUrl}
        onChange={handleChange}
        error={formErrors.imageUrl}
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Price"
          name="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          error={formErrors.price}
          required
        />
        <Input
          label="Stock"
          name="stock"
          type="number"
          value={formData.stock}
          onChange={handleChange}
          error={formErrors.stock}
          required
        />
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {product ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;