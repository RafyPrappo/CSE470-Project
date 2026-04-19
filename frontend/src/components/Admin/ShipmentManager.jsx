import React, { memo } from 'react';

const ShipmentManager = memo(({
  shipmentForm,
  handleShipmentChange,
  handleCreateShipment,
  shipments,
  updateShipmentStatus,
  updateShipmentETA
}) => {
  return (
    <div className="admin-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
      <div className="admin-card form-card">
        <div className="card-header">
          <h2><span className="header-icon">🚢</span> New Shipment Batch</h2>
          <p className="card-description">Register an incoming batch from China</p>
        </div>
        <form onSubmit={handleCreateShipment} className="admin-form">
          <div className="form-group">
            <label>Batch ID (Unique)</label>
            <input 
              type="text" 
              name="shipmentBatchId" 
              className="form-input" 
              required 
              value={shipmentForm.shipmentBatchId} 
              onChange={handleShipmentChange} 
              placeholder="e.g. BATCH-CN-001" 
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Origin</label>
              <input 
                type="text" 
                name="origin" 
                className="form-input" 
                value={shipmentForm.origin} 
                onChange={handleShipmentChange} 
              />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input 
                type="text" 
                name="destination" 
                className="form-input" 
                value={shipmentForm.destination} 
                onChange={handleShipmentChange} 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Base Expected Arrival</label>
            <input 
              type="date" 
              name="baseEstimatedArrival" 
              className="form-input" 
              required 
              value={shipmentForm.baseEstimatedArrival} 
              onChange={handleShipmentChange} 
            />
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
                  <td>
                    <select
                      value={s.status}
                      onChange={(e) => updateShipmentStatus(s._id, e.target.value)}
                      className="form-input"
                      style={{ padding: '0.4rem', border: '1px solid var(--accent-main)', minWidth: '120px' }}
                    >
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="CUSTOMS">CUSTOMS</option>
                      <option value="LOCAL_HUB">LOCAL_HUB</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </td>
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
  );
});

export default ShipmentManager;
