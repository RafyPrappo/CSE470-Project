import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  Truck, 
  ShieldCheck,
  ClipboardList,
  Layers
} from "lucide-react";

const OrderQueue = ({ 
  orders, 
  selectedOrder, 
  setSelectedOrder, 
  updateOrderStatus, 
  courierForm, 
  setCourierForm, 
  handleAddCourierLog, 
  generateManifest 
}) => {
  return (
    <div className="war-room-container">
      <div className="admin-grid" style={{ gridTemplateColumns: selectedOrder ? '1fr 400px' : '1fr' }}>
        {/* Main Order Queue */}
        <div className="admin-card">
          <div className="card-header">
            <div className="header-labels">
                <h2><span className="header-icon">📋</span> Global Order Queue</h2>
                <div className="header-actions">
                    <button className="manifest-btn pulse-glow" onClick={generateManifest}>
                        <ClipboardList size={18} />
                        Pick-List
                    </button>
                    <button className="action-btn-outline" onClick={() => setSelectedOrder(null)}><Layers size={18} /></button>
                </div>
            </div>
          </div>
          <div className="product-table-container">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} className={selectedOrder?._id === order._id ? 'selected-row' : ''}>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.user?.name || 'Unknown'}</td>
                    <td>{order.items.length} items</td>
                    <td>৳{order.totalAmount.toLocaleString()}</td>
                    <td>
                      <select 
                        value={order.status} 
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className={`status-select ${order.status.toLowerCase()}`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td>
                       <select 
                          value={order.priority || 'MEDIUM'} 
                          onChange={(e) => updateOrderStatus(order._id, null, "", e.target.value)}
                          className="priority-select"
                       >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                       </select>
                    </td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => setSelectedOrder(order)}>View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedOrder && (
          <div className="admin-card detail-panel">
            <div className="card-header">
               <button className="close-panel" onClick={() => setSelectedOrder(null)}>×</button>
               <h2>Order Details</h2>
               <p className="order-id">#{selectedOrder._id}</p>
            </div>
            
            <div className="detail-content">
                <div className="customer-box">
                    <strong>📍 Shipping Address</strong>
                    <p>{selectedOrder.shippingAddress.label}: {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}</p>
                    <p>Phone: {selectedOrder.shippingAddress.phone}</p>
                </div>

                <div className="courier-input-box">
                    <strong>🚚 Courier Tracking</strong>
                    <form onSubmit={(e) => handleAddCourierLog(e, selectedOrder._id)}>
                      <select value={courierForm.courierName} onChange={e => setCourierForm({...courierForm, courierName: e.target.value})} className="form-input">
                          <option value="Pathao">Pathao</option>
                          <option value="RedX">RedX</option>
                          <option value="Steadfast">Steadfast</option>
                          <option value="Paperfly">Paperfly</option>
                      </select>
                      <input placeholder="Tracking ID" value={courierForm.trackingId} onChange={e => setCourierForm({...courierForm, trackingId: e.target.value})} className="form-input" required />
                      <button type="submit" className="submit-btn small">Attach Log</button>
                    </form>
                </div>

                <div className="audit-trail-box">
                    <strong>📜 Audit Trail</strong>
                    <div className="mini-timeline">
                        {selectedOrder.statusHistory?.map((h, i) => (
                            <div key={i} className="timeline-dot">
                                <span className="dot"></span>
                                <div className="dot-info">
                                    <p>{h.status} - <small>{new Date(h.timestamp).toLocaleString()}</small></p>
                                    {h.note && <span>{h.note}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="status-update-box">
                    <strong>Quick Actions</strong>
                    <div className="action-grid">
                        <button onClick={() => updateOrderStatus(selectedOrder._id, 'PROCESSING')}>Mark Processing</button>
                        <button onClick={() => updateOrderStatus(selectedOrder._id, 'DELIVERED')} className="success">Mark Delivered</button>
                        <button onClick={() => updateOrderStatus(selectedOrder._id, 'CANCELLED')} className="danger">Cancel Order</button>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderQueue;
