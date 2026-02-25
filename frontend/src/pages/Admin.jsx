import { useState, useEffect } from "react";
import "./Admin.css";

function Admin() {
  const [form, setForm] = useState({
    name: "",
    retailPrice: "",
    stock: "",
    importCost: "",
    category: "",
  });

  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products/");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("✨ Product added successfully!");
        setForm({ 
          name: "", 
          retailPrice: "", 
          stock: "", 
          importCost: "",
          category: "",
        });
        fetchProducts(); // Refresh the list
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Failed to add product: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      if (response.ok) {
        fetchProducts(); // Refresh the list
        alert("✅ Stock updated successfully!");
      } else {
        const data = await response.json();
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Failed to update stock: " + error.message);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts(); // Refresh the list
        alert("✅ Product deleted successfully!");
      } else {
        const data = await response.json();
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Failed to delete product: " + error.message);
    }
  };

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">
          Admin <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="admin-subtitle">Manage your inventory with powerful tools</p>
      </div>

      <div className="admin-grid">
        {/* Add Product Form */}
        <div className="admin-card form-card">
          <div className="card-header">
            <h2>
              <span className="header-icon">➕</span>
              Add New Product
            </h2>
            <p className="card-description">Fill in the product details below</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., iPhone 15 Pro Case"
                value={form.name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select category</option>
                <option value="gadgets">Gadgets</option>
                <option value="cases">Phone Cases</option>
                <option value="decor">Home Decor</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="retailPrice">Retail Price (৳)</label>
                <input
                  id="retailPrice"
                  name="retailPrice"
                  type="number"
                  placeholder="e.g., 2999"
                  value={form.retailPrice}
                  onChange={handleChange}
                  required
                  className="form-input"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="importCost">Import Cost (৳)</label>
                <input
                  id="importCost"
                  name="importCost"
                  type="number"
                  placeholder="e.g., 1500"
                  value={form.importCost}
                  onChange={handleChange}
                  required
                  className="form-input"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="stock">Initial Stock Quantity</label>
              <input
                id="stock"
                name="stock"
                type="number"
                placeholder="e.g., 50"
                value={form.stock}
                onChange={handleChange}
                required
                className="form-input"
                min="0"
              />
            </div>

            {form.retailPrice && form.importCost && (
              <div className="profit-preview">
                <div className="profit-label">Estimated Profit per Unit</div>
                <div className="profit-value">
                  ৳{form.retailPrice - form.importCost}
                  <span className="profit-margin">
                    ({((form.retailPrice - form.importCost) / form.retailPrice * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  Adding Product...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Add Product to Inventory
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="admin-card stats-card">
          <div className="card-header">
            <h2>
              <span className="header-icon">📊</span>
              Inventory Overview
            </h2>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-icon">📦</div>
              <div className="stat-details">
                <span className="stat-value">{products.length}</span>
                <span className="stat-label">Total Products</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">✅</div>
              <div className="stat-details">
                <span className="stat-value">
                  {products.filter(p => p.stock >= 5).length}
                </span>
                <span className="stat-label">In Stock</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">⚠️</div>
              <div className="stat-details">
                <span className="stat-value">{lowStockProducts.length}</span>
                <span className="stat-label">Low Stock</span>
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">❌</div>
              <div className="stat-details">
                <span className="stat-value">{outOfStockProducts.length}</span>
                <span className="stat-label">Out of Stock</span>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="alert-section">
              <h3>⚠️ Low Stock Alerts</h3>
              <ul className="alert-list">
                {lowStockProducts.map(product => (
                  <li key={product._id} className="alert-item">
                    <span>{product.name}</span>
                    <span className="alert-stock">Only {product.stock} left</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Product List */}
        <div className="admin-card product-list-card">
          <div className="card-header">
            <h2>
              <span className="header-icon">📋</span>
              Product Inventory
            </h2>
          </div>

          <div className="product-list">
            {products.map(product => (
              <div key={product._id} className="product-list-item">
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-meta">
                    <span>Price: ৳{product.retailPrice}</span>
                    <span className={`status-badge ${product.status}`}>
                      {product.status === 'in-stock' && '✅ In Stock'}
                      {product.status === 'low-stock' && '⚠️ Low Stock'}
                      {product.status === 'out-of-stock' && '❌ Out of Stock'}
                    </span>
                  </p>
                </div>
                
                <div className="product-actions">
                  <input
                    type="number"
                    min="0"
                    value={product.stock}
                    onChange={(e) => {
                      const newStock = parseInt(e.target.value);
                      if (!isNaN(newStock)) {
                        handleStockUpdate(product._id, newStock);
                      }
                    }}
                    className="stock-input"
                  />
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="delete-btn"
                    title="Delete product"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;