import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [badgeExiting, setBadgeExiting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptProduct, setPromptProduct] = useState(null);
  const [userPreOrders, setUserPreOrders] = useState({});

  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    if (isAuthenticated) {
      fetchUserPreOrders();
    }
  }, [isAuthenticated, token]);

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

  const fetchUserPreOrders = async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await fetch("http://localhost:5000/api/preorders/my", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Create a map of product ID to pre-order for quick lookup
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
    // Check if user is logged in
    if (!isAuthenticated) {
      setPromptProduct({ product, quantity });
      setShowLoginPrompt(true);
      return;
    }

    // Determine if this should be a pre-order
    // 1. Explicitly marked as PreOrder
    // 2. Or if the product is out of stock completely
    const isPreOrderRequest = product.isPreOrder || product.stock <= 0;

    // Check if trying to add more than available stock for regular orders
    if (!isPreOrderRequest && quantity > product.stock) {
      alert(`Sorry, only ${product.stock} units available`);
      return;
    }

    // Handle Pre-Orders & Out-of-Stock Pre-Orders separately
    if (isPreOrderRequest) {
      // Check if user already has a pending pre-order for this product
      if (userPreOrders[product._id]) {
        const existingPreOrder = userPreOrders[product._id];
        const newQuantity = existingPreOrder.quantity + quantity;
        
        try {
          const response = await fetch(`http://localhost:5000/api/preorders/${existingPreOrder._id}/quantity`, {
            method: 'PUT',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: newQuantity }),
          });

          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              setShowLoginPrompt(true);
              return;
            }
            throw new Error(data.error || 'Failed to update pre-order');
          }

          // Update the local state
          const updatedPreOrders = { ...userPreOrders };
          updatedPreOrders[product._id] = data;
          setUserPreOrders(updatedPreOrders);

          const toast = document.createElement('div');
          toast.className = 'cart-toast';
          toast.innerHTML = `✅ Updated pre-order quantity to ${newQuantity} × ${product.name}!`;
          document.body.appendChild(toast);

          setTimeout(() => {
            toast.remove();
          }, 3000);
          return;
        } catch (error) {
          console.error("Failed to update pre-order:", error);
          alert(`Failed to update pre-order: ${error.message}`);
          throw error;
        }
      }

      // Create a new pre-order if one doesn't exist
      try {
        const response = await fetch("http://localhost:5000/api/preorders", {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ productId: product._id, quantity }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setShowLoginPrompt(true);
            return;
          }
          throw new Error(data.error || 'Failed to place pre-order');
        }

        // Update local state with new pre-order
        const updatedPreOrders = { ...userPreOrders };
        updatedPreOrders[product._id] = data;
        setUserPreOrders(updatedPreOrders);

        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = `✅ Successfully requested pre-order for ${quantity} × ${product.name}!`;
        document.body.appendChild(toast);

        setTimeout(() => {
          toast.remove();
        }, 3000);
        return;

      } catch (error) {
        console.error("Failed to place pre-order:", error);
        alert(`Failed to place pre-order: ${error.message}`);
        throw error;
      }
    }

    try {
      // Just add to local Cart state instead of calling the server
      addToCart(product, quantity);

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

      <div className="category-tabs" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['all', 'gadgets', 'cases', 'decor', 'accessories'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '0.6rem 2rem',
              borderRadius: '2rem',
              background: categoryFilter === cat ? 'linear-gradient(135deg, var(--primary-main), var(--primary-light))' : 'rgba(30, 41, 59, 0.5)',
              color: categoryFilter === cat ? 'white' : '#94a3b8',
              border: categoryFilter === cat ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
              fontWeight: categoryFilter === cat ? '600' : 'normal',
              boxShadow: categoryFilter === cat ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none'
            }}
          >
            {cat === 'all' ? 'All Products' : cat}
          </button>
        ))}
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

        <div className="filter-dropdown-container" style={{ display: 'flex', gap: '1rem' }}>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="filter-dropdown"
            aria-label="Sort products"
          >
            <option value="default">Sort By: Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>

          <select
            value={filter}
            onChange={handleFilterChange}
            className="filter-dropdown"
            aria-label="Filter products by stock"
          >
            <option value="all">Stock: All</option>
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
                existingPreOrder={userPreOrders[product._id]}
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