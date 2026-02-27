import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./ProductDetails.css";

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, token } = useAuth();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:5000/api/products/${id}`);
            if (!res.ok) throw new Error("Product not found");
            const data = await res.json();
            setProduct(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getProductStatus = () => {
        if (!product) return 'unknown';
        if (product.stock <= 0) return 'out-of-stock';
        if (product.stock < 5) return 'low-stock';
        return 'in-stock';
    };

    const status = getProductStatus();
    const isPreOrderRequest = status === 'out-of-stock' || product?.isPreOrder;

    const handleQuantityChange = (delta) => {
        setQuantity(prev => {
            const newValue = prev + delta;
            if (newValue < 1) return 1;
            if (!isPreOrderRequest && newValue > product.stock) return product.stock;
            return newValue;
        });
    };

    const handleAction = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setIsAdding(true);
        try {
            if (isPreOrderRequest) {
                // Pre-order flow
                const response = await fetch("http://localhost:5000/api/preorders", {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ productId: product._id, quantity }),
                });

                if (!response.ok) throw new Error('Failed to place pre-order');

                showToast(`✅ Successfully requested pre-order for ${quantity} × ${product.name}!`);
            } else {
                // Normal Cart Flow
                addToCart(product, quantity);
                showToast(`✅ Added ${quantity} × ${product.name} to cart`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsAdding(false);
            setQuantity(1);
        }
    };

    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    if (loading) return (
        <div className="product-details-container loading">
            <div className="spinner-large"></div>
            <h2>Loading Product Details...</h2>
        </div>
    );

    if (error || !product) return (
        <div className="product-details-container error">
            <h2>Oops!</h2>
            <p>{error || "Product could not be loaded."}</p>
            <button className="btn-secondary" onClick={() => navigate('/products')}>Return to Shop</button>
        </div>
    );

    return (
        <div className="product-details-container">
            <button className="back-btn" onClick={() => navigate('/products')}>
                ← Back to Products
            </button>

            <div className="product-details-grid">
                <div className="product-image-section">
                    <img
                        src={product.image || `https://via.placeholder.com/600x600/1E293B/3B82F6?text=${product.name}`}
                        alt={product.name}
                        className="main-image"
                    />
                </div>

                <div className="product-info-section">
                    <div className="product-header">
                        <span className="category-tag">{product.category}</span>
                        <h1 className="product-title">{product.name}</h1>
                        <div className="product-price-row">
                            <span className="price">৳{product.retailPrice.toLocaleString()}</span>
                            {status === 'in-stock' && <span className="status-badge instock">✅ In Stock</span>}
                            {status === 'low-stock' && <span className="status-badge lowstock">⚠️ Only {product.stock} Left</span>}
                            {status === 'out-of-stock' && <span className="status-badge outofstock">❌ Out of Stock</span>}
                        </div>
                    </div>

                    <div className="product-description-container">
                        <h3>About this Product</h3>
                        {product.description ? (
                            <p className="description-text">{product.description}</p>
                        ) : (
                            <p className="description-text empty">No detailed description provided.</p>
                        )}
                    </div>

                    <div className="product-action-section">
                        {isPreOrderRequest ? (
                            <div className="preorder-notice">
                                <span className="notice-icon">🛒</span>
                                <p>This item is currently out of stock. You can place a pre-order request now, and we will arrange it for you!</p>
                            </div>
                        ) : null}

                        <div className="action-row">
                            <div className="quantity-controls">
                                <button className="qty-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>−</button>
                                <span className="qty-display">{quantity}</span>
                                <button className="qty-btn" onClick={() => handleQuantityChange(1)} disabled={!isPreOrderRequest && quantity >= product.stock}>+</button>
                            </div>

                            <button
                                className={`action-btn ${isPreOrderRequest ? 'preorder-btn' : 'add-cart-btn'} ${isAdding ? 'loading' : ''}`}
                                onClick={handleAction}
                                disabled={isAdding}
                            >
                                {isAdding ? (
                                    <span className="spinner-small" />
                                ) : isPreOrderRequest ? (
                                    <>Request Pre-order</>
                                ) : (
                                    <>Add to Cart</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetails;
