import React, { useState, useEffect, useCallback } from 'react';
import { Product, Order, CartItem, CustomerInfo, OrderStatus, View, ModalState } from './types';
import { apiService } from './services/apiService';
import useCart from './hooks/useCart';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Spinner from './components/ui/Spinner';
import Modal from './components/ui/Modal';
import ProductCard from './components/customer/ProductCard';
import CartItemComponent from './components/customer/CartItem';
import CheckoutForm from './components/customer/CheckoutForm';
import AdminLayout from './components/admin/AdminLayout';
import ProductTable from './components/admin/ProductTable';
import ProductForm from './components/admin/ProductForm';
import OrderTable from './components/admin/OrderTable';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('customer');
  const [adminLoggedIn, setAdminLoggedIn] = useState(sessionStorage.getItem('adminLoggedIn') === 'true');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme === 'dark' ? 'dark' : 'light';
  });

  // Apply theme class to documentElement
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);


  // Customer-facing state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Cart state
  const { cartItems, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalAmount } = useCart();

  // Admin panel state
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminPanelLoading, setAdminPanelLoading] = useState(false);
  const [adminPanelError, setAdminPanelError] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [currentAdminContentView, setCurrentAdminContentView] = useState<'admin-dashboard' | 'admin-products' | 'admin-orders'>('admin-dashboard');

  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, title: '', message: '' });

  const openModal = (state: ModalState) => setModalState({ ...state, isOpen: true });
  const closeModal = () => setModalState({ isOpen: false, title: '', message: '' });

  // --- Customer-facing functions ---
  const fetchProducts = useCallback(async () => {
    setCustomerLoading(true);
    setCustomerError(null);
    try {
      const fetchedProducts = await apiService.getProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      setCustomerError('Failed to load products.');
      console.error("Error fetching products:", err);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = useCallback((product: Product, quantity: number = 1) => {
    if (product.stock === 0) {
      openModal({
        isOpen: true,
        title: 'Out of Stock',
        message: `${product.name} is currently out of stock.`,
        isConfirmOnly: true,
        confirmText: 'OK',
      });
      return;
    }
    const currentCartItem = cartItems.find(item => item.id === product.id);
    if (currentCartItem && (currentCartItem.quantity + quantity > product.stock)) {
      openModal({
        isOpen: true,
        title: 'Not Enough Stock',
        message: `You can only add ${product.stock - currentCartItem.quantity} more of ${product.name} to your cart.`,
        isConfirmOnly: true,
        confirmText: 'OK',
      });
      return;
    }

    addToCart(product, quantity);
    openModal({
      isOpen: true,
      title: 'Added to Cart!',
      message: `${product.name} has been added to your cart.`,
      isConfirmOnly: true,
      confirmText: 'OK',
    });
  }, [addToCart, cartItems]);

  const handleViewDetails = useCallback(async (productId: string) => {
    setCustomerLoading(true);
    setCustomerError(null);
    try {
      const product = await apiService.getProductById(productId);
      if (product) {
        setSelectedProduct(product);
        setCurrentView('product-details');
      } else {
        setCustomerError('Product not found.');
      }
    } catch (err) {
      setCustomerError('Failed to load product details.');
      console.error("Error fetching product details:", err);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const handlePlaceOrder = useCallback(async (customerInfo: CustomerInfo) => {
    setAdminPanelLoading(true); // Reusing for general loading
    setAdminPanelError(null);
    try {
      if (cartItems.length === 0) {
        throw new Error("Your cart is empty. Please add items before checking out.");
      }
      const order = await apiService.createOrder(customerInfo, cartItems);
      setLastPlacedOrder(order);
      clearCart();
      fetchProducts(); // Refresh product stock
      setCurrentView('order-confirmation');
    } catch (err: any) {
      setAdminPanelError(err.message || "Failed to place order. Please try again.");
      console.error("Error placing order:", err);
    } finally {
      setAdminPanelLoading(false);
    }
  }, [cartItems, clearCart, fetchProducts]);

  // --- Admin Authentication ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      const success = await apiService.adminLogin(adminUsername, adminPassword);
      if (success) {
        setAdminLoggedIn(true);
        sessionStorage.setItem('adminLoggedIn', 'true');
        setCurrentView('admin-dashboard');
      } else {
        setAdminLoginError('Invalid username or password.');
      }
    } catch (err) {
      setAdminLoginError('An error occurred during login. Please try again.');
      console.error("Admin login error:", err);
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleAdminLogout = useCallback(() => {
    setAdminLoggedIn(false);
    sessionStorage.removeItem('adminLoggedIn');
    setCurrentView('customer');
    setAdminUsername('');
    setAdminPassword('');
  }, []);

  // --- Admin Panel Data Fetching ---
  const fetchAdminData = useCallback(async () => {
    if (!adminLoggedIn) return;
    setAdminPanelLoading(true);
    setAdminPanelError(null);
    try {
      const [productsData, ordersData] = await Promise.all([
        apiService.getProducts(),
        apiService.getOrders(),
      ]);
      setAdminProducts(productsData);
      setAdminOrders(ordersData);
    } catch (err) {
      setAdminPanelError('Failed to load admin data.');
      console.error("Error fetching admin data:", err);
    } finally {
      setAdminPanelLoading(false);
    }
  }, [adminLoggedIn]);

  useEffect(() => {
    if (adminLoggedIn && currentView.startsWith('admin-')) {
      fetchAdminData();
    }
  }, [adminLoggedIn, currentView, fetchAdminData]);

  // --- Admin Product Management ---
  const handleAddProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
    setAdminPanelLoading(true);
    setAdminPanelError(null);
    try {
      await apiService.addProduct(productData);
      setShowProductForm(false);
      setEditingProduct(undefined);
      fetchAdminData();
      fetchProducts(); // Update customer view
    } catch (err) {
      setAdminPanelError('Failed to add product.');
      console.error("Error adding product:", err);
    } finally {
      setAdminPanelLoading(false);
    }
  }, [fetchAdminData, fetchProducts]);

  const handleUpdateProduct = useCallback(async (productData: Product) => {
    setAdminPanelLoading(true);
    setAdminPanelError(null);
    try {
      await apiService.updateProduct(productData);
      setShowProductForm(false);
      setEditingProduct(undefined);
      fetchAdminData();
      fetchProducts(); // Update customer view
    } catch (err) {
      setAdminPanelError('Failed to update product.');
      console.error("Error updating product:", err);
    } finally {
      setAdminPanelLoading(false);
    }
  }, [fetchAdminData, fetchProducts]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    setAdminPanelLoading(true);
    setAdminPanelError(null);
    try {
      await apiService.deleteProduct(productId);
      fetchAdminData();
      fetchProducts(); // Update customer view
      openModal({
        isOpen: true,
        title: 'Product Deleted',
        message: 'Product has been successfully deleted.',
        isConfirmOnly: true,
        confirmText: 'OK',
      });
    } catch (err) {
      setAdminPanelError('Failed to delete product.');
      console.error("Error deleting product:", err);
    } finally {
      setAdminPanelLoading(false);
    }
  }, [fetchAdminData, fetchProducts]);

  // --- Admin Order Management ---
  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setAdminPanelLoading(true);
    setAdminPanelError(null);
    try {
      await apiService.updateOrderStatus(orderId, status);
      fetchAdminData();
      openModal({
        isOpen: true,
        title: 'Order Status Updated',
        message: `Order ${orderId.substring(0, 8)} status updated to ${status}.`,
        isConfirmOnly: true,
        confirmText: 'OK',
      });
    } catch (err) {
      setAdminPanelError('Failed to update order status.');
      console.error("Error updating order status:", err);
    } finally {
      setAdminPanelLoading(false);
    }
  }, [fetchAdminData]);

  // --- Render logic based on currentView ---
  const renderContent = () => {
    // Customer Views
    if (currentView === 'customer') {
      return (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center text-text dark:text-gray-100 mb-8">Our Products</h2>
          {customerLoading && <Spinner className="mt-8" />}
          {customerError && <p className="text-red-600 dark:text-red-300 text-center">{customerError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {!customerLoading && products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onViewDetails={() => handleViewDetails(product.id)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (currentView === 'product-details') {
      if (!selectedProduct) return <p className="text-center py-8 text-gray-600 dark:text-gray-300">Product not found.</p>;
      return (
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => setCurrentView('customer')} className="mb-6">
            &larr; Back to Products
          </Button>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 lg:p-10 flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <div className="w-full lg:w-1/2 flex justify-center">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="max-w-full h-auto max-h-96 object-contain rounded-lg shadow-sm"
                onError={(e) => (e.currentTarget.src = 'https://picsum.photos/400/400?grayscale')}
              />
            </div>
            <div className="w-full lg:w-1/2">
              <h2 className="text-3xl font-bold text-text dark:text-gray-100 mb-3">{selectedProduct.name}</h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">{selectedProduct.description}</p>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-primary mr-4">${selectedProduct.price.toFixed(2)}</span>
                <span className={`text-lg font-medium ${selectedProduct.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedProduct.stock > 0 ? `In Stock: ${selectedProduct.stock}` : 'Out of Stock'}
                </span>
              </div>
              <Button onClick={() => handleAddToCart(selectedProduct)} disabled={selectedProduct.stock === 0} className="w-full sm:w-auto mt-4">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'cart') {
      return (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center text-text dark:text-gray-100 mb-8">Your Shopping Cart</h2>
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-300 py-10">
              <p className="text-lg mb-4">Your cart is empty.</p>
              <Button onClick={() => setCurrentView('customer')}>Continue Shopping</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {cartItems.map(item => (
                  <CartItemComponent
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeFromCart}
                  />
                ))}
              </div>
              <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-fit sticky top-20">
                <h3 className="text-2xl font-bold text-text dark:text-gray-100 mb-4">Order Summary</h3>
                <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-2">
                  <span>Subtotal ({totalItems} items):</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-4">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-xl text-text dark:text-gray-100 border-t pt-4 mt-4 dark:border-gray-700">
                  <span>Total:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <Button onClick={() => setCurrentView('checkout')} className="w-full mt-6">
                  Proceed to Checkout
                </Button>
                <Button variant="outline" onClick={clearCart} className="w-full mt-3">
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (currentView === 'checkout') {
      return (
        <div className="container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => setCurrentView('cart')} className="mb-6">
            &larr; Back to Cart
          </Button>
          <CheckoutForm
            onSubmit={handlePlaceOrder}
            loading={adminPanelLoading} // Reusing for general loading
            error={adminPanelError} // Reusing for general error
          />
        </div>
      );
    }

    if (currentView === 'order-confirmation') {
      if (!lastPlacedOrder) {
        return (
          <div className="text-center py-8">
            <p className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">No order to confirm.</p>
            <Button onClick={() => setCurrentView('customer')}>Continue Shopping</Button>
          </div>
        );
      }
      return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
            <svg className="mx-auto h-20 w-20 text-green-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-3xl font-bold text-green-700 dark:text-green-500 mb-4">Order Placed Successfully!</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">Thank you for your purchase, {lastPlacedOrder.customerInfo.firstName}!</p>
            <p className="text-md text-gray-600 dark:text-gray-400 mb-6">Your order ID is: <span className="font-semibold">{lastPlacedOrder.id}</span></p>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 text-left">
              <h3 className="text-xl font-bold text-text dark:text-gray-100 mb-4">Order Details:</h3>
              <p className="mb-2 text-gray-700 dark:text-gray-300"><strong>Total Amount:</strong> ${lastPlacedOrder.totalAmount.toFixed(2)}</p>
              <p className="mb-4 text-gray-700 dark:text-gray-300"><strong>Status:</strong> {lastPlacedOrder.status}</p>

              <h4 className="font-semibold text-text dark:text-gray-100 mb-2">Items:</h4>
              <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300">
                {lastPlacedOrder.items.map(item => (
                  <li key={item.id} className="text-gray-700 dark:text-gray-300">
                    {item.name} x {item.quantity} (${(item.price * item.quantity).toFixed(2)})
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold text-text dark:text-gray-100 mb-2">Shipping To:</h4>
              <p className="text-gray-700 dark:text-gray-300">{lastPlacedOrder.customerInfo.firstName} {lastPlacedOrder.customerInfo.lastName}</p>
              <p className="text-gray-700 dark:text-gray-300">{lastPlacedOrder.customerInfo.address}</p>
              <p className="text-gray-700 dark:text-gray-300">Phone: {lastPlacedOrder.customerInfo.phone}</p>
            </div>

            <Button onClick={() => setCurrentView('customer')} className="mt-8">
              Continue Shopping
            </Button>
          </div>
        </div>
      );
    }

    // Admin Login View
    if (currentView === 'admin-login' && !adminLoggedIn) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900 px-4">
          <form onSubmit={handleAdminLogin} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-3xl font-bold text-center text-primary mb-6">Admin Login</h2>
            {adminLoginError && <p className="text-red-600 dark:text-red-300 text-center mb-4">{adminLoginError}</p>}
            <Input
              label="Username"
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={adminLoginLoading} className="w-full mt-6">
              Login
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('customer')} className="w-full mt-3">
              Back to Customer Site
            </Button>
          </form>
        </div>
      );
    }

    // Admin Panel Views
    if (adminLoggedIn && currentView.startsWith('admin-')) {
      return (
        <AdminLayout
          onNavigate={(view) => {
            setCurrentAdminContentView(view);
            setShowProductForm(false); // Hide form when navigating
            setEditingProduct(undefined);
          }}
          onLogout={handleAdminLogout}
          // Fix: Changed 'currentAdminContentView' to 'currentAdminView' to match AdminLayoutProps.
          currentAdminView={currentAdminContentView}
          theme={theme}
          toggleTheme={toggleTheme}
        >
          {adminPanelLoading && <Spinner className="mt-8" />}
          {adminPanelError && <p className="text-red-600 p-4 bg-red-100 dark:bg-red-900 dark:text-red-100 rounded-md mb-4">Error: {adminPanelError}</p>}

          {currentAdminContentView === 'admin-dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-text dark:text-gray-100 mb-3">Total Products</h3>
                <p className="text-4xl font-semibold text-primary">{adminProducts.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-text dark:text-gray-100 mb-3">Total Orders</h3>
                <p className="text-4xl font-semibold text-primary">{adminOrders.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-text dark:text-gray-100 mb-3">Revenue (Mock)</h3>
                <p className="text-4xl font-semibold text-primary">${adminOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          {currentAdminContentView === 'admin-products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-text dark:text-gray-100">Product Management</h2>
                <Button onClick={() => {
                  setShowProductForm(true);
                  setEditingProduct(undefined);
                }}>
                  Add New Product
                </Button>
              </div>
              {showProductForm ? (
                <ProductForm
                  product={editingProduct}
                  onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                  onCancel={() => {
                    setShowProductForm(false);
                    setEditingProduct(undefined);
                  }}
                  loading={adminPanelLoading}
                  error={adminPanelError}
                />
              ) : (
                <ProductTable
                  products={adminProducts}
                  onEdit={(product) => {
                    setEditingProduct(product);
                    setShowProductForm(true);
                  }}
                  onDelete={handleDeleteProduct}
                  loading={adminPanelLoading}
                  error={adminPanelError}
                />
              )}
            </div>
          )}

          {currentAdminContentView === 'admin-orders' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-text dark:text-gray-100 mb-6">Order Management</h2>
              <OrderTable
                orders={adminOrders}
                onUpdateStatus={handleUpdateOrderStatus}
                loading={adminPanelLoading}
                error={adminPanelError}
              />
            </div>
          )}
        </AdminLayout>
      );
    }

    // Default or fallback (should not be reached if state is managed correctly)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">Welcome!</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Select a mode to continue.</p>
        <div className="flex space-x-4">
          <Button onClick={() => setCurrentView('customer')}>Customer Site</Button>
          <Button variant="secondary" onClick={() => setCurrentView('admin-login')}>Admin Login</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Navigation for customer view */}
      {currentView.startsWith('customer') || currentView === 'product-details' || currentView === 'cart' || currentView === 'checkout' || currentView === 'order-confirmation' ? (
        <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 sticky top-0 z-30">
          <div className="container mx-auto flex items-center justify-between">
            <button onClick={() => setCurrentView('customer')} className="text-2xl font-bold text-primary hover:text-secondary transition-colors duration-200">
              MyEcom
            </button>
            <nav className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setCurrentView('customer')} className="hidden sm:inline-flex">
                Products
              </Button>
              <Button onClick={() => setCurrentView('cart')} className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1a1 1 0 011 1v2.382l7.929 4.357.917 1.655c.441.805 1.776.805 2.217 0l.917-1.655L19 10a1 1 0 00-1-1h-2a1 1 0 00-.917.555L14 11.414l-1.293-2.327c-.63-.997-2.007-.997-2.636 0L8.586 11.414l-1.293-2.327A1 1 0 005 8H3a1 1 0 00-1 1v8a1 1 0 001 1h2a1 1 0 001-1v-2h6v2a1 1 0 001 1h2a1 1 0 001-1v-8zm11 0a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V2a1 1 0 00-1-1h-2z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 2.513 0 4.847-.96 6.598-2.538Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.364-.386-1.591-1.591M3 12H5.25m-.386-6.364 1.591-1.591M12 12.75a3 .25 3 0 1 0 0-5.5a3 .25 3 0 0 0 0 5.5Z" />
                  </svg>
                )}
              </Button>
              <Button variant="secondary" onClick={() => setCurrentView('admin-login')}>
                Admin
              </Button>
            </nav>
          </div>
        </header>
      ) : null}

      {/* Main content rendering */}
      {renderContent()}

      {/* Persistent Chatbot button for customer view */}
      {(currentView.startsWith('customer') || currentView === 'product-details' || currentView === 'cart' || currentView === 'checkout' || currentView === 'order-confirmation') && (
        <Chatbot />
      )}

      {/* Universal Modal */}
      <Modal modalState={modalState} onClose={closeModal} />
    </div>
  );
};

export default App;