
import React from 'react';
import Button from '../ui/Button';

interface AdminLayoutProps {
  children: React.ReactNode;
  onNavigate: (view: 'admin-dashboard' | 'admin-products' | 'admin-orders') => void;
  onLogout: () => void;
  currentAdminView: 'admin-dashboard' | 'admin-products' | 'admin-orders';
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, onNavigate, onLogout, currentAdminView, theme, toggleTheme }) => {
  const getNavLinkClass = (view: string) =>
    `px-4 py-2 rounded-md transition-colors duration-200 ${
      currentAdminView === view
        ? 'bg-primary text-white shadow-md'
        : 'text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
        <nav className="hidden sm:flex space-x-4">
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className={getNavLinkClass('admin-dashboard')}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('admin-products')}
            className={getNavLinkClass('admin-products')}
          >
            Products
          </button>
          <button
            onClick={() => onNavigate('admin-orders')}
            className={getNavLinkClass('admin-orders')}
          >
            Orders
          </button>
        </nav>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={toggleTheme} className="hidden sm:inline-flex">
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
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="sm:hidden bg-white dark:bg-gray-800 shadow-md py-2 px-4 flex justify-around border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onNavigate('admin-dashboard')}
          className={getNavLinkClass('admin-dashboard')}
        >
          Dashboard
        </button>
        <button
          onClick={() => onNavigate('admin-products')}
          className={getNavLinkClass('admin-products')}
        >
          Products
        </button>
        <button
          onClick={() => onNavigate('admin-orders')}
          className={getNavLinkClass('admin-orders')}
        >
          Orders
        </button>
      </nav>

      <main className="flex-grow p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;