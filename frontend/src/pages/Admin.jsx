import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  Truck, 
  ClipboardList, 
  Package, 
  Layers, 
  Clock,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import "./Admin.css";

import OrderQueue from "../components/Admin/OrderQueue";
import ProductManager from "../components/Admin/ProductManager";
import PreOrderManager from "../components/Admin/PreOrderManager";
import ShipmentManager from "../components/Admin/ShipmentManager";
import CategoryManager from "../components/Admin/CategoryManager";

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
  const [manifestData, setManifestData] = useState(null);

  const generateManifest = () => {
    const pendingOrders = orders.filter(o => o.status === 'PENDING');
    if (pendingOrders.length === 0) return alert("No pending orders to manifest.");
    
    // Aggregate items across all pending orders
    const itemMap = {};
    pendingOrders.forEach(order => {
        order.items.forEach(item => {
            if (itemMap[item.name]) {
                itemMap[item.name].quantity += item.quantity;
            } else {
                itemMap[item.name] = { ...item };
            }
        });
    });

    setManifestData(Object.values(itemMap));
    addLiveLog(`Manifest generated for ${pendingOrders.length} orders.`, 'success');
  };
  const [shipmentForm, setShipmentForm] = useState({
    shipmentBatchId: "",
    origin: "China",
    destination: "Bangladesh",
    baseEstimatedArrival: ""
  });

  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    image: ""
  });

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [courierForm, setCourierForm] = useState({
    courierName: "Pathao",
    trackingId: "",
    note: ""
  });

  // Hyper-Professional Analytics (Feature 11 Upgrade)
  const [analytics, setAnalytics] = useState({
    totalPipelineValue: 0,
    priorityPulse: 0,
    slaRisks: 0,
    velocity: 0
  });

  const [liveLog, setLiveLog] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);

  const generateAIInsights = (allOrders) => {
    const insights = [];
    const pendingOrders = allOrders.filter(o => o.status === 'PENDING');
    
    // Dhaka Batching Insight
    const dhakaCount = pendingOrders.filter(o => o.shippingAddress.city.toLowerCase().includes('dhaka')).length;
    if (dhakaCount >= 3) {
        insights.push({
            id: 'dhaka-batch',
            title: 'Logistics Optimization',
            text: `Batch ${dhakaCount} orders for Dhaka to save ~৳800 in consolidated Pathao shipping.`,
            type: 'success'
        });
    }

    // SLA Warning
    const slaRisks = pendingOrders.filter(o => {
        const hours = (new Date() - new Date(o.createdAt)) / (1000 * 60 * 60);
        return hours > 36;
    }).length;

    if (slaRisks > 0) {
        insights.push({
            id: 'sla-risk',
            title: 'SLA Breach Warning',
            text: `${slaRisks} orders are nearing the 48h fulfillment deadline. Immediate action recommended.`,
            type: 'warning'
        });
    }

    // Inventory Pulse
    const lowStock = products.filter(p => p.stock < 5).length;
    if (lowStock > 2) {
        insights.push({
            id: 'inventory-pulse',
            title: 'Inventory Alert',
            text: `${lowStock} high-velocity items are below threshold. Restock recommended for Q2.`,
            type: 'info'
        });
    }

    setAiInsights(insights.slice(0, 3));
  };
  const updateAnalytics = (allOrders) => {
    const activeOrders = allOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
    const pipeline = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pulse = activeOrders.filter(o => o.priority === 'HIGH').length;
    
    // SLA Risk: Pending orders > 48 hours
    const riskCount = activeOrders.filter(o => {
        const hours = (new Date() - new Date(o.createdAt)) / (1000 * 60 * 60);
        return o.status === 'PENDING' && hours > 48;
    }).length;

    setAnalytics({
        totalPipelineValue: pipeline,
        priorityPulse: pulse,
        slaRisks: riskCount,
        velocity: Math.min(100, Math.round((allOrders.filter(o => o.status === 'DELIVERED').length / (allOrders.length || 1)) * 100))
    });
    generateAIInsights(allOrders);
  };

  const addLiveLog = (msg, type = 'info') => {
    setLiveLog(prev => [{
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        msg,
        type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev].slice(0, 10)); // Keep last 10
  };

  // New state for modals
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  // New state for managing multiple toasts
  const [toasts, setToasts] = useState([]);

  const { user, isAdmin, token } = useAuth();
  const navigate = useNavigate();

  // Consolidate all fetches for performance
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchPreOrders(),
        fetchShipments(),
        fetchCategories(),
        fetchOrders()
      ]);
    } catch (error) {
      console.error("Critical dashboard fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [token]); // token is stable from useAuth

  useEffect(() => {
    if (!isAdmin) {
      navigate("/products");
      return;
    }
    fetchAllData();
  }, [isAdmin, navigate, fetchAllData]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        updateAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products/");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchPreOrders = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/preorders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setPreOrders(await res.json());
    } catch (error) {
      console.error("Error fetching pre-orders:", error);
    }
  }, [token]);

  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/shipments", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setShipments(await res.json());
    } catch (error) {
      console.error("Error fetching shipments:", error);
    }
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // 1MB limit for performance
        showNotification("Performance Tip: Please keep images under 1MB for faster loading.", "warning");
        if (file.size > 2 * 1024 * 1024) { // Strict 2MB limit
            showNotification("Image exceeds 2MB limit.", "error");
            e.target.value = "";
            return;
        }
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

  const handleCategoryChange = (e) => {
    setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });
  };

  const handleCategoryImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        showNotification("Performance Tip: Please keep category images under 1MB.", "warning");
        if (file.size > 2 * 1024 * 1024) {
            showNotification("Image must be less than 2MB.", "error");
            e.target.value = "";
            return;
        }
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryForm({ ...categoryForm, image: reader.result }); // Base64 string
      };
      reader.readAsDataURL(file);
    }
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
    } catch {
      showNotification("Error creating shipment", "error");
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/categories/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        showNotification("📝 Category added successfully!", "success");
        setCategoryForm({ name: "", description: "", image: "" });
        fetchCategories();
      } else {
        const data = await res.json();
        showNotification(data.error || "Failed to create category", "error");
      }
    } catch {
      showNotification("Error creating category", "error");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        showNotification("Category removed", "success");
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
      showNotification("Error deleting category", "error");
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

  const updateOrderStatus = async (id, status, note = "", priority = null) => {
    try {
      const body = { note };
      if (status) body.status = status;
      if (priority) body.priority = priority;

      const res = await fetch(`http://localhost:5000/api/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showNotification(`Order updated successfully!`, "success");
        addLiveLog(`Order ${id} updated`, 'success');
        fetchOrders();
        if (selectedOrder?._id === id) {
           const updated = await res.json();
           setSelectedOrder(updated);
        }
      }
    } catch {
      showNotification("Error updating order", "error");
    }
  };

  const handleAddCourierLog = async (e, orderId, isPreOrder = false) => {
    e.preventDefault();
    const endpoint = isPreOrder 
      ? `http://localhost:5000/api/preorders/${orderId}/courier`
      : `http://localhost:5000/api/orders/${orderId}/courier`;
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(courierForm)
      });
      if (res.ok) {
        showNotification("🚚 Courier log added and status updated!", "success");
        addLiveLog(`Courier log attached to order`, 'info');
        setCourierForm({ courierName: "Pathao", trackingId: "", note: "" });
        isPreOrder ? fetchPreOrders() : fetchOrders();
        // Update selected order view
        const updated = await res.json();
        setSelectedOrder(updated);
      }
    } catch {
      showNotification("Failed to add courier log", "error");
    }
  };
  const updateShipmentStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/shipments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchShipments();
        fetchPreOrders();
        showNotification("Shipment Status Updated!", "success");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to update status", "error");
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
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  // const totalValue = products.reduce((sum, p) => sum + (p.retailPrice * p.stock), 0);

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
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Order Queue
          </button>
          <button
            className={`tab-btn ${activeTab === 'preorders' ? 'active' : ''}`}
            onClick={() => setActiveTab('preorders')}
          >
            🛒 Pre-Orders
          </button>
          <button
            className={`tab-btn ${activeTab === 'shipments' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipments')}
          >
            🚢 Shipments
          </button>
          <button
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🏷️ Categories
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <OrderQueue 
          orders={orders}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          updateOrderStatus={updateOrderStatus}
          courierForm={courierForm}
          setCourierForm={setCourierForm}
          handleAddCourierLog={handleAddCourierLog}
          generateManifest={generateManifest}
        />
      )}

      {activeTab === 'products' && (
        <ProductManager 
          form={form}
          setForm={setForm}
          handleChange={handleChange}
          handleImageUpload={handleImageUpload}
          categories={categories}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          products={products}
          lowStockProducts={lowStockProducts}
          outOfStockProducts={outOfStockProducts}
          setShowLowStockModal={setShowLowStockModal}
          setShowOutOfStockModal={setShowOutOfStockModal}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredProducts={filteredProducts}
          getProfitMargin={getProfitMargin}
          getStockBarColor={getStockBarColor}
          formatStockValue={formatStockValue}
          editingId={editingId}
          editValue={editValue}
          setEditValue={setEditValue}
          handleStockUpdate={handleStockUpdate}
          cancelEditing={cancelEditing}
          startEditing={startEditing}
          handleDelete={handleDelete}
        />
      )}

      {activeTab === 'preorders' && (
        <PreOrderManager 
          preOrders={preOrders}
          updatePreOrderStatus={updatePreOrderStatus}
          linkPreOrderToShipment={linkPreOrderToShipment}
          shipments={shipments}
        />
      )}

      {activeTab === 'shipments' && (
        <ShipmentManager 
          shipmentForm={shipmentForm}
          handleShipmentChange={handleShipmentChange}
          handleCreateShipment={handleCreateShipment}
          shipments={shipments}
          updateShipmentStatus={updateShipmentStatus}
          updateShipmentETA={updateShipmentETA}
        />
      )}


      {activeTab === 'categories' && (
        <CategoryManager 
          categoryForm={categoryForm}
          handleCategoryChange={handleCategoryChange}
          handleCategoryImageUpload={handleCategoryImageUpload}
          handleCreateCategory={handleCreateCategory}
          categories={categories}
          handleDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* Global Modals */}
      {showLowStockModal && (
        <div className="modal-overlay" onClick={() => setShowLowStockModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><span className="header-icon">⚠️</span> Low Stock Products ({lowStockProducts.length})</h2>
              <button className="modal-close" onClick={() => setShowLowStockModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {lowStockProducts.length === 0 ? (
                <div className="empty-state"><p>No low stock products found.</p></div>
              ) : (
                <table className="product-table">
                  <thead>
                    <tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map(product => (
                      <tr key={product._id}>
                        <td><div className="product-info-cell"><span className="product-name">{product.name}</span></div></td>
                        <td>{product.category || 'Uncategorized'}</td>
                        <td><span style={{ color: product.stock === 0 ? '#EF4444' : product.stock < 5 ? '#F59E0B' : '#10B981', fontWeight: 'bold' }}>{product.stock}</span></td>
                        <td><span className={`status-badge ${product.stock === 0 ? 'out-of-stock' : 'low-stock'}`}>Low Stock</span></td>
                        <td>
                          <button className="action-btn edit-btn" onClick={() => { setShowLowStockModal(false); startEditing(product); }}>Update Stock</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer"><button className="submit-btn" onClick={() => setShowLowStockModal(false)}>Close</button></div>
          </div>
        </div>
      )}

      {showOutOfStockModal && (
        <div className="modal-overlay" onClick={() => setShowOutOfStockModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><span className="header-icon">❌</span> Out of Stock Products ({outOfStockProducts.length})</h2>
              <button className="modal-close" onClick={() => setShowOutOfStockModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {outOfStockProducts.length === 0 ? (
                <div className="empty-state"><p>No out of stock products found.</p></div>
              ) : (
                <table className="product-table">
                  <thead>
                    <tr><th>Product</th><th>Category</th><th>Last Stock</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {outOfStockProducts.map(product => (
                      <tr key={product._id}>
                        <td><div className="product-info-cell"><span className="product-name">{product.name}</span></div></td>
                        <td>{product.category || 'Uncategorized'}</td>
                        <td><span style={{ color: '#EF4444', fontWeight: 'bold' }}>0</span></td>
                        <td><span className="status-badge out-of-stock">Out of Stock</span></td>
                        <td>
                          <button className="action-btn edit-btn" onClick={() => { setShowOutOfStockModal(false); startEditing(product); }}>Restock</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer"><button className="submit-btn" onClick={() => setShowOutOfStockModal(false)}>Close</button></div>
          </div>
        </div>
      )}

      {/* Feature Manifest Modal (Elite Tier) */}
      <AnimatePresence>
      {manifestData && (
        <motion.div 
            className="modal-overlay" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setManifestData(null)}
        >
            <motion.div 
                className="modal-content glass-morph" 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()} 
                style={{ maxWidth: '800px', width: '90%' }}
            >
                <div className="modal-header">
                    <h2><span className="header-icon">📑</span> Warehouse Dispatch Manifest</h2>
                    <button className="modal-close" onClick={() => setManifestData(null)}>×</button>
                </div>
                <div className="modal-body">
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                        The following items must be picked and packed for current pending orders.
                    </p>
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Total Quantity To Pick</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {manifestData.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                                    <td>
                                        <span className="quantity-badge">{item.quantity} units</span>
                                    </td>
                                    <td><span className="status-badge processing">Ready to Pick</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setManifestData(null)}>Close</button>
                    <button className="submit-btn" onClick={() => window.print()}>
                        🖨️ Print Manifest
                    </button>
                </div>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <style>{`
          .glass-morph {
              background: rgba(15, 23, 42, 0.8) !important;
              backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          }
          .quantity-badge {
              background: rgba(59, 130, 246, 0.1);
              color: #3b82f6;
              padding: 0.3rem 0.8rem;
              border-radius: 999px;
              font-weight: 800;
          }
          @media print {
              .navbar, .admin-sidebar, .modal-header, .modal-footer, .card-header { display: none !important; }
              .modal-content { position: absolute; top: 0; left: 0; width: 100%; border: none; box-shadow: none; background: white !important; color: black !important; }
              .product-table { width: 100%; border-collapse: collapse; }
              .product-table th, .product-table td { border: 1px solid #eee; padding: 10px; color: black !important; }
          }
      `}</style>
    </div>
  );
}

export default Admin;
