import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip
} from "recharts";

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
  ShieldCheck,
  Search,
  Tag,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Ship,
  Box,
  FileText,
  Printer,
  XCircle,
  Plus,
  Camera,
  Sparkles,
  Edit,
  Trash2,
  MapPin,
  Users,
  Medal,
  Star,
  Crown,
  Award,
  Download
} from "lucide-react";
import "./Admin.css";

import OrderQueue from "../components/Admin/OrderQueue";
import ProductManager from "../components/Admin/ProductManager";
import PreOrderManager from "../components/Admin/PreOrderManager";
import ShipmentManager from "../components/Admin/ShipmentManager";
import CategoryManager from "../components/Admin/CategoryManager";

// Custom tooltip to prevent stuttering
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #3b82f6',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(8px)',
    }}>
      <p style={{ color: '#f8fafc', fontWeight: 600, margin: '0 0 0.5rem' }}>{label}</p>
      {payload.map((entry, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: entry.color }} />
          <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{entry.name}: </span>
          <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>
            ৳{entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// Helper for membership
function getNextTier(points) {
  if (points < 2000) return { tier: 'Silver', pointsNeeded: 2000 - points };
  if (points < 5000) return { tier: 'Gold', pointsNeeded: 5000 - points };
  if (points < 10000) return { tier: 'Platinum', pointsNeeded: 10000 - points };
  return null;
}

// Helper to convert array of objects to CSV and trigger download
function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + (row[header] ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
  const [revenueData, setRevenueData] = useState({ totalRevenue: 0, totalProfit: 0, orderCount: 0, margin: '0.0' });

  const [activeTab, setActiveTab] = useState("products");
  const [preOrders, setPreOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [manifestData, setManifestData] = useState(null);

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

  const [analytics, setAnalytics] = useState({
    totalPipelineValue: 0,
    priorityPulse: 0,
    slaRisks: 0,
    velocity: 0
  });

  const [liveLog, setLiveLog] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);

  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [revenueStartDate, setRevenueStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [revenueEndDate, setRevenueEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split('T')[0];
  });
  const [revenueGroupBy, setRevenueGroupBy] = useState('none');
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // Membership states
  const [membershipUsers, setMembershipUsers] = useState([]);
  const [membershipLoading, setMembershipLoading] = useState(false);

  const { user, isAdmin, token } = useAuth();
  const navigate = useNavigate();

  // ========== Individual fetch functions ==========
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/orders", {
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
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/products/");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoadingRevenue(true);
      let url = "http://localhost:5000/api/orders/revenue";
      const params = new URLSearchParams();
      
      if (revenueStartDate) params.append('startDate', revenueStartDate);
      if (revenueEndDate) params.append('endDate', revenueEndDate);
      if (revenueGroupBy !== 'none') params.append('groupBy', revenueGroupBy);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (revenueGroupBy !== 'none') {
          setRevenueChartData(data);
          const totals = data.reduce((acc, d) => ({
            totalRevenue: acc.totalRevenue + d.totalRevenue,
            totalProfit: acc.totalProfit + d.totalProfit,
            orderCount: acc.orderCount + d.orderCount
          }), { totalRevenue: 0, totalProfit: 0, orderCount: 0 });
          setRevenueData({
            ...totals,
            margin: totals.totalRevenue > 0 ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(1) : '0.0'
          });
        } else {
          setRevenueData(data);
          setRevenueChartData([]);
        }
      }
    } catch (error) {
      console.error("Error fetching revenue:", error);
    } finally {
      setLoadingRevenue(false);
    }
  }, [token, revenueStartDate, revenueEndDate, revenueGroupBy]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchPreOrders = useCallback(async () => {
    try {
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/preorders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setPreOrders(await res.json());
    } catch (error) {
      console.error("Error fetching pre-orders:", error);
    }
  }, [token]);

  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/shipments", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setShipments(await res.json());
    } catch (error) {
      console.error("Error fetching shipments:", error);
    }
  }, [token]);

  const fetchMembershipStats = useCallback(async () => {
    try {
      setMembershipLoading(true);
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/users/members/all", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembershipUsers(data);
      }
    } catch (error) {
      console.error("Error fetching membership stats:", error);
    } finally {
      setMembershipLoading(false);
    }
  }, [token]);

  // ========== Combined fetchAllData ==========
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchPreOrders(),
        fetchShipments(),
        fetchCategories(),
        fetchOrders(),
        fetchRevenue(),
        fetchMembershipStats()
      ]);
    } catch (error) {
      console.error("Critical dashboard fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, fetchPreOrders, fetchShipments, fetchCategories, fetchOrders, fetchRevenue, fetchMembershipStats]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/products");
      return;
    }
    fetchAllData();
  }, [isAdmin, navigate, fetchAllData]);

  useEffect(() => {
    if (activeTab === 'revenue') {
      fetchRevenue();
    }
  }, [activeTab, fetchRevenue]);

  const generateManifest = () => {
    const pendingOrders = orders.filter(o => o.status === 'PENDING');
    if (pendingOrders.length === 0) return alert("No pending orders to manifest.");
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

  const generateAIInsights = (allOrders) => {
    const insights = [];
    const pendingOrders = allOrders.filter(o => o.status === 'PENDING');
    const dhakaCount = pendingOrders.filter(o => o.shippingAddress.city.toLowerCase().includes('dhaka')).length;
    if (dhakaCount >= 3) {
        insights.push({
            id: 'dhaka-batch',
            title: 'Logistics Optimization',
            text: `Batch ${dhakaCount} orders for Dhaka to save ~৳800 in consolidated Pathao shipping.`,
            type: 'success'
        });
    }
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
    }, ...prev].slice(0, 10));
  };

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        showNotification("Performance Tip: Please keep images under 1MB for faster loading.", "warning");
        if (file.size > 2 * 1024 * 1024) {
            showNotification("Image exceeds 2MB limit.", "error");
            e.target.value = "";
            return;
        }
      }
      const reader = new FileReader();
      reader.onloadend = () => { setForm({ ...form, image: reader.result }); };
      reader.readAsDataURL(file);
    }
  };

  const handleShipmentChange = (e) => { setShipmentForm({ ...shipmentForm, [e.target.name]: e.target.value }); };
  const handleCategoryChange = (e) => { setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value }); };
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
      reader.onloadend = () => { setCategoryForm({ ...categoryForm, image: reader.result }); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("${import.meta.env.VITE_API_URL}/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        showNotification("Product added successfully!", "success");
        setForm({ name: "", retailPrice: "", stock: "", importCost: "", category: "", description: "", image: "" });
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
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(shipmentForm)
      });
      if (res.ok) {
        showNotification("Shipment created!", "success");
        setShipmentForm({ shipmentBatchId: "", origin: "China", destination: "Bangladesh", baseEstimatedArrival: "" });
        fetchShipments();
      } else {
        const data = await res.json();
        showNotification(data.error || "Failed to create", "error");
      }
    } catch { showNotification("Error creating shipment", "error"); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/categories/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        showNotification("Category added successfully!", "success");
        setCategoryForm({ name: "", description: "", image: "" });
        fetchCategories();
      } else {
        const data = await res.json();
        showNotification(data.error || "Failed to create category", "error");
      }
    } catch { showNotification("Error creating category", "error"); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) { showNotification("Category removed", "success"); fetchCategories(); }
    } catch (err) { console.error(err); showNotification("Error deleting category", "error"); }
  };

  const updatePreOrderStatus = async (id, status, shipmentId = undefined) => {
    try {
      const payload = { status };
      if (shipmentId !== undefined) payload.shipmentId = shipmentId;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/preorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showNotification(`Order updated to ${status}`, "success");
        fetchPreOrders();
        if (status === 'APPROVED') { fetchShipments(); }
      } else { showNotification("Failed to update pre-order", "error"); }
    } catch (err) { console.error(err); showNotification("Error updating pre-order", "error"); }
  };

  const linkPreOrderToShipment = async (id, shipmentId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/preorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ shipmentId, status: 'SHIPPED' })
      });
      if (res.ok) {
        showNotification("Pre-order approved and shipped!", "success");
        fetchPreOrders(); fetchShipments();
      } else { showNotification("Failed to link shipment", "error"); }
    } catch (err) { console.error(err); showNotification("Error linking shipment", "error"); }
  };

  const updateShipmentETA = async (id, newDate) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shipments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ baseEstimatedArrival: newDate })
      });
      if (res.ok) { fetchShipments(); fetchPreOrders(); showNotification("Arrival Date Updated!", "success"); }
    } catch (err) { console.error(err); showNotification("Failed to update date", "error"); }
  };

  const updateOrderStatus = async (id, status, note = "", priority = null) => {
    try {
      const body = { note };
      if (status) body.status = status;
      if (priority) body.priority = priority;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
    } catch { showNotification("Error updating order", "error"); }
  };

  const handleAddCourierLog = async (e, orderId, isPreOrder = false) => {
    e.preventDefault();
    const endpoint = isPreOrder 
      ? `http://localhost:5000/api/preorders/${orderId}/courier`
      : `http://localhost:5000/api/orders/${orderId}/courier`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(courierForm)
      });
      if (res.ok) {
        showNotification("Courier log added and status updated!", "success");
        addLiveLog(`Courier log attached to order`, 'info');
        setCourierForm({ courierName: "Pathao", trackingId: "", note: "" });
        isPreOrder ? fetchPreOrders() : fetchOrders();
        const updated = await res.json();
        setSelectedOrder(updated);
      }
    } catch { showNotification("Failed to add courier log", "error"); }
  };

  const updateShipmentStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/shipments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) { fetchShipments(); fetchPreOrders(); showNotification("Shipment Status Updated!", "success"); }
    } catch (err) { console.error(err); showNotification("Failed to update status", "error"); }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ stock: newStock }),
      });
      if (response.ok) {
        fetchProducts();
        setEditingId(null); setEditValue("");
        showNotification("Stock updated successfully!", "success");
      } else {
        const data = await response.json();
        showNotification("Error: " + data.error, "error");
      }
    } catch (error) { showNotification("Failed to update stock: " + error.message, "error"); }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) { fetchProducts(); showNotification("Product deleted successfully!", "success"); }
      else { const data = await response.json(); showNotification("Error: " + data.error, "error"); }
    } catch (error) { showNotification("Failed to delete product: " + error.message, "error"); }
  };

  const showNotification = (message, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts(prev => prev.filter(toast => toast.id !== id)); }, 3000);
  };

  const getProfitMargin = (retail, importCost) => {
    const profit = ((retail - importCost) / retail * 100).toFixed(1);
    return { value: profit, class: profit >= 30 ? 'high' : profit >= 15 ? 'medium' : 'low' };
  };

  const getStockBarColor = (stock) => { if (stock > 20) return '#10B981'; if (stock > 10) return '#F59E0B'; return '#EF4444'; };
  const formatStockValue = (stock) => { if (stock >= 1e9) return (stock / 1e9).toFixed(1) + 'B'; if (stock >= 1e6) return (stock / 1e6).toFixed(1) + 'M'; if (stock >= 1e3) return (stock / 1e3).toFixed(1) + 'K'; return stock.toString(); };
  const startEditing = (product) => { setEditingId(product._id); setEditValue(product.stock.toString()); };
  const cancelEditing = () => { setEditingId(null); setEditValue(""); };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const prevLowStock = useRef([]);
  useEffect(() => {
    const newLowStock = lowStockProducts.filter(
      (product) => !prevLowStock.current.some((p) => p._id === product._id)
    );
    newLowStock.forEach((product) => {
      showNotification(`Low stock: ${product.name} (${product.stock} left)`, "error");
    });
    prevLowStock.current = lowStockProducts;
  }, [lowStockProducts]);

  if (loading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner"></div>
        <p>Loading inventory...</p>
      </div>
    );
  }

  // Export handler for revenue data
  const handleExportRevenue = () => {
    let exportData = [];
    let filename = 'revenue_export.csv';
    
    if (revenueGroupBy !== 'none' && revenueChartData.length > 0) {
      // Export the grouped data
      exportData = revenueChartData.map(item => ({
        Period: item.period,
        Revenue: item.totalRevenue,
        Profit: item.totalProfit,
        Orders: item.orderCount
      }));
      filename = `revenue_${revenueGroupBy}_export.csv`;
    } else {
      // Export the totals as a single row
      exportData = [{
        Period: `${revenueStartDate || 'start'} to ${revenueEndDate || 'end'}`,
        Revenue: revenueData.totalRevenue,
        Profit: revenueData.totalProfit,
        Orders: revenueData.orderCount,
        Margin: revenueData.margin + '%'
      }];
      filename = 'revenue_totals.csv';
    }
    
    exportToCSV(exportData, filename);
    showNotification('CSV exported successfully', 'success');
  };

  return (
    <div className="admin-page">
      <div className="toast-container">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`toast ${toast.type}`}
            style={{ bottom: `${20 + index * 80}px`, zIndex: 9999 - index }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="admin-header">
        <h1 className="admin-title">Admin <span className="gradient-text">Dashboard</span></h1>
        <p className="admin-subtitle">Welcome back, {user?.name}! You have full access to manage inventory and operations.</p>

        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><Box size={18} /> Products</button>
          <button className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}><DollarSign size={18} /> Revenue</button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><ClipboardList size={18} /> Order Queue</button>
          <button className={`tab-btn ${activeTab === 'preorders' ? 'active' : ''}`} onClick={() => setActiveTab('preorders')}><ShoppingCart size={18} /> Pre-Orders</button>
          <button className={`tab-btn ${activeTab === 'shipments' ? 'active' : ''}`} onClick={() => setActiveTab('shipments')}><Ship size={18} /> Shipments</button>
          <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}><Tag size={18} /> Categories</button>
          <button className={`tab-btn ${activeTab === 'membership' ? 'active' : ''}`} onClick={() => setActiveTab('membership')}><Users size={18} /> Membership</button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <OrderQueue orders={orders} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} updateOrderStatus={updateOrderStatus} courierForm={courierForm} setCourierForm={setCourierForm} handleAddCourierLog={handleAddCourierLog} generateManifest={generateManifest} />
      )}
      {activeTab === 'products' && (
        <ProductManager form={form} setForm={setForm} handleChange={handleChange} handleImageUpload={handleImageUpload} categories={categories} handleSubmit={handleSubmit} isSubmitting={isSubmitting} products={products} lowStockProducts={lowStockProducts} outOfStockProducts={outOfStockProducts} setShowLowStockModal={setShowLowStockModal} setShowOutOfStockModal={setShowOutOfStockModal} searchTerm={searchTerm} setSearchTerm={setSearchTerm} filteredProducts={filteredProducts} getProfitMargin={getProfitMargin} getStockBarColor={getStockBarColor} formatStockValue={formatStockValue} editingId={editingId} editValue={editValue} setEditValue={setEditValue} handleStockUpdate={handleStockUpdate} cancelEditing={cancelEditing} startEditing={startEditing} handleDelete={handleDelete} />
      )}
      {activeTab === 'preorders' && (
        <PreOrderManager preOrders={preOrders} updatePreOrderStatus={updatePreOrderStatus} linkPreOrderToShipment={linkPreOrderToShipment} shipments={shipments} />
      )}
      {activeTab === 'shipments' && (
        <ShipmentManager shipmentForm={shipmentForm} handleShipmentChange={handleShipmentChange} handleCreateShipment={handleCreateShipment} shipments={shipments} updateShipmentStatus={updateShipmentStatus} updateShipmentETA={updateShipmentETA} />
      )}
      {activeTab === 'categories' && (
        <CategoryManager categoryForm={categoryForm} handleCategoryChange={handleCategoryChange} handleCategoryImageUpload={handleCategoryImageUpload} handleCreateCategory={handleCreateCategory} categories={categories} handleDeleteCategory={handleDeleteCategory} />
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="product-list-card">
          <div className="product-list-header">
            <div className="product-list-title">
              <h2><DollarSign size={24} /> Financial <span className="gradient-text">Dashboard</span></h2>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ color: '#94a3b8', fontSize: '0.9rem' }}>From: <input type="date" value={revenueStartDate} onChange={e => setRevenueStartDate(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.4rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }} /></label>
              <label style={{ color: '#94a3b8', fontSize: '0.9rem' }}>To: <input type="date" value={revenueEndDate} onChange={e => setRevenueEndDate(e.target.value)} style={{ marginLeft: '0.5rem', padding: '0.4rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }} /></label>
              <select value={revenueGroupBy} onChange={e => setRevenueGroupBy(e.target.value)} style={{ padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f8fafc' }}>
                <option value="none">Totals Only</option>
                <option value="day">Daily Breakdown</option>
                <option value="month">Monthly Breakdown</option>
              </select>
              {/* Export Button */}
              <button
                onClick={handleExportRevenue}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-box clickable total-value"><DollarSign size={24} /><div className="stat-details"><span className="stat-value">৳{revenueData.totalRevenue.toLocaleString()}</span><span className="stat-label">Total Revenue</span></div></div>
            <div className="stat-box clickable" style={{ borderLeft: '4px solid #10b981' }}><TrendingUp size={24} /><div className="stat-details"><span className="stat-value" style={{ color: '#10b981' }}>৳{revenueData.totalProfit.toLocaleString()}</span><div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Net Profit <span className="profit-badge high" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{revenueData.margin}% Margin</span></div></div></div>
            <div className="stat-box clickable"><Package size={24} /><div className="stat-details"><span className="stat-value">{revenueData.orderCount}</span><span className="stat-label">Delivered Orders</span></div></div>
            <div className="stat-box clickable"><Activity size={24} /><div className="stat-details"><span className="stat-value">{revenueData.orderCount > 0 ? `৳${(revenueData.totalRevenue / revenueData.orderCount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "৳0.00"}</span><span className="stat-label">Avg. Order Value</span></div></div>
          </div>

          {revenueChartData.length > 0 && revenueGroupBy !== 'none' && (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '1rem', marginTop: '1rem' }}>
              <h3 style={{ color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={20} /> Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="period" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#3b82f6" name="Revenue" maxBarSize={40} isAnimationActive={false} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalProfit" fill="#10b981" name="Profit" maxBarSize={40} isAnimationActive={false} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Membership Tab */}
      {activeTab === 'membership' && (
        <div className="product-list-card">
          <div className="product-list-header">
            <div className="product-list-title">
              <h2><Users size={24} /> Membership <span className="gradient-text">Loyalty</span></h2>
            </div>
            <div className="product-count-badge">{membershipUsers.length} members</div>
          </div>
          
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-box clickable"><Award size={20} color="#3b82f6" /><div className="stat-details"><span className="stat-value">{membershipUsers.filter(u => u.membershipTier === 'Platinum').length}</span><span className="stat-label">Platinum</span></div></div>
            <div className="stat-box clickable"><Crown size={20} color="#f59e0b" /><div className="stat-details"><span className="stat-value">{membershipUsers.filter(u => u.membershipTier === 'Gold').length}</span><span className="stat-label">Gold</span></div></div>
            <div className="stat-box clickable"><Star size={20} color="#cbd5e1" /><div className="stat-details"><span className="stat-value">{membershipUsers.filter(u => u.membershipTier === 'Silver').length}</span><span className="stat-label">Silver</span></div></div>
            <div className="stat-box clickable"><Users size={20} color="#94a3b8" /><div className="stat-details"><span className="stat-value">{membershipUsers.filter(u => u.membershipTier === 'Basic').length}</span><span className="stat-label">Basic</span></div></div>
          </div>

          {membershipLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loading-spinner"></div></div>
          ) : (
            <div className="product-table-container">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Tier</th>
                    <th>Points</th>
                    <th>Total Spent</th>
                    <th>Next Tier</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipUsers.map(member => {
                    const nextTierInfo = getNextTier(member.loyaltyPoints);
                    const TierIcon = member.membershipTier === 'Platinum' ? Award : 
                                     member.membershipTier === 'Gold' ? Crown :
                                     member.membershipTier === 'Silver' ? Star : null;
                    const tierColor = member.membershipTier === 'Platinum' ? '#3b82f6' :
                                      member.membershipTier === 'Gold' ? '#f59e0b' : '#cbd5e1';
                    return (
                      <tr key={member._id}>
                        <td><strong>{member.name}</strong><br /><small style={{ color: '#64748b' }}>{member.email}</small></td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: tierColor }}>
                            {TierIcon && <TierIcon size={16} />}
                            {member.membershipTier}
                          </span>
                        </td>
                        <td>{member.loyaltyPoints.toLocaleString()}</td>
                        <td>৳{member.totalSpent.toLocaleString()}</td>
                        <td style={{ color: '#10b981', fontSize: '0.85rem' }}>
                          {nextTierInfo ? `${nextTierInfo.pointsNeeded.toLocaleString()} pts to ${nextTierInfo.tier}` : 'Max Tier'}
                        </td>
                        <td>
                          <button className="action-btn edit-btn" onClick={() => {
                            const newPoints = prompt('Set new point balance:', member.loyaltyPoints);
                            if (!newPoints) return;
                            fetch(`http://localhost:5000/api/users/membership/${member._id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                              body: JSON.stringify({ loyaltyPoints: parseInt(newPoints) })
                            }).then(() => fetchMembershipStats());
                          }}>Edit Points</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showLowStockModal && (
        <div className="modal-overlay" onClick={() => setShowLowStockModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2><AlertTriangle size={24} /> Low Stock Products ({lowStockProducts.length})</h2><button className="modal-close" onClick={() => setShowLowStockModal(false)}>×</button></div>
            <div className="modal-body">
              {lowStockProducts.length === 0 ? (<div className="empty-state"><p>No low stock products found.</p></div>) : (
                <table className="product-table"><thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Status</th><th>Action</th></tr></thead><tbody>{lowStockProducts.map(product => (<tr key={product._id}><td><div className="product-info-cell"><span className="product-name">{product.name}</span></div></td><td>{product.category || 'Uncategorized'}</td><td><span style={{ color: product.stock === 0 ? '#EF4444' : product.stock < 5 ? '#F59E0B' : '#10B981', fontWeight: 'bold' }}>{product.stock}</span></td><td><span className="status-badge low-stock">Low Stock</span></td><td><button className="action-btn edit-btn" onClick={() => { setShowLowStockModal(false); startEditing(product); }}>Update Stock</button></td></tr>))}</tbody></table>
              )}
            </div>
            <div className="modal-footer"><button className="submit-btn" onClick={() => setShowLowStockModal(false)}>Close</button></div>
          </div>
        </div>
      )}

      {showOutOfStockModal && (
        <div className="modal-overlay" onClick={() => setShowOutOfStockModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2><XCircle size={24} /> Out of Stock Products ({outOfStockProducts.length})</h2><button className="modal-close" onClick={() => setShowOutOfStockModal(false)}>×</button></div>
            <div className="modal-body">
              {outOfStockProducts.length === 0 ? (<div className="empty-state"><p>No out of stock products found.</p></div>) : (
                <table className="product-table"><thead><tr><th>Product</th><th>Category</th><th>Last Stock</th><th>Status</th><th>Action</th></tr></thead><tbody>{outOfStockProducts.map(product => (<tr key={product._id}><td><div className="product-info-cell"><span className="product-name">{product.name}</span></div></td><td>{product.category || 'Uncategorized'}</td><td><span style={{ color: '#EF4444', fontWeight: 'bold' }}>0</span></td><td><span className="status-badge out-of-stock">Out of Stock</span></td><td><button className="action-btn edit-btn" onClick={() => { setShowOutOfStockModal(false); startEditing(product); }}>Restock</button></td></tr>))}</tbody></table>
              )}
            </div>
            <div className="modal-footer"><button className="submit-btn" onClick={() => setShowOutOfStockModal(false)}>Close</button></div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {manifestData && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManifestData(null)}>
            <motion.div className="modal-content glass-morph" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
              <div className="modal-header"><h2><FileText size={24} /> Warehouse Dispatch Manifest</h2><button className="modal-close" onClick={() => setManifestData(null)}>×</button></div>
              <div className="modal-body"><p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>The following items must be picked and packed for current pending orders.</p>
                <table className="product-table"><thead><tr><th>Item Name</th><th>Total Quantity To Pick</th><th>Status</th></tr></thead><tbody>{manifestData.map((item, i) => (<tr key={i}><td style={{ fontWeight: 'bold' }}>{item.name}</td><td><span className="quantity-badge">{item.quantity} units</span></td><td><span className="status-badge processing">Ready to Pick</span></td></tr>))}</tbody></table>
              </div>
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setManifestData(null)}>Close</button><button className="submit-btn" onClick={() => window.print()}><Printer size={18} /> Print Manifest</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
          .glass-morph { background: rgba(15, 23, 42, 0.8) !important; backdrop-filter: blur(20px) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important; }
          .quantity-badge { background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 0.3rem 0.8rem; border-radius: 999px; font-weight: 800; }
          @media print { .navbar, .admin-sidebar, .modal-header, .modal-footer, .card-header { display: none !important; } .modal-content { position: absolute; top: 0; left: 0; width: 100%; border: none; box-shadow: none; background: white !important; color: black !important; } .product-table { width: 100%; border-collapse: collapse; } .product-table th, .product-table td { border: 1px solid #eee; padding: 10px; color: black !important; } }
      `}</style>
    </div>
  );
}

export default Admin;