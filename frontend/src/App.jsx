import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";

// Lazy-loaded pages for performance
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MyPreOrders = lazy(() => import("./pages/MyPreOrders"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Cart = lazy(() => import("./pages/Cart"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Categories = lazy(() => import("./pages/Categories"));

// Loading fallback component
const PageLoader = () => (
  <div className="page-loader-container">
    <div className="loading-spinner"></div>
    <p>Loading Tech Aesthetics...</p>
  </div>
);

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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/category/:categoryName" element={<CategoryPage />} />
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

                  <Route path="/my-orders" element={
                    <AuthRoute>
                      <MyOrders />
                    </AuthRoute>
                  } />

                  {/* 404 Redirect */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;