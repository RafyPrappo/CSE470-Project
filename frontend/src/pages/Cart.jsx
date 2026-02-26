import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

function Cart() {
    const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);

    const subtotal = getCartTotal();
    const vatRate = 0.15; // 15% VAT
    const vatAmount = subtotal * vatRate;
    const grandTotal = subtotal + vatAmount;

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setIsCheckingOut(true);
        setCheckoutError(null);

        try {
            const checkoutPromises = cart.map(async (item) => {
                // Check if item is out of stock or is a pre-order item
                if (item.stock === 0 || item.isPreOrder) {
                    // Create a pre-order
                    return fetch(`http://localhost:5000/api/preorders`, {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ 
                            productId: item._id, 
                            quantity: item.cartQuantity 
                        }),
                    }).then(async res => {
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || `Failed to pre-order ${item.name}`);
                        return { type: 'preorder', data };
                    });
                } else {
                    // Regular order - decrease stock
                    return fetch(`http://localhost:5000/api/products/${item._id}/order`, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ quantity: item.cartQuantity }),
                    }).then(async res => {
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || `Failed to order ${item.name}`);
                        return { type: 'order', data };
                    });
                }
            });

            // Wait for all products to be successfully ordered or pre-ordered
            const results = await Promise.all(checkoutPromises);

            // Clear the cart
            clearCart();

            // Show success toast
            const preOrderCount = results.filter(r => r.type === 'preorder').length;
            const orderCount = results.filter(r => r.type === 'order').length;
            
            let message = '✅ Checkout completed! ';
            if (preOrderCount > 0) message += `${preOrderCount} item(s) pre-ordered. `;
            if (orderCount > 0) message += `${orderCount} item(s) ordered.`;

            const toast = document.createElement('div');
            toast.className = 'cart-toast';
            toast.innerHTML = message;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
                navigate('/products');
            }, 3000);

        } catch (error) {
            console.error("Checkout error:", error);
            setCheckoutError(error.message);
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="cart-page empty-cart">
                <div className="empty-cart-content">
                    <span className="empty-icon">🛒</span>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added any items yet.</p>
                    <button className="primary-btn" onClick={() => navigate('/products')}>
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-header">
                <h1>Your <span className="gradient-text">Shopping Cart</span></h1>
            </div>

            <div className="cart-container">
                <div className="cart-items">
                    {cart.map(item => (
                        <div key={item._id} className="cart-item">
                            <div className="item-image">
                                <img
                                    src={item.image || `https://via.placeholder.com/150/1E293B/3B82F6?text=${item.name}`}
                                    alt={item.name}
                                />
                            </div>
                            <div className="item-details">
                                <h3>{item.name}</h3>
                                <p className="item-price">৳{item.retailPrice.toLocaleString()}</p>
                            </div>

                            <div className="quantity-controls">
                                <button
                                    onClick={() => updateQuantity(item._id, item.cartQuantity - 1)}
                                    disabled={item.cartQuantity <= 1}
                                >
                                    −
                                </button>
                                <span>{item.cartQuantity}</span>
                                <button
                                    onClick={() => updateQuantity(item._id, item.cartQuantity + 1)}
                                    disabled={item.cartQuantity >= item.stock}
                                >
                                    +
                                </button>
                            </div>

                            <div className="item-total">
                                ৳{(item.retailPrice * item.cartQuantity).toLocaleString()}
                            </div>

                            <button
                                className="remove-btn"
                                onClick={() => removeFromCart(item._id)}
                                title="Remove item"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <h2>Order Summary</h2>

                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>৳{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="summary-row">
                        <span>VAT (15%)</span>
                        <span>৳{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div className="summary-divider"></div>

                    <div className="summary-row grand-total">
                        <span>Total</span>
                        <span className="gradient-text">৳{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>

                    {checkoutError && (
                        <div className="checkout-error">
                            {checkoutError}
                        </div>
                    )}

                    <button
                        className="checkout-btn"
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                    >
                        {isCheckingOut ? (
                            <span className="loading-text">Processing...</span>
                        ) : (
                            'Proceed to Checkout'
                        )}
                    </button>

                    <button
                        className="continue-shopping-btn"
                        onClick={() => navigate('/products')}
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Cart;
