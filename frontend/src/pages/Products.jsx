import { useEffect, useState } from "react";
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
    if (quantity > product.stock) {
      alert(`Sorry, only ${product.stock} units available`);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${product._id}/order`, {
        method: 'PUT',
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update stock');
      }

      setProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === product._id ? data.product : p
        )
      );

      const cartItem = {
        ...product,
        cartQuantity: quantity,
        addedAt: new Date().toISOString()
      };
      setCartItems([...cartItems, cartItem]);

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
    try {
      alert(`🔔 We'll notify you when ${product.name} is back in stock!`);
    } catch (error) {
      console.error("Notification error:", error);
      alert("Failed to set notification. Please try again.");
    }
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    
    // If changing from "all" to something else, show badge exit animation
    if (filter !== "all" && newFilter === "all") {
      setBadgeExiting(true);
      setTimeout(() => {
        setBadgeExiting(false);
        setFilter(newFilter);
      }, 200);
    } 
    // If changing to a specific filter, animate the grid
    else {
      setIsFiltering(true);
      setTimeout(() => {
        setFilter(newFilter);
        // Slight delay to show the filter change
        setTimeout(() => {
          setIsFiltering(false);
        }, 300);
      }, 150);
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