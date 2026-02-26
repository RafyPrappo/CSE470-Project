import { useState } from "react";
import "./ProductCard.css";

function ProductCard({ product, onAddToCart, onNotify, isLoggedIn }) {
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
    switch(status) {
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
      onNotify(product);
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
            <div className="restock-notice">
              <span>🔄 Restocking soon</span>
            </div>
          )}
        </div>

        {status !== 'out-of-stock' && (
          <div className="cart-section">
            {!showQuantitySelector ? (
              <button 
                className={`action-btn cart-btn ${!isLoggedIn ? 'disabled' : ''}`}
                onClick={handleButtonClick}
                title={!isLoggedIn ? "Login to add items to cart" : ""}
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
                    'Confirm'
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
        )}

        {status === 'out-of-stock' && (
          <button 
            className={`action-btn notify-btn ${!isLoggedIn ? 'disabled' : ''}`}
            onClick={handleButtonClick}
            disabled={!isLoggedIn}
            title={!isLoggedIn ? "Login to get notified" : ""}
          >
            <span>🔔</span>
            {isLoggedIn ? 'Notify Me' : 'Login to Notify'}
          </button>
        )}

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