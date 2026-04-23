import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Package, Truck, Trash2, XCircle, AlertTriangle } from "lucide-react";
import "./MyPreOrders.css";

function MyPreOrders() {
    const [preOrders, setPreOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editingQuantity, setEditingQuantity] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const { token, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchPreOrders();
            // poll periodically to reflect status updates or shipment changes
            const interval = setInterval(() => {
                fetchPreOrders();
            }, 15000); // every 15 seconds
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, token]);

    const fetchPreOrders = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:5000/api/preorders/my", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error("Failed to fetch pre-orders");
            const data = await res.json();
            setPreOrders(data);
        } catch (err) {
            console.error(err);
            setError("Could not load your pre-orders.");
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (id, newQuantity) => {
        if (!newQuantity || newQuantity < 1) {
            showNotification("Quantity must be at least 1", "error");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/preorders/${id}/quantity`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: parseInt(newQuantity) })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update quantity");
            }

            const updated = await res.json();
            setPreOrders(preOrders.map(p => p._id === id ? updated : p));
            setEditingId(null);
            showNotification("✅ Quantity updated successfully!", "success");
        } catch (err) {
            console.error(err);
            showNotification(err.message, "error");
        }
    };

    const removeCancelled = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/preorders/${id}/remove`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to remove pre-order");
            }
            setPreOrders(preOrders.filter(p => p._id !== id));
            showNotification("🗑️ Cancelled pre-order removed", "success");
        } catch (err) {
            console.error(err);
            showNotification(err.message, "error");
        }
    };

    const cancelPreOrder = async (id, productName) => {
        if (!confirm(`Are you sure you want to cancel the pre-order for ${productName}?`)) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/preorders/${id}`, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to cancel pre-order");
            }

            setPreOrders(preOrders.filter(p => p._id !== id));
            showNotification("✅ Pre-order cancelled successfully!", "success");
        } catch (err) {
            console.error(err);
            showNotification(err.message, "error");
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

    const getStatusProgress = (po) => {
        // Base pre-order statuses alongside shipment statuses
        const states = [
            "PENDING",
            "APPROVED",
            "PROCESSING",
            "SHIPPED",
            "CUSTOMS",
            "LOCAL_HUB",
            "DELIVERED"
        ];

        let currentStatus = po.status;

        // If the pre-order is tied to a shipment, the shipment dictates the exact progress step
        if (po.shipment && po.shipment.status && po.status !== "CANCELLED" && po.status !== "DELIVERED") {
            currentStatus = po.shipment.status;
        }

        let idx = states.indexOf(currentStatus);

        // Fallback for unexpected statuses
        if (idx === -1) {
            if (currentStatus === "CANCELLED") return -1;
            idx = 0;
        }

        return Math.max(0, (idx / (states.length - 1)) * 100);
    };

    const getDetailedStatus = (po) => {
        if (po.shipment && po.shipment.status && po.status !== "CANCELLED" && po.status !== "DELIVERED") {
            return po.shipment.status;
        }
        return po.status;
    };

    const getEstimatedArrivalText = (preOrder) => {
        if (preOrder.estimatedArrival) {
            return new Date(preOrder.estimatedArrival).toLocaleDateString();
        }
        if (preOrder.shipment?.finalETA) {
            return new Date(preOrder.shipment.finalETA).toLocaleDateString();
        }
        return "TBD (Awaiting Shipping Details)";
    };

    if (loading) return <div className="loading-state">Loading your pre-orders...</div>;
    if (!isAuthenticated) return <div className="error-state">Please login to view your pre-orders.</div>;
    if (error) return <div className="error-state">{error}</div>;

    const displayedPreOrders = preOrders.filter(po => {
        if (filterStatus === 'ALL') return true;
        return po.status === filterStatus;
    });

    return (
        <div className="my-preorders-page">
            <div className="preorders-header">
                <h1>My <span className="gradient-text">Pre-Orders</span></h1>
                <p>Track your upcoming exclusive items here.</p>
                <div className="status-filter" style={{ marginTop: '1rem' }}>
                    <label htmlFor="statusSelect" style={{ marginRight: '0.5rem', fontWeight: '600' }}>Show:</label>
                    <select
                        id="statusSelect"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '0.3rem', borderRadius: '0.25rem' }}
                    >
                        <option value="ALL">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {displayedPreOrders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon" style={{color: '#3b82f6', marginBottom: '1rem'}}><Package size={64}/></div>
                    <h3>No Pre-Orders Found</h3>
                    <p>Try selecting a different status or refresh the page.</p>
                </div>
            ) : (
                <div className="preorders-list">
                    {displayedPreOrders.map((po) => (
                        <div key={po._id} className={`preorder-card ${po.status.toLowerCase()}`}>
                            <div className="po-card-header">
                                <div className="po-details-basic">
                                    <h3>{po.product?.name || "Unknown Product"}</h3>
                                    <p>Ordered on: {new Date(po.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className={`po-status-badge ${po.status.toLowerCase()}`}>
                                    {po.status === 'CANCELLED' ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={16} /> CANCELLED</span> : po.status}
                                </div>
                            </div>

                            {po.status !== 'CANCELLED' && (
                                <div className="po-progress-section">
                                    <div className="progress-bar-container">
                                        <div
                                            className={`progress-bar-fill ${getDetailedStatus(po).toLowerCase()}`}
                                            style={{ width: `${getStatusProgress(po)}%` }}
                                        ></div>
                                    </div>
                                    <div className="progress-labels">
                                        <span>Pending</span>
                                        <span>Approved</span>
                                        <span>Processing</span>
                                        <span>Shipped</span>
                                        <span>Customs</span>
                                        <span>Local</span>
                                        <span>Delivered</span>
                                    </div>
                                </div>
                            )}

                            <div className="po-card-body">
                                <div className="po-info-row">
                                    <div className="po-info-item">
                                        <span className="info-label">Price per Item</span>
                                        <span className="info-value">৳{po.product?.retailPrice?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                    <div className="po-info-item">
                                        <span className="info-label">Quantity</span>
                                        {po.status === 'PENDING' && editingId === po._id ? (
                                            <div className="quantity-editor">
                                                <button
                                                    onClick={() => updateQuantity(po._id, Math.max(1, editingQuantity - 1))}
                                                    className="qty-btn"
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={editingQuantity}
                                                    onChange={(e) => setEditingQuantity(parseInt(e.target.value) || 1)}
                                                    className="qty-input"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => updateQuantity(po._id, parseInt(editingQuantity) + 1)}
                                                    className="qty-btn"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => updateQuantity(po._id, editingQuantity)}
                                                    className="qty-save-btn"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="qty-cancel-btn"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="quantity-display">
                                                <span className="info-value">{po.quantity}</span>
                                                {po.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(po._id);
                                                            setEditingQuantity(po.quantity);
                                                        }}
                                                        className="qty-edit-btn"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="po-info-item">
                                        <span className="info-label">Total Amount</span>
                                        <span className="info-value total-price">
                                            ৳{(po.product?.retailPrice * po.quantity)?.toLocaleString() || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="po-info-row">
                                    <div className="po-info-item full-width">
                                        <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={16} /> Estimated Arrival</span>
                                        <span className="info-value">{getEstimatedArrivalText(po)}</span>
                                    </div>
                                </div>

                                {po.shipment && po.shipment.delayInDays > 0 && (
                                    <div className="po-delay-warning">
                                        <AlertTriangle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Shipment delayed by {po.shipment.delayInDays} days. ETA updated.
                                    </div>
                                )}
                            </div>

                            <div className="po-card-footer">
                                {po.status === 'PENDING' && (
                                    <button
                                        onClick={() => cancelPreOrder(po._id, po.product?.name)}
                                        className="cancel-btn"
                                        title="Cancel this pre-order"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Trash2 size={18} /> Cancel Pre-Order
                                    </button>
                                )}
                                {po.status === 'CANCELLED' && (
                                    <>
                                        <span className="cancelled-info">This pre-order has been cancelled</span>
                                        <button
                                            onClick={() => removeCancelled(po._id)}
                                            className="cancel-btn"
                                            style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderColor: '#ef4444' }}
                                            title="Remove this cancelled order"
                                        >
                                            Remove
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyPreOrders;
