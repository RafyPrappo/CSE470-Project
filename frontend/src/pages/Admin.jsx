import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  
  const { user, isAdmin, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/products");
      return;
    }
    fetchProducts();
  }, [isAdmin, navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/products/");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showNotification("✨ Product added successfully!", "success");
        setForm({ 
          name: "", 
          retailPrice: "", 
          stock: "", 
          importCost: "",
          category: "",
        });
        fetchProducts();
      } else {
        showNotification("Error: " + data.error, "error");
      }
    } catch (error) {
      showNotification("Failed to add product: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock }),
      });

      if (response.ok) {
        fetchProducts();
        setEditingId(null);
        setEditValue("");
        showNotification("✅ Stock updated successfully!", "success");
      } else {
        const data = await response.json();
        showNotification("Error: " + data.error, "error");
      }
    } catch (error) {
      showNotification("Failed to update stock: " + error.message, "error");
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchProducts();
        showNotification("✅ Product deleted successfully!", "success");
      } else {
        const data = await response.json();
        showNotification("Error: " + data.error, "error");
      }
    } catch (error) {
      showNotification("Failed to delete product: " + error.message, "error");
    }
  };

  const showNotification = (message, type = "success") => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const getProfitMargin = (retail, importCost) => {
    const profit = ((retail - importCost) / retail * 100).toFixed(1);
    return {
      value: profit,
      class: profit >= 30 ? 'high' : profit >= 15 ? 'medium' : 'low'
    };
  };

  const getStockBarColor = (stock) => {
    if (stock > 20) return '#10B981';
    if (stock > 10) return '#F59E0B';
    return '#EF4444';
  };

  // Format stock values for display (K, M, B)
  const formatStockValue = (stock) => {
    if (stock >= 1e9) return (stock / 1e9).toFixed(1) + 'B';
    if (stock >= 1e6) return (stock / 1e6).toFixed(1) + 'M';
    if (stock >= 1e3) return (stock / 1e3).toFixed(1) + 'K';
    return stock.toString();
  };

  const startEditing = (product) => {
    setEditingId(product._id);
    setEditValue(product.stock.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalValue = products.reduce((sum, p) => sum + (p.retailPrice * p.stock), 0);

  if (loading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">
          Admin <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="admin-subtitle">Welcome back, {user?.name}! You have full access to manage inventory.</p>
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
                  Add Product
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

            <div className="stat-box total-value">
              <div className="stat-icon">💰</div>
              <div className="stat-details">
                <span className="stat-value">৳{totalValue.toLocaleString()}</span>
                <span className="stat-label">Total Value</span>
              </div>
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="alert-section">
              <h3>⚠️ Low Stock Alerts</h3>
              <ul className="alert-list">
                {lowStockProducts.slice(0, 3).map(product => (
                  <li key={product._id} className="alert-item">
                    <span>{product.name}</span>
                    <span className="alert-stock">Only {product.stock} left</span>
                  </li>
                ))}
                {lowStockProducts.length > 3 && (
                  <li className="alert-item more">
                    <span>+{lowStockProducts.length - 3} more items</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Product List */}
        <div className="product-list-card">
          <div className="product-list-header">
            <div className="product-list-title">
              <h2>Product Inventory</h2>
              <span className="product-count-badge">{products.length} items</span>
            </div>
            
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your search or add new products</p>
            </div>
          ) : (
            <div className="product-table-container">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Cost</th>
                    <th>Profit</th>
                    <th>Stock Level</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const profit = getProfitMargin(product.retailPrice, product.importCost);
                    const stockBarColor = getStockBarColor(product.stock);
                    const maxStock = Math.max(...products.map(p => p.stock), 100);
                    const stockPercentage = Math.min((product.stock / maxStock) * 100, 100);
                    
                    return (
                      <tr key={product._id}>
                        <td className="index-cell">
                          <span className="product-index">{index + 1}</span>
                        </td>
                        
                        <td>
                          <div className="product-info-cell">
                            <div className="product-details">
                              <span className="product-name">{product.name}</span>
                              <span className="product-category">{product.category || 'Uncategorized'}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td>
                          <div className="price-cell">
                            <span className="retail-price">৳{product.retailPrice.toLocaleString()}</span>
                          </div>
                        </td>
                        
                        <td>
                          <div className="price-cell">
                            <span className="import-cost">
                              ৳{product.importCost.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        
                        <td>
                          <span className={`profit-badge ${profit.class}`}>
                            {profit.value}%
                          </span>
                        </td>
                        
                        <td>
                          <div className="stock-cell">
                            <div className="stock-info-header">
                              <span className="stock-current">{formatStockValue(product.stock)}</span>
                              <span className="stock-percentage">{Math.round(stockPercentage)}%</span>
                            </div>
                            <div className="stock-bar-container">
                              <div 
                                className="stock-bar-fill"
                                style={{ 
                                  width: `${stockPercentage}%`,
                                  backgroundColor: stockBarColor
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        
                        <td>
                          <span className={`status-badge ${product.status}`}>
                            {product.status === 'in-stock' && 'In Stock'}
                            {product.status === 'low-stock' && 'Low Stock'}
                            {product.status === 'out-of-stock' && 'Out of Stock'}
                          </span>
                        </td>
                        
                        <td>
                          <div className="action-cell">
                            {editingId === product._id ? (
                              <div className="stock-editor">
                                <input
                                  type="number"
                                  min="0"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="stock-editor-input"
                                  autoFocus
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleStockUpdate(product._id, parseInt(editValue) || 0);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleStockUpdate(product._id, parseInt(editValue) || 0)}
                                  className="stock-editor-btn confirm"
                                  title="Confirm"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="stock-editor-btn cancel"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(product)}
                                  className="action-btn edit-btn"
                                  title="Edit stock"
                                >
                                  <span className="action-icon">✎</span>
                                  <span className="action-text">Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(product._id)}
                                  className="action-btn delete-btn"
                                  title="Delete product"
                                >
                                  <span className="action-icon">🗑️</span>
                                  <span className="action-text">Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;