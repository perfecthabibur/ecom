
import React, { useState } from 'react';
import { CustomerInfo } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface CheckoutFormProps {
  onSubmit: (customerInfo: CustomerInfo) => void;
  loading: boolean;
  error?: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit, loading, error }) => {
  const [formData, setFormData] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Record<keyof CustomerInfo, string>>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
  };

  const validate = (): boolean => {
    let isValid = true;
    const newErrors: Record<keyof CustomerInfo, string> = { ...formErrors };

    (Object.keys(formData) as Array<keyof CustomerInfo>).forEach(key => {
      if (!formData[key]) {
        newErrors[key] = 'This field is required';
        isValid = false;
      }
    });

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-6">Guest Checkout</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={formErrors.firstName}
          required
        />
        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={formErrors.lastName}
          required
        />
      </div>

      <Input
        label="Phone Number"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        error={formErrors.phone}
        required
      />
      <Input
        label="Shipping Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        error={formErrors.address}
        required
      />

      <Button type="submit" loading={loading} className="w-full mt-6">
        Place Order
      </Button>
    </form>
  );
};

export default CheckoutForm;