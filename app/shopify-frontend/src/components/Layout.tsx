import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Home } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { UserRole } from '../types';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600">ShopifyClone</Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600 flex items-center">
              <Home className="w-5 h-5 mr-1" />
              <span>Home</span>
            </Link>
            
            {isAuthenticated && (
              <Link to="/orders" className="text-gray-600 hover:text-blue-600 flex items-center">
                <Package className="w-5 h-5 mr-1" />
                <span>Orders</span>
              </Link>
            )}
            
            {isAuthenticated && user?.role === UserRole.ADMIN && (
              <Link to="/admin" className="text-gray-600 hover:text-blue-600">
                Admin
              </Link>
            )}
            
            <Link to="/cart" className="text-gray-600 hover:text-blue-600 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-1" />
              <span>Cart {totalItems > 0 && `(${totalItems})`}</span>
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{user?.full_name}</span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" className="flex items-center">
                    <User className="w-5 h-5 mr-1" />
                    <span>Login</span>
                  </Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-gray-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600">&copy; 2025 ShopifyClone. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-blue-600">Terms</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
