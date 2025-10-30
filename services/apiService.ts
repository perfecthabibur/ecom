
import { Product, Order, CartItem, CustomerInfo, OrderStatus } from '../types';
import { INITIAL_PRODUCTS, ADMIN_CREDENTIALS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// In-memory "database"
let products: Product[] = [...INITIAL_PRODUCTS];
let orders: Order[] = [];

// Helper to simulate API delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const apiService = {
  // --- Admin Authentication ---
  async adminLogin(username: string, passwordHash: string): Promise<boolean> {
    await delay(500); // Simulate network delay
    return username === ADMIN_CREDENTIALS.username && passwordHash === ADMIN_CREDENTIALS.passwordHash;
  },

  // --- Product Management ---
  async getProducts(): Promise<Product[]> {
    await delay(200);
    return products;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    await delay(100);
    return products.find(p => p.id === id);
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    await delay(500);
    const newProduct: Product = { ...product, id: uuidv4() };
    products.push(newProduct);
    return newProduct;
  },

  async updateProduct(updatedProduct: Product): Promise<Product> {
    await delay(500);
    const index = products.findIndex(p => p.id === updatedProduct.id);
    if (index > -1) {
      products[index] = updatedProduct;
      return updatedProduct;
    }
    throw new Error('Product not found');
  },

  async deleteProduct(id: string): Promise<boolean> {
    await delay(500);
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);
    return products.length < initialLength;
  },

  // --- Order Management ---
  async getOrders(): Promise<Order[]> {
    await delay(300);
    return orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    await delay(100);
    return orders.find(o => o.id === id);
  },

  async createOrder(customerInfo: CustomerInfo, items: CartItem[]): Promise<Order> {
    await delay(800);
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Simulate stock deduction
    for (const cartItem of items) {
      const productIndex = products.findIndex(p => p.id === cartItem.id);
      if (productIndex === -1 || products[productIndex].stock < cartItem.quantity) {
        throw new Error(`Not enough stock for ${cartItem.name}`);
      }
      products[productIndex].stock -= cartItem.quantity;
    }

    const newOrder: Order = {
      id: uuidv4(),
      customerInfo,
      items,
      totalAmount,
      status: OrderStatus.PENDING,
      orderDate: new Date().toISOString(),
    };
    orders.push(newOrder);
    return newOrder;
  },

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
    await delay(500);
    const index = orders.findIndex(o => o.id === orderId);
    if (index > -1) {
      orders[index].status = newStatus;
      return orders[index];
    }
    throw new Error('Order not found');
  },
};