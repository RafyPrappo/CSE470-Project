import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

function Cart() {
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
    const { token } = useAuth();
    const navigate = useNavigate();
    
    // Enhanced State
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);
    const [isCartChecking, setIsCartChecking] = useState(true);
    
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoStatus, setPromoStatus] = useState(null);
    
    const [removedItem, setRemovedItem] = useState(null);
    const undoTimeoutRef = useRef(null);

    // Feature 15: Address Management State
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        street: '',
        city: '',
        postalCode: '',
        phone: ''
    });

    // 1. Real-time Cart Validation & Fetch Addresses
    useEffect(() => {
        const initCartPage = async () => {
            if (cart.length === 0) {
                setIsCartChecking(false);
                return;
            }
            
            // Validate Stock
            let adjusted = false;
            try {
                const stockPromises = cart.map(item => fetch(`http://localhost:5000/api/products/${item._id}`).then(res => res.json()));
                const results = await Promise.all(stockPromises);
                
                results.forEach(currentProduct => {
                    if (currentProduct.error) return; 
                    const cartItem = cart.find(c => c._id === currentProduct._id);
                    if (!cartItem) return;

                    if (!cartItem.isPreOrder && currentProduct.stock <= 0) {
                        removeFromCart(cartItem._id);
                        adjusted = true;
                    } 
                    else if (!cartItem.isPreOrder && cartItem.cartQuantity > currentProduct.stock) {
                        updateQuantity(cartItem._id, currentProduct.stock);
                        adjusted = true;
                    }
                });
                
                if (adjusted) {
                    showLocalToast(`⚠️ Your cart was adjusted due to stock changes.`, 'error');
                }
            } catch (err) {
                console.error("Stock check failed:", err);
            }

            // Fetch Addresses
            if (token) {
                try {
                    const addrRes = await fetch("http://localhost:5000/api/users/addresses", {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (addrRes.ok) {
                        const addrData = await addrRes.json();
                        setAddresses(addrData);
                        const defaultAddr = addrData.find(a => a.isDefault) || addrData[0];
                        if (defaultAddr) setSelectedAddressId(defaultAddr._id);
                    }
                } catch (err) {
                    console.error("Failed to fetch addresses:", err);
                }
            }

            setIsCartChecking(false);
        };
        
        initCartPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const showLocalToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `cart-toast ${type}`;
        if (type === 'error') {
            toast.style.background = 'rgba(239, 68, 68, 0.9)';
            toast.style.border = '1px solid #f87171';
        }
        toast.innerHTML = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    };

    // 2. Interactive Undo
    const handleRemoveItem = (item) => {
        removeFromCart(item._id);
        setRemovedItem(item);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = setTimeout(() => setRemovedItem(null), 5000);
    };

    const handleUndoRemove = () => {
        if (removedItem) {
            addToCart(removedItem, removedItem.cartQuantity);
            setRemovedItem(null);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        }
    };

    // Feature 15: Address Handlers
    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:5000/api/users/addresses", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(newAddress)
            });
            if (res.ok) {
                const updatedAddrs = await res.json();
                setAddresses(updatedAddrs);
                setShowAddressForm(false);
                setNewAddress({ label: 'Home', street: '', city: '', postalCode: '', phone: '' });
                const added = updatedAddrs[updatedAddrs.length - 1];
                setSelectedAddressId(added._id);
                showLocalToast("✅ Address added successfully!");
            }
        } catch {
            showLocalToast("Failed to add address", "error");
        }
    };

    // Calculations
    const subtotal = getCartTotal();
    const vatRate = 0.15;
    const vatAmount = subtotal * vatRate;
    const freeShippingThreshold = 15000;
    const discountThreshold = 20000;
    
    let shippingFee = subtotal > 0 ? (subtotal >= freeShippingThreshold ? 0 : 100) : 0;
    let discountRate = subtotal >= discountThreshold ? 0.10 : 0;
    let customDiscount = 0;

    if (appliedPromo === 'TECH10') discountRate = 0.10;
    else if (appliedPromo === 'FREESHIP') shippingFee = 0;
    else if (appliedPromo === 'WELCOME500') customDiscount = 500;

    const discountAmount = (subtotal * discountRate) + customDiscount;
    const grandTotal = Math.max(0, subtotal + vatAmount + shippingFee - discountAmount);

    const applyPromo = () => {
        if(!promoCode.trim()) return;
        const code = promoCode.trim().toUpperCase();
        if (['TECH10', 'FREESHIP', 'WELCOME500'].includes(code)) {
            setAppliedPromo(code);
            setPromoStatus('success');
            setTimeout(() => setPromoStatus(null), 3000);
        } else {
            setAppliedPromo(null);
            setPromoStatus('error');
            setTimeout(() => setPromoStatus(null), 3000);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!selectedAddressId) {
            setCheckoutError("Please select a shipping address first.");
            return;
        }

        setIsCheckingOut(true);
        setCheckoutError(null);

        const selectedAddr = addresses.find(a => a._id === selectedAddressId);
        const regularItems = cart.filter(item => item.stock > 0 && !item.isPreOrder);
        const preOrderItems = cart.filter(item => item.stock === 0 || item.isPreOrder);

        try {
            // Feature 11-14: Standard Order for regular items
            if (regularItems.length > 0) {
                const orderRes = await fetch(`http://localhost:5000/api/orders`, {
                    method: 'POST',
                    headers: { 
                        "Content-Type": "application/json", 
                        "Authorization": `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        items: regularItems.map(item => ({
                            product: item._id,
                            name: item.name,
                            quantity: item.cartQuantity,
                            price: item.retailPrice
                        })),
                        totalAmount: grandTotal, // simplified total allocation
                        shippingAddress: selectedAddr
                    }),
                });
                if (!orderRes.ok) {
                    const err = await orderRes.json();
                    throw new Error(err.error || "Failed to process standard order");
                }
            }

            // Pre-orders (existing logic)
            for (const item of preOrderItems) {
                const preRes = await fetch(`http://localhost:5000/api/preorders`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ productId: item._id, quantity: item.cartQuantity }),
                });
                if (!preRes.ok) throw new Error(`Failed to pre-order ${item.name}`);
            }

            clearCart();
            showLocalToast('✅ Checkout completed! Redirecting to orders...', 'success');
            setTimeout(() => navigate('/my-preorders'), 3000); // Should ideally go to a unified order page

        } catch (error) {
            setCheckoutError(error.message);
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (isCartChecking) return <div className="cart-page loading-state"><div className="spinner"></div><p>Syncing your cart...</p></div>;

    if (cart.length === 0) {
        return (
            <div className="cart-page empty-cart">
                <div className="empty-cart-content">
                    <span className="empty-icon">🛒</span>
                    <h2>Your cart is empty</h2>
                    <button className="primary-btn" onClick={() => navigate('/products')}>Start Shopping</button>
                    {removedItem && (
                        <div className="undo-toast active">
                            <span>Removed {removedItem.name}</span>
                            <button onClick={handleUndoRemove} className="undo-btn">Undo</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page position-relative">
            {isCheckingOut && (
                <div className="checkout-guard-overlay">
                    <div className="checkout-spinner-container">
                        <div className="premium-spinner"></div>
                        <h3>Processing Transaction...</h3>
                        <p>Securing your items. Please wait.</p>
                    </div>
                </div>
            )}

            <div className={`cart-header ${isCheckingOut ? 'blurred' : ''}`}>
                <h1>Your <span className="gradient-text">Shopping Cart</span></h1>
            </div>

            <div className={`cart-container ${isCheckingOut ? 'blurred' : ''}`}>
                <div className="cart-items-wrapper">
                    <div className="cart-items">
                        {cart.map(item => (
                            <div key={item._id} className="cart-item">
                                <div className="item-image"><img src={item.image || `https://via.placeholder.com/150/1E293B/3B82F6?text=${item.name}`} alt={item.name} /></div>
                                <div className="item-details">
                                    <h3>{item.name}</h3>
                                    <p className="item-price">৳{item.retailPrice.toLocaleString()}</p>
                                    {item.stock === 0 && <span className="pre-order-tag">Pre-Order Item</span>}
                                </div>
                                <div className="quantity-controls">
                                    <button onClick={() => updateQuantity(item._id, item.cartQuantity - 1)} disabled={item.cartQuantity <= 1}>−</button>
                                    <span>{item.cartQuantity}</span>
                                    <button onClick={() => updateQuantity(item._id, item.cartQuantity + 1)} disabled={item.cartQuantity >= item.stock && !item.isPreOrder}>+</button>
                                </div>
                                <div className="item-total">৳{(item.retailPrice * item.cartQuantity).toLocaleString()}</div>
                                <button className="remove-btn" onClick={() => handleRemoveItem(item)}>🗑️</button>
                            </div>
                        ))}
                    </div>

                    {/* Address Selection - Feature 15 */}
                    <div className="address-section">
                        <div className="section-header">
                            <h3>Shipping Address</h3>
                            <button className="text-btn" onClick={() => setShowAddressForm(!showAddressForm)}>
                                {showAddressForm ? "Cancel" : "+ Add New"}
                            </button>
                        </div>

                        {showAddressForm ? (
                            <form onSubmit={handleAddAddress} className="address-form glass-card">
                                <div className="form-grid">
                                    <input placeholder="Label (e.g. Home)" value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} required />
                                    <input placeholder="Phone Number" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} required />
                                    <input placeholder="Street Address" className="full-width" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} required />
                                    <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required />
                                    <input placeholder="Postal Code" value={newAddress.postalCode} onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})} required />
                                </div>
                                <button type="submit" className="save-addr-btn">Save Address</button>
                            </form>
                        ) : (
                            <div className="address-list">
                                {addresses.length === 0 ? (
                                    <p className="hint-text">No saved addresses. Please add one to checkout.</p>
                                ) : (
                                  <>
                                    <div className="address-section-header">
                                      <h3>📍 Select Delivery Path</h3>
                                      <button className="add-address-pill" onClick={() => setShowAddressForm(true)}>+ New Location</button>
                                    </div>
                
                                    <div className="address-chip-grid">
                                      {addresses.map(addr => (
                                        <div 
                                          key={addr._id} 
                                          className={`address-chip ${selectedAddressId === addr._id ? 'active' : ''}`}
                                          onClick={() => setSelectedAddressId(addr._id)}
                                        >
                                          <div className="chip-icon">
                                            {addr.label.toLowerCase().includes('home') ? '🏠' : 
                                             addr.label.toLowerCase().includes('work') ? '🏢' : '📍'}
                                          </div>
                                          <div className="chip-info">
                                            <span className="chip-label">{addr.label}</span>
                                            <span className="chip-street">{addr.street.substring(0, 20)}...</span>
                                          </div>
                                          {selectedAddressId === addr._id && <div className="chip-check">✓</div>}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={`undo-toast ${removedItem ? 'active' : ''}`}>
                        {removedItem && <><span>Removed {removedItem.name}</span><button onClick={handleUndoRemove} className="undo-btn">Undo</button></>}
                    </div>
                </div>

                <div className="cart-summary">
                    <h2>Order Summary</h2>
                    <div className="cart-progress-container">
                        <div className="progress-item">
                            <div className="progress-header"><span>Free Shipping</span><span className={shippingFee === 0 ? 'unlocked' : ''}>{shippingFee === 0 ? '✨ Unlocked' : `৳${(freeShippingThreshold - subtotal).toLocaleString()} away`}</span></div>
                            <div className="progress-track"><div className="progress-fill shipping" style={{width: `${shippingFee === 0 ? 100 : Math.min(100, (subtotal/freeShippingThreshold)*100)}%`}}></div></div>
                        </div>
                        <div className="progress-item">
                            <div className="progress-header"><span>10% Discount</span><span className={discountRate > 0 ? 'unlocked' : ''}>{discountRate > 0 ? '✨ Unlocked' : `৳${(discountThreshold - subtotal).toLocaleString()} away`}</span></div>
                            <div className="progress-track"><div className="progress-fill discount" style={{width: `${discountRate > 0 ? 100 : Math.min(100, (subtotal/discountThreshold)*100)}%`}}></div></div>
                        </div>
                    </div>

                    <div className="promo-code-container">
                        <label>Promo Code</label>
                        <div className="promo-input-group">
                            <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="E.g. TECH10" className={`promo-input ${promoStatus === 'error' ? 'shake-animation' : ''}`} />
                            <button onClick={applyPromo} className={`promo-btn ${promoStatus === 'success' ? 'success' : ''}`}>{promoStatus === 'success' ? '✓' : 'Apply'}</button>
                        </div>
                        {appliedPromo && <small className="promo-applied-text">Code {appliedPromo} applied!</small>}
                    </div>

                    <div className="summary-divider"></div>
                    <div className="summary-row"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                    <div className="summary-row"><span>VAT (15%)</span><span>৳{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                    <div className="summary-row"><span>Shipping Fee</span><span>{shippingFee === 0 ? <span style={{color: '#10B981'}}>Free</span> : `৳${shippingFee.toLocaleString()}`}</span></div>
                    {discountAmount > 0 && <div className="summary-row" style={{ color: '#10B981', fontWeight: 600 }}><span>Discount</span><span>-৳{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
                    <div className="summary-divider"></div>
                    <div className="summary-row grand-total"><span>Total</span><span className="gradient-text">৳{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                    
                    {checkoutError && <div className="checkout-error">{checkoutError}</div>}
                    <button className="checkout-btn" onClick={handleCheckout} disabled={isCheckingOut}>Proceed to Checkout</button>
                    <button className="continue-shopping-btn" onClick={() => navigate('/products')} disabled={isCheckingOut}>Continue Shopping</button>
                    {!selectedAddressId && <p className="hint-text center" style={{marginTop: '0.5rem'}}>Select an address to enable checkout</p>}
                </div>
            </div>
        </div>
    );
}

export default Cart;
