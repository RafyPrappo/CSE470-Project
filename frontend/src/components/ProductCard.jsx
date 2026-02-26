import { useState } from "react";
import "./ProductCard.css";

function ProductCard({ product, onAddToCart, onNotify, isLoggedIn, existingPreOrder }) {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);

  // Dynamic status based on stock quantity
  const getProductStatus = () => {
    if (product.stock <= 0) return 'out-of-stock';
    if (product.stock < 5) return 'low-stock';
    return 'in-stock';
  };

  const status = getProductStatus();

  const getStatusBadge = () => {
    switch (status) {
      case 'low-stock':
        return <span className="badge lowstock">⚠️ Only {product.stock} left</span>;
      case 'out-of-stock':
        return <span className="badge outofstock">❌ Out of Stock</span>;
      default:
        return <span className="badge instock">✅ In Stock</span>;
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const newValue = prev + delta;
      if (newValue < 1) return 1;
      
      // For pre-orders (out of stock or explicitly marked), allow unlimited quantity
      const isPreOrderItem = product.isPreOrder || product.stock <= 0;
      if (isPreOrderItem) {
        return newValue; // No limit for pre-orders
      }
      
      // For regular items, limit by available stock
      if (newValue > product.stock) return product.stock;
      return newValue;
    });
  };

  const handleAddToCartClick = async () => {
    if (product.stock <= 0 || quantity > product.stock) return;

    setIsAddingToCart(true);
    try {
      await onAddToCart(product, quantity);
      setQuantity(1);
      setShowQuantitySelector(false);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleButtonClick = () => {
    if (!isLoggedIn) {
      onAddToCart(product, 0); // This will trigger the login prompt
      return;
    }

    if (status === 'out-of-stock') {
      setShowQuantitySelector(true);
    } else {
      setShowQuantitySelector(true);
    }
  };

  // Don't render if out of stock for more than 24 hours
  const shouldShowCard = () => {
    if (status !== 'out-of-stock') return true;

    if (product.outOfStockSince) {
      const hoursSinceOutOfStock = (Date.now() - new Date(product.outOfStockSince).getTime()) / (1000 * 60 * 60);
      return hoursSinceOutOfStock <= 24;
    }

    return true;
  };

  if (!shouldShowCard()) {
    return null;
  }

  return (
    <div className="product-card">
      <div className="card-image-container">
        {!imageError ? (
          <img
            src={product.image || `https://via.placeholder.com/300x200/1E293B/3B82F6?text=${product.name}`}
            alt={product.name}
            className="card-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="fallback-image">
            <span>📦</span>
          </div>
        )}

        {getStatusBadge()}
      </div>

      <div className="card-content">
        <h3 className="product-name">{product.name}</h3>

        <div className="product-details">
          <div className="price-section">
            <span className="currency">৳</span>
            <span className="price">{product.retailPrice}</span>
          </div>

          {status !== 'out-of-stock' && (
            <div className="stock-info">
              <div className="stock-bar">
                <div
                  className="stock-fill"
                  style={{
                    width: `${Math.min((product.stock / 50) * 100, 100)}%`,
                    backgroundColor: product.stock > 20 ? '#10B981' : product.stock > 10 ? '#F59E0B' : '#EF4444'
                  }}
                />
              </div>
              <span className="stock-count">{product.stock} units left</span>
            </div>
          )}

          {status === 'out-of-stock' && (
            <div className="restock-notice" style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
              <span>🔄 Currently Out of Stock - Available for Pre-Order</span>
            </div>
          )}
        </div>

        <div className="cart-section">
          {(product.isPreOrder || status === 'out-of-stock') ? (
            <div className="preorder-container" style={{ width: '100%', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.05)', marginBottom: '1rem' }}>
                <h4 style={{ color: '#f59e0b', fontWeight: 'bold', margin: 0, fontSize: '0.9rem' }}>
                  {existingPreOrder ? `Already Pre-ordered (Qty: ${existingPreOrder.quantity})` : (status === 'out-of-stock' ? "Out of Stock - Pre-order available" : "Available for Pre-order")}
                </h4>
                {product.arrivalEstimate ? (
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
                    <span style={{ marginRight: '0.5rem' }}>🚚</span>
                    Est. Delivery: <span style={{ fontWeight: '600', color: '#f8fafc' }}>
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(product.arrivalEstimate))} -
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(new Date(product.arrivalEstimate).setDate(new Date(product.arrivalEstimate).getDate() + 3)))}
                    </span>
                  </p>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>Awaiting shipment schedule.</p>
                )}
              </div>

              {!showQuantitySelector ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    className={`action-btn cart-btn ${!isLoggedIn ? 'disabled' : ''}`}
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', width: '100%' }}
                    onClick={handleButtonClick}
                    title={!isLoggedIn ? "Login to pre-order" : ""}
                  >
                    {existingPreOrder ? '➕ Add More' : (isLoggedIn ? 'Request Pre-order' : 'Login to Pre-order')}
                  </button>
                  {existingPreOrder && (
                    <button
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '600'
                      }}
                      onClick={() => {
                        // Navigate to pre-orders page
                        window.location.href = '/my-preorders';
                      }}
                    >
                      📝 Manage on Pre-Orders Page
                    </button>
                  )}
                </div>
              ) : (
                <div className="quantity-selector" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="quantity-controls" style={{ alignSelf: 'center', background: 'rgba(15, 23, 42, 0.5)' }}>
                    <button className="qty-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>−</button>
                    <span className="qty-display">{quantity}</span>
                    <button className="qty-btn" onClick={() => handleQuantityChange(1)}>+</button>
                  </div>
                  <button
                    className="confirm-btn"
                    onClick={async () => {
                      setIsAddingToCart(true);
                      try {
                        await onAddToCart(product, quantity);
                        setShowQuantitySelector(false);
                        setQuantity(1);
                      } catch (err) {
                        console.error('Add to order failed', err);
                      } finally {
                        setIsAddingToCart(false);
                      }
                    }}
                    disabled={isAddingToCart}
                    style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                  >
                    {isAddingToCart ? (existingPreOrder ? 'Updating...' : 'Requesting...') : (existingPreOrder ? 'Confirm Adding' : 'Confirm Pre-order')}
                  </button>
                  <button
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(107, 114, 128, 0.2)',
                      color: '#9ca3af',
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setShowQuantitySelector(false);
                      setQuantity(1);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : !showQuantitySelector ? (
            <button
              className={`action-btn cart-btn ${!isLoggedIn ? 'disabled' : ''}`}
              onClick={handleButtonClick}
              title={!isLoggedIn ? "Login to access options" : ""}
            >
              <span>🛒</span>
              {isLoggedIn ? 'Add to Cart' : 'Login to Buy'}
            </button>
          ) : (
            <div className="quantity-selector">
              <div className="quantity-controls">
                <button
                  className="qty-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="qty-display">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
              <button
                className="confirm-btn"
                onClick={handleAddToCartClick}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <>
                    <span className="spinner-small" />
                    Adding...
                  </>
                ) : (
                  'Confirm Add'
                )}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowQuantitySelector(false);
                  setQuantity(1);
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {status === 'low-stock' && isLoggedIn && (
          <div className="low-stock-warning">
            <span>⚡ Hurry! Only {product.stock} left</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;