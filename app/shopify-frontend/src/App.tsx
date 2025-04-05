import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from './components/ui/toaster';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminProductsPage from './pages/admin/ProductsPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types';

function ProtectedRoute({ children, requiredRole }: { children: JSX.Element, requiredRole?: UserRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products/:id" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } />
        <Route path="orders" element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        } />
        <Route path="orders/:id" element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        } />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        
        {/* Admin routes */}
        <Route path="admin" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="admin/products" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <AdminProductsPage />
          </ProtectedRoute>
        } />
        <Route path="admin/orders" element={
          <ProtectedRoute requiredRole={UserRole.ADMIN}>
            <AdminOrdersPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
