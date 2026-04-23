import React, { memo } from 'react';
import { ShoppingCart } from 'lucide-react';

const PreOrderManager = memo(({ 
  preOrders, 
  updatePreOrderStatus, 
  linkPreOrderToShipment, 
  shipments 
}) => {
  return (
    <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
      <div className="admin-card">
        <div className="card-header">
          <h2><span className="header-icon" style={{marginRight: '8px'}}><ShoppingCart size={24}/></span> Pre-Order Requests</h2>
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
  );
});

export default PreOrderManager;
