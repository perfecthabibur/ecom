
import { Product, AdminUser, OrderStatus } from './types';

export const ADMIN_CREDENTIALS: AdminUser = {
  username: 'admin',
  passwordHash: 'adminpass', // In a real app, this would be hashed and stored securely.
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-fidelity wireless headphones with noise cancellation and a comfortable design. Perfect for music lovers on the go.',
    price: 99.99,
    imageUrl: 'https://picsum.photos/300/300?random=1',
    stock: 50,
    category: 'Electronics',
  },
  {
    id: 'prod2',
    name: 'Smart Fitness Tracker',
    description: 'Track your steps, heart rate, sleep, and more with this sleek and waterproof fitness tracker. Connects to your smartphone for detailed insights.',
    price: 49.95,
    imageUrl: 'https://picsum.photos/300/300?random=2',
    stock: 120,
    category: 'Wearables',
  },
  {
    id: 'prod3',
    name: 'Ergonomic Office Chair',
    description: 'Designed for ultimate comfort and support during long work hours. Features adjustable lumbar support, armrests, and headrest.',
    price: 249.00,
    imageUrl: 'https://picsum.photos/300/300?random=3',
    stock: 30,
    category: 'Home & Office',
  },
  {
    id: 'prod4',
    name: '4K Ultra HD Smart TV',
    description: 'Experience stunning visuals with this 55-inch 4K UHD Smart TV. Built-in streaming apps and voice control for seamless entertainment.',
    price: 599.99,
    imageUrl: 'https://picsum.photos/300/300?random=4',
    stock: 15,
    category: 'Electronics',
  },
  {
    id: 'prod5',
    name: 'Espresso Machine',
    description: 'Brew cafe-quality espresso at home with this compact and easy-to-use machine. Features a milk frother for lattes and cappuccinos.',
    price: 189.50,
    imageUrl: 'https://picsum.photos/300/300?random=5',
    stock: 25,
    category: 'Kitchen Appliances',
  },
];

export const ORDER_STATUS_OPTIONS: OrderStatus[] = Object.values(OrderStatus);