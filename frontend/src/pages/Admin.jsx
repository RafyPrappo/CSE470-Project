import { useState, useEffect, useRef } from "react";
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
    description: "",
    image: "",
  });

  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);

  // New State variables for Feature 4
  const [activeTab, setActiveTab] = useState("products");
  const [preOrders, setPreOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [shipmentForm, setShipmentForm] = useState({
    shipmentBatchId: "",
    origin: "China",
    destination: "Bangladesh",
    baseEstimatedArrival: ""
  });

  // New state for low stock modal
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  
  // New state for managing multiple toasts
  const [toasts, setToasts] = useState([]);

  const { user, isAdmin, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/products");
      return;
    }
    fetchProducts();
    fetchPreOrders();
    fetchShipments();
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

  const fetchPreOrders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/preorders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setPreOrders(await res.json());
    } catch (error) {
      console.error("Error fetching pre-orders:", error);
    }
  };

  const fetchShipments = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/shipments", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setShipments(await res.json());
    } catch (error) {
      console.error("Error fetching shipments:", error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showNotification("Image must be less than 2MB.", "error");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, image: reader.result }); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShipmentChange = (e) => {
    setShipmentForm({ ...shipmentForm, [e.target.name]: e.target.value });
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
          description: "",
          image: "",
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

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/shipments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(shipmentForm)
      });
      if (res.ok) {
        showNotification("📦 Shipment created!", "success");
        setShipmentForm({
          shipmentBatchId: "", origin: "China", destination: "Bangladesh", baseEstimatedArrival: ""
        });
        fetchShipments();
      } else {
        const data = await res.json();
        showNotification(data.error || "Failed to create", "error");
      }
    } catch (err) {
      showNotification("Error creating shipment", "error");
    }
  };

  const updatePreOrderStatus = async (id, status, shipmentId = undefined) => {
    try {
      const payload = { status };
      if (shipmentId !== undefined) payload.shipmentId = shipmentId;

      const res = await fetch(`http://localhost:5000/api/preorders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showNotification(`Order updated to ${status}`, "success");
        fetchPreOrders();
        // if we just approved, also refresh shipments so auto-generated batch shows up
        if (status === 'APPROVED') {
          fetchShipments();
        }
      } else {
        showNotification("Failed to update pre-order", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error updating pre-order", "error");
    }
  };

  const linkPreOrderToShipment = async (id, shipmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/preorders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ shipmentId, status: 'SHIPPED' })
      });
      if (res.ok) {
        showNotification("✅ Pre-order approved and shipped!", "success");
        fetchPreOrders();
        fetchShipments();
      } else {
        showNotification("Failed to link shipment", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error linking shipment", "error");
    }
  };

  const updateShipmentETA = async (id, newDate) => {
    try {
      const res = await fetch(`http://localhost:5000/api/shipments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ baseEstimatedArrival: newDate })
      });
      if (res.ok) {
        fetchShipments();
        fetchPreOrders(); // Since ETA might change for linked pre-orders
        showNotification("Arrival Date Updated!", "success");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to update date", "error");
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

  // Updated showNotification function to manage multiple toasts
  const showNotification = (message, type = "success") => {
    const id = Date.now(); // Unique ID for each toast
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
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

  // ===== Floating Low Stock Notifications =====
  const prevLowStock = useRef([]);

  useEffect(() => {
    const newLowStock = lowStockProducts.filter(
      (product) => !prevLowStock.current.some((p) => p._id === product._id)
    );

    newLowStock.forEach((product) => {
      showNotification(
        `⚠️ Low stock: ${product.name} (${product.stock} left)`,
        "error"
      );
    });

    prevLowStock.current = lowStockProducts;
  }, [lowStockProducts]);
  // ===========================================

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
      {/* Toast Container for multiple notifications */}
      <div className="toast-container">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            className={`toast ${toast.type}`}
            style={{ 
              bottom: `${20 + index * 80}px`, // Stack toasts with 80px gap
              zIndex: 9999 - index
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="admin-header">
        <h1 className="admin-title">
          Admin <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="admin-subtitle">Welcome back, {user?.name}! You have full access to manage inventory and operations.</p>

        {/* Admin Navigation Tabs */}
        <div className="admin-tabs" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Products Engine
          </button>
          <button
            className={`tab-btn ${activeTab === 'preorders' ? 'active' : ''}`}
            onClick={() => setActiveTab('preorders')}
          >
            🛒 Pre-Order Approvals
          </button>
          <button
            className={`tab-btn ${activeTab === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipments')}
          >
            🚢 Shipping Logs (China)
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
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

              <div className="form-group">
                <label htmlFor="description">Product Description</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Write a rich, detailed description here..."
                  value={form.description}
                  onChange={handleChange}
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  required
                />
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

              <div className="form-group">
                <label>Product Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="form-input"
                    style={{ padding: '0.5rem', background: 'rgba(30, 41, 59, 0.5)' }}
                  />
                  {form.image && (
                    <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={form.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
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

              <div 
                className="stat-box clickable" 
                onClick={() => setShowLowStockModal(true)}
              >
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
                        <tr key={product._id} data-product-id={product._id}>
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
      )}

      {/* Feature 4: Pre-Orders Management Tab */}
      {activeTab === 'preorders' && (
        <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="admin-card">
            <div className="card-header">
              <h2><span className="header-icon">🛒</span> Pre-Order Requests</h2>
              <p className="card-description">Approve customer pre-orders and assign them to shipments</p>
            </div>

            <div className="product-table-container">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Order Date</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Linked Shipment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {preOrders.map(po => (
                    <tr key={po._id}>
                      <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td>
                        {po.user?.name}<br />
                        <small style={{ color: 'var(--gray-500)' }}>{po.user?.email}</small>
                      </td>
                      <td>{po.product?.name}</td>
                      <td>{po.quantity}</td>
                      <td>
                        <span className={`status-badge ${po.status.toLowerCase()}`} style={{
                          background: po.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: po.status === 'PENDING' ? 'var(--warning)' : '#10B981',
                          border: po.status === 'PENDING' ? '1px solid var(--warning)' : '1px solid #10B981'
                        }}>
                          {po.status}
                        </span>
                      </td>
                      <td>
                        {po.shipment ? (
                          <span style={{ color: '#3b82f6' }}>{po.shipment.shipmentBatchId}</span>
                        ) : (
                          <span style={{ color: 'var(--gray-500)' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div className="action-cell">
                          {po.status === 'PENDING' && (
                            <button
                              className="action-btn confirm"
                              style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}
                              onClick={() => updatePreOrderStatus(po._id, 'APPROVED')}
                            >
                              Approve
                            </button>
                          )}
                          {po.status === 'APPROVED' && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  linkPreOrderToShipment(po._id, e.target.value);
                                  e.target.value = ""; // Reset dropdown
                                }
                              }}
                              className="form-input"
                              style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                            >
                              <option value="">Link to Shipment...</option>
                              {shipments.map(s => (
                                <option key={s._id} value={s._id}>{s.shipmentBatchId} (ETA: {new Date(s.finalETA).toLocaleDateString()})</option>
                              ))}
                            </select>
                          )}
                          {po.status === 'SHIPPED' && (
                            <button
                              className="action-btn confirm"
                              style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                              onClick={() => updatePreOrderStatus(po._id, 'DELIVERED')}
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {preOrders.length === 0 && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No pre-orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Feature 4: Shipping Logs Tab */}
      {activeTab === 'shipments' && (
        <div className="admin-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>

          <div className="admin-card form-card">
            <div className="card-header">
              <h2><span className="header-icon">🚢</span> New Shipment Batch</h2>
              <p className="card-description">Register an incoming batch from China</p>
            </div>
            <form onSubmit={handleCreateShipment} className="admin-form">
              <div className="form-group">
                <label>Batch ID (Unique)</label>
                <input type="text" name="shipmentBatchId" className="form-input" required value={shipmentForm.shipmentBatchId} onChange={handleShipmentChange} placeholder="e.g. BATCH-CN-001" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Origin</label>
                  <input type="text" name="origin" className="form-input" value={shipmentForm.origin} onChange={handleShipmentChange} />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input type="text" name="destination" className="form-input" value={shipmentForm.destination} onChange={handleShipmentChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Base Expected Arrival</label>
                <input type="date" name="baseEstimatedArrival" className="form-input" required value={shipmentForm.baseEstimatedArrival} onChange={handleShipmentChange} />
              </div>
              <button type="submit" className="submit-btn" style={{ marginTop: '1rem' }}>
                Create Shipment
              </button>
            </form>
          </div>

          <div className="admin-card">
            <div className="card-header">
              <h2><span className="header-icon">📋</span> Active Shipping Routes</h2>
            </div>
            <div className="product-table-container">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Final ETA</th>
                    <th>Delays</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 'bold' }}>{s.shipmentBatchId}</td>
                      <td>{s.origin} ➝ {s.destination}</td>
                      <td>{s.status}</td>
                      <td style={{ color: 'var(--accent-main)' }}>{new Date(s.finalETA).toLocaleDateString()}</td>
                      <td>
                        <span style={{ color: s.delayInDays > 0 ? 'var(--warning)' : '#10B981' }}>
                          {s.delayInDays} days
                        </span>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.4rem', border: '1px solid var(--accent-main)' }}
                          defaultValue={new Date(s.finalETA).toISOString().split('T')[0]}
                          onChange={(e) => updateShipmentETA(s._id, e.target.value)}
                          title="Set Explicit ETA"
                        />
                      </td>
                    </tr>
                  ))}
                  {shipments.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No active shipments.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div className="modal-overlay" onClick={() => setShowLowStockModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="header-icon">⚠️</span>
                Low Stock Products ({lowStockProducts.length})
              </h2>
              <button className="modal-close" onClick={() => setShowLowStockModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {lowStockProducts.length === 0 ? (
                <div className="empty-state">
                  <p>No low stock products found.</p>
                </div>
              ) : (
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(product => (
                      <tr key={product._id}>
                        <td>
                          <div className="product-info-cell">
                            <span className="product-name">{product.name}</span>
                          </div>
                        </td>
                        <td>{product.category || 'Uncategorized'}</td>
                        <td>
                          <span style={{ 
                            color: product.stock === 0 ? '#EF4444' : 
                                   product.stock < 5 ? '#F59E0B' : '#10B981',
                            fontWeight: 'bold'
                          }}>
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${product.stock === 0 ? 'out-of-stock' : 'low-stock'}`}>
                            {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => {
                              setShowLowStockModal(false);
                              startEditing(product);
                              // Scroll to product in the main list
                              setTimeout(() => {
                                document.querySelector(`[data-product-id="${product._id}"]`)?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'center'
                                });
                              }, 100);
                            }}
                          >
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="submit-btn" onClick={() => setShowLowStockModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Admin;