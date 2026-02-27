import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyPreOrders from "./pages/MyPreOrders";
import Cart from "./pages/Cart";
import ProductDetails from "./pages/ProductDetails";
import "./App.css";

// Protected Route Component for Admin
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return user?.role === "admin" ? children : <Navigate to="/products" />;
};

// Protected Route Component for Authenticated Users
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route (redirects to products if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return !isAuthenticated ? children : <Navigate to="/products" />;
};

// Import useAuth here since we're using it in the route components
import { useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetails />} />

                {/* Auth Routes (only when NOT logged in) */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } />

                {/* Protected Admin Route */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } />

                {/* Protected Customer Routes */}
                <Route path="/my-preorders" element={
                  <AuthRoute>
                    <MyPreOrders />
                  </AuthRoute>
                } />

                <Route path="/cart" element={
                  <AuthRoute>
                    <Cart />
                  </AuthRoute>
                } />

                {/* 404 Redirect */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;