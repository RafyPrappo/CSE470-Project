import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [badgeExiting, setBadgeExiting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptProduct, setPromptProduct] = useState(null);
  
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/products/");
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load products. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product, quantity) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      setPromptProduct({ product, quantity });
      setShowLoginPrompt(true);
      return;
    }

    // Check if trying to add more than available stock
    if (quantity > product.stock) {
      alert(`Sorry, only ${product.stock} units available`);
      return;
    }

    try {
      // Call the order endpoint to decrease stock
      const response = await fetch(`http://localhost:5000/api/products/${product._id}/order`, {
        method: 'PUT',
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          setShowLoginPrompt(true);
          return;
        }
        throw new Error(data.error || 'Failed to update stock');
      }

      // Update local state with the product returned from server
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === product._id ? data.product : p
        )
      );

      // Update local cart state
      const cartItem = {
        ...product,
        cartQuantity: quantity,
        addedAt: new Date().toISOString()
      };
      setCartItems([...cartItems, cartItem]);

      // Show success message
      const toast = document.createElement('div');
      toast.className = 'cart-toast';
      toast.innerHTML = `✅ Added ${quantity} × ${product.name} to cart`;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);

    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert(`Failed to add to cart: ${error.message}`);
      throw error;
    }
  };

  const handleNotifyMe = async (product) => {
    if (!isAuthenticated) {
      setPromptProduct({ product, quantity: 0 });
      setShowLoginPrompt(true);
      return;
    }

    try {
      alert(`🔔 We'll notify you when ${product.name} is back in stock!`);
    } catch (error) {
      console.error("Notification error:", error);
      alert("Failed to set notification. Please try again.");
    }
  };

  // Filter products based on status and search
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filter === "all") return true;
    if (filter === "in-stock") return product.status === "in-stock";
    if (filter === "low-stock") return product.status === "low-stock";
    if (filter === "out-of-stock") return product.status === "out-of-stock";
    
    return true;
  });

  const getActiveFilterLabel = () => {
    const filters = {
      "all": "All Products",
      "in-stock": "In Stock",
      "low-stock": "Low Stock",
      "out-of-stock": "Out of Stock"
    };
    return filters[filter];
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    
    if (filter !== "all" && newFilter === "all") {
      setBadgeExiting(true);
      setTimeout(() => {
        setBadgeExiting(false);
        setFilter(newFilter);
      }, 200);
    } else {
      setIsFiltering(true);
      setTimeout(() => {
        setFilter(newFilter);
        setTimeout(() => {
          setIsFiltering(false);
        }, 300);
      }, 150);
    }
  };

  // Login Prompt Modal
  const LoginPromptModal = () => (
    <div className="modal-overlay" onClick={() => setShowLoginPrompt(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">🔒</div>
        <h3>Login Required</h3>
        <p>Please login or create an account to {promptProduct?.quantity > 0 ? 'add items to cart' : 'get notified'}</p>
        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={() => setShowLoginPrompt(false)}>
            Cancel
          </button>
          <button className="modal-btn primary" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="modal-btn accent" onClick={() => navigate("/register")}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner"></div>
        <p>Loading amazing products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-error">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={fetchProducts}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="products-page">
      {showLoginPrompt && <LoginPromptModal />}

      <div className="products-header">
        <h1 className="products-title">
          Our <span className="gradient-text">Collection</span>
        </h1>
        <p className="products-subtitle">
          Discover premium gadgets and minimalist decor
        </p>
      </div>

      <div className="products-toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-dropdown-container">
          <select
            value={filter}
            onChange={handleFilterChange}
            className="filter-dropdown"
            aria-label="Filter products"
          >
            <option value="all">All Products</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        {filter !== "all" && !badgeExiting && (
          <div className="filter-badge">
            <span>🔖</span>
            {getActiveFilterLabel()}
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products">
          <div className="no-products-icon">📦</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
          {(searchTerm || filter !== "all") && (
            <button 
              className="btn-primary" 
              style={{ marginTop: "1.5rem" }}
              onClick={() => {
                setSearchTerm("");
                setFilter("all");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`products-grid ${isFiltering ? 'filtering' : ''}`}>
            {filteredProducts.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                onNotify={handleNotifyMe}
                isLoggedIn={isAuthenticated}
              />
            ))}
          </div>
          
          <div className="results-count">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </>
      )}
    </div>
  );
}

export default Products;