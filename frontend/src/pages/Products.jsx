import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Tag, Package, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import "./Products.css";

const API = "https://techaesthetics.onrender.com";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptProduct, setPromptProduct] = useState(null);
  const [userPreOrders, setUserPreOrders] = useState({});

  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (isAuthenticated) {
      fetchUserPreOrders();
    }
  }, [isAuthenticated, token]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(API + "/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(API + "/api/products/");
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load products. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPreOrders = async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await fetch(API + "/api/preorders/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const preOrderMap = {};
        data.forEach(po => {
          if (po.status === 'PENDING') {
            preOrderMap[po.product._id] = po;
          }
        });
        setUserPreOrders(preOrderMap);
      }
    } catch (err) {
      console.error("Failed to fetch pre-orders:", err);
    }
  };

  const handleAddToCart = async (product, quantity) => {
    if (!isAuthenticated) {
      setPromptProduct({ product, quantity });
      setShowLoginPrompt(true);
      return;
    }

    const isPreOrderRequest = product.isPreOrder || product.stock <= 0;
    if (!isPreOrderRequest && quantity > product.stock) {
      alert(`Sorry, only ${product.stock} units available`);
      return;
    }

    if (isPreOrderRequest) {
      try {
        const response = await fetch(API + "/api/preorders", {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ productId: product._id, quantity }),
        });
        const data = await response.json();
        if (response.ok) {
          showToast(`✅ Pre-order for ${quantity} × ${product.name} placed!`);
          setUserPreOrders(prev => ({ ...prev, [product._id]: data }));
        } else {
          throw new Error(data.error || 'Failed');
        }
      } catch (err) {
        alert("Pre-order failed: " + err.message);
      }
    } else {
      addToCart(product, quantity);
      showToast(`✅ Added ${quantity} × ${product.name} to cart`);
    }
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
    if (filter === "all") return true;
    if (filter === "in-stock") return product.status === "in-stock";
    if (filter === "low-stock") return product.status === "low-stock";
    if (filter === "out-of-stock") return product.status === "out-of-stock";
    return true;
  }).sort((a, b) => {
    switch (sortOption) {
      case "price-asc": return a.retailPrice - b.retailPrice;
      case "price-desc": return b.retailPrice - a.retailPrice;
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      default: return 0;
    }
  });

  if (loading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-error">
        <AlertTriangle size={64} />
        <h3>Oops!</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={fetchProducts}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <h1 className="products-title">Our <span className="gradient-text">Collection</span></h1>
        <p className="products-subtitle">Discover premium gadgets and minimalist decor</p>
      </div>

      <div className="products-toolbar">
        <div className="search-bar">
          <span className="search-icon"><Search size={18} /></span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="filter-dropdown">
          <option value="all">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="filter-dropdown">
          <option value="default">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products">
          <Package size={64} />
          <h3>No products found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={handleAddToCart}
              isLoggedIn={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;