
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  customerInfo: CustomerInfo;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string; // ISO 8601 string
}

export interface AdminUser {
  username: string;
  passwordHash: string;
}

export type View = 'customer' | 'admin-login' | 'admin-dashboard' | 'product-details' | 'cart' | 'checkout' | 'order-confirmation';

export interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isConfirmOnly?: boolean;
}