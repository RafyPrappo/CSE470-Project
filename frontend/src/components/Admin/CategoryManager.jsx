import React, { memo } from 'react';

const CategoryManager = memo(({
  categoryForm,
  handleCategoryChange,
  handleCategoryImageUpload,
  handleCreateCategory,
  categories,
  handleDeleteCategory
}) => {
  return (
    <div className="admin-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
      {/* Add Category Form */}
      <div className="admin-card form-card">
        <div className="card-header">
          <h2><span className="header-icon">🏷️</span> New Category</h2>
          <p className="card-description">Create a new product category</p>
        </div>
        <form onSubmit={handleCreateCategory} className="admin-form">
          <div className="form-group">
            <label>Category Name (Must be unique)</label>
            <input 
              type="text" 
              name="name" 
              className="form-input" 
              required 
              value={categoryForm.name} 
              onChange={handleCategoryChange} 
              placeholder="e.g. Smart Home" 
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input 
              type="text" 
              name="description" 
              className="form-input" 
              value={categoryForm.description} 
              onChange={handleCategoryChange} 
            />
          </div>
          <div className="form-group">
            <label>Cover Image (Required)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCategoryImageUpload}
              className="form-input file-input"
              required
            />
            {categoryForm.image && (
              <div className="image-preview" style={{ marginTop: '1rem', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <img 
                  src={categoryForm.image} 
                  alt="Preview" 
                  style={{ width: '100%', maxHeight: '150px', objectFit: 'cover' }} 
                />
              </div>
            )}
          </div>
          <button type="submit" className="submit-btn" style={{ marginTop: '1rem' }}>
            Create Category
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="admin-card">
        <div className="card-header">
          <h2><span className="header-icon">📋</span> Active Categories</h2>
        </div>
        <div className="product-table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c._id}>
                  <td>
                    <img 
                      src={c.image} 
                      alt={c.name} 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem' }} 
                    />
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                  <td>{c.description || '-'}</td>
                  <td>
                    <button
                      className="action-btn danger"
                      onClick={() => handleDeleteCategory(c._id)}
                      title="Delete Category"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No categories created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default CategoryManager;
