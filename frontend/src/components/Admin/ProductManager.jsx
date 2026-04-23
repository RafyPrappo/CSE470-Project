import React, { memo } from 'react';
import { Plus, Camera, Sparkles, BarChart3, Package, CheckCircle, AlertTriangle, XCircle, Search, Edit, Trash2 } from 'lucide-react';

const ProductManager = memo(({
  form,
  setForm,
  handleChange,
  handleImageUpload,
  categories,
  handleSubmit,
  isSubmitting,
  products,
  lowStockProducts,
  outOfStockProducts,
  setShowLowStockModal,
  setShowOutOfStockModal,
  searchTerm,
  setSearchTerm,
  filteredProducts,
  getProfitMargin,
  getStockBarColor,
  formatStockValue,
  editingId,
  editValue,
  setEditValue,
  handleStockUpdate,
  cancelEditing,
  startEditing,
  handleDelete
}) => {
  return (
    <div className="admin-grid">
      {/* Add Product Form */}
      <div className="admin-card form-card">
        <div className="card-header">
          <h2>
            <span className="header-icon" style={{marginRight: '8px'}}><Plus size={24}/></span>
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
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
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
            <div className="image-upload-row">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="image-upload-input"
                id="product-image-upload"
              />
              <label htmlFor="product-image-upload" className="image-upload-button">
                <span className="button-icon" style={{marginRight: '8px'}}><Camera size={18}/></span>
                Choose Image
              </label>
              {form.image && (
                <>
                  <span className="image-filename">Image selected</span>
                  <button
                    type="button"
                    className="image-clear-btn"
                    onClick={() => setForm({ ...form, image: "" })}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </>
              )}
              {!form.image && (
                <span className="image-hint">PNG, JPG (max 2MB)</span>
              )}
            </div>
            {form.image && (
              <div className="image-preview-thumb">
                <img src={form.image} alt="Preview" />
              </div>
            )}
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
                <span style={{marginRight: '8px'}}><Sparkles size={18}/></span>
                Add Product
              </>
            )}
          </button>
        </form>
      </div>

      <div className="admin-card stats-card">
        <div className="card-header">
          <h2>
            <span className="header-icon" style={{marginRight: '8px'}}><BarChart3 size={24}/></span>
            Overview
          </h2>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon"><Package size={24}/></div>
            <div className="stat-details">
              <span className="stat-value">{products.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon"><CheckCircle size={24}/></div>
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
            title="Click to view low stock products"
          >
            <div className="stat-icon"><AlertTriangle size={24}/></div>
            <div className="stat-details">
              <span className="stat-value">{lowStockProducts.length}</span>
              <span className="stat-label">Low Stock</span>
            </div>
          </div>

          <div
            className="stat-box clickable"
            onClick={() => setShowOutOfStockModal(true)}
            title="Click to view out of stock products"
          >
            <div className="stat-icon"><XCircle size={24}/></div>
            <div className="stat-details">
              <span className="stat-value">{outOfStockProducts.length}</span>
              <span className="stat-label">Out of Stock</span>
            </div>
          </div>
        </div>
      </div>

      <div className="product-list-card">
        <div className="product-list-header">
          <span className="product-count-badge">{products.length} items</span>
          <div className="search-box">
            <span className="search-icon"><Search size={18}/></span>
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
            <div className="empty-state-icon" style={{color: '#3b82f6', marginBottom: '1rem'}}><Package size={48}/></div>
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
                  <th>Stock</th>
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
                                <span className="action-icon" style={{marginRight: '6px'}}><Edit size={16}/></span>
                                <span className="action-text">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(product._id)}
                                className="action-btn delete-btn"
                                title="Delete product"
                              >
                                <span className="action-icon" style={{marginRight: '6px'}}><Trash2 size={16}/></span>
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
  );
});

export default ProductManager;
