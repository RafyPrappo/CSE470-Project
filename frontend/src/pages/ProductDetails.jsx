import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated, token } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPreOrdering, setIsPreOrdering] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/products/${id}`);
                if (!response.ok) {
                    throw new Error('Product not found');
                }
                const data = await response.json();
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        addToCart(product, quantity);
        showNotification('Added to cart successfully!');
    };

    const handlePreOrder = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setIsPreOrdering(true);
        try {
            const response = await fetch('http://localhost:5000/api/preorders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product._id,
                    quantity: quantity
                })
            });

            if (response.ok) {
                showNotification('Pre-order placed successfully!', 'success');
                setTimeout(() => navigate('/my-preorders'), 1500);
            } else {
                const data = await response.json();
                showNotification(data.error || 'Failed to place pre-order', 'error');
            }
        } catch (err) {
            showNotification('An error occurred while pre-ordering', 'error');
        } finally {
            setIsPreOrdering(false);
        }
    };

    if (loading) return <div className="product-details-loading"><div className="spinner"></div></div>;
    if (error) return <div className="product-details-error"><h2>{error}</h2><button onClick={() => navigate('/products')}>Back to Products</button></div>;
    if (!product) return null;

    const outOfStock = product.stock <= 0;

    return (
        <div className="product-details-container">
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}

            <button className="back-button" onClick={() => navigate(-1)}>
                &larr; Back
            </button>

            <div className="product-details-grid">
                <div className="product-details-image-section">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="product-details-image" />
                    ) : (
                        <div className="product-details-no-image">No Image Available</div>
                    )}
                </div>

                <div className="product-details-info-section">
                    <div className="product-details-header">
                        <span className="product-details-category">{product.category}</span>
                        <h1 className="product-details-title">{product.name}</h1>
                        <div className={`product-details-stock-badge ${outOfStock ? 'out-of-stock' : 'in-stock'}`}>
                            {outOfStock ? 'Out of Stock - Pre-Order Available' : 'In Stock'}
                        </div>
                    </div>

                    <div className="product-details-price-box">
                        <span className="product-details-price">${product.retailPrice.toFixed(2)}</span>
                        {!outOfStock && <span className="product-details-stock-count">{product.stock} units available</span>}
                    </div>

                    <div className="product-details-description">
                        <h3>Description</h3>
                        <p>{product.description || 'No detailed description available for this product.'}</p>
                    </div>

                    <div className="product-details-actions">
                        <div className="quantity-selector">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1 || isPreOrdering}
                            >-</button>
                            <span>{quantity}</span>
                            <button
                                onClick={() => setQuantity(outOfStock ? quantity + 1 : Math.min(product.stock, quantity + 1))}
                                disabled={(!outOfStock && quantity >= product.stock) || isPreOrdering}
                            >+</button>
                        </div>

                        {outOfStock ? (
                            <button
                                className="btn-preorder-large"
                                onClick={handlePreOrder}
                                disabled={isPreOrdering}
                            >
                                {isPreOrdering ? 'Processing...' : 'Pre-Order Now'}
                            </button>
                        ) : (
                            <button
                                className="btn-add-to-cart-large"
                                onClick={handleAddToCart}
                            >
                                Add to Cart
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
