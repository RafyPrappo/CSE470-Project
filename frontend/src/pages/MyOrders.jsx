import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./MyPreOrders.css"; // Reuse styling for consistency

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated, token]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:5000/api/orders/my", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch orders");
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error(err);
            setError("Could not load your orders.");
        } finally {
            setLoading(false);
        }
    };

    const cancelOrder = async (id) => {
        if (!confirm("Are you sure you want to cancel this order? Stock will be returned to inventory.")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/orders/${id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to cancel order");
            }

            // Update local state
            setOrders(orders.map(o => o._id === id ? { ...o, status: 'CANCELLED' } : o));
            showNotification("✅ Order cancelled successfully!", "success");
        } catch (err) {
            showNotification(err.message, "error");
        }
    };

    const showNotification = (message, type = "success") => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    if (loading) return <div className="loading-state">Loading your orders...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="my-preorders-page">
            <div className="preorders-header">
                <h1>My <span className="gradient-text">Orders</span></h1>
                <p>Track your standard shipments and order history.</p>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🛍️</div>
                    <h3>No Orders Found</h3>
                    <p>You haven't placed any standard orders yet.</p>
                </div>
            ) : (
                <div className="preorders-list">
                    {orders.map((order) => (
                        <div key={order._id} className={`preorder-card ${order.status.toLowerCase()}`}>
                            <div className="po-card-header">
                                <div className="po-details-basic">
                                    <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                                    <p>Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className={`po-status-badge ${order.status.toLowerCase()}`}>
                                    {order.status}
                                </div>
                            </div>

                            <div className="order-items-summary">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="order-item-row">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>৳{item.price.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="order-total-row">
                                    <strong>Total Amount:</strong>
                                    <strong>৳{order.totalAmount.toLocaleString()}</strong>
                                </div>
                            </div>

                            <div className="po-card-body">
                                <div className="po-info-row">
                                    <div className="po-info-item full-width">
                                        <span className="info-label">📍 Shipping To</span>
                                        <span className="info-value">
                                            {order.shippingAddress.label}: {order.shippingAddress.street}, {order.shippingAddress.city}
                                        </span>
                                    </div>
                                </div>

                                {/* Feature 13 Upgrade: 3D Visualization & Advanced Tracker */}
                                <div className="order-visual-tracking">
                                    <div className="package-3d-scene">
                                        <div className={`package-box ${order.status.toLowerCase()}`}>
                                            <div className="face front"></div>
                                            <div className="face back"></div>
                                            <div className="face left"></div>
                                            <div className="face right"></div>
                                            <div className="face top"></div>
                                            <div className="face bottom"></div>
                                        </div>
                                        <span className="visual-status-text">{order.status}</span>
                                    </div>

                                    <div className="step-tracker-horizontal">
                                        {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((step, sIdx) => {
                                            const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                                            const currentIdx = statusOrder.indexOf(order.status);
                                            const isCompleted = statusOrder.indexOf(step) <= currentIdx;
                                            const isActive = step === order.status;

                                            return (
                                                <div key={step} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                                    <div className="step-node">
                                                        {isCompleted ? '✓' : sIdx + 1}
                                                    </div>
                                                    <span className="step-label">{step}</span>
                                                    {sIdx < 3 && <div className="step-line"></div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {order.courierLogs?.length > 0 && (
                                    <div className="courier-log-section">
                                        <span className="info-label">🚚 Tracking Details</span>
                                        {order.courierLogs.map((log, lIdx) => (
                                            <div key={lIdx} className="courier-log-entry">
                                                <div className="log-header">
                                                    <strong>{log.courierName}</strong>
                                                    <span className="tracking-id">{log.trackingId}</span>
                                                </div>
                                                <p>{log.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="po-card-footer">
                                <button className="invoice-btn" onClick={() => window.print()}>
                                    📄 Download Invoice
                                </button>
                                {order.status === 'PENDING' && (
                                    <button onClick={() => cancelOrder(order._id)} className="cancel-btn">
                                        🗑️ Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyOrders;
