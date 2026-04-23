import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Search, Tag, Package, Lock, AlertTriangle } from "lucide-react";
import ProductCard from "../components/ProductCard";
import "./Products.css"; // We'll reuse the Products styling for the grid

function CategoryPage() {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortOption, setSortOption] = useState("default");
    const [error, setError] = useState(null);

    // Login prompt states
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [promptProduct, setPromptProduct] = useState(null);
    const [userPreOrders, setUserPreOrders] = useState({});

    const navigate = useNavigate();
    const { isAuthenticated, user, token } = useAuth();
    const { addToCart } = useCart();

    useEffect(() => {
        fetchCategoryInfo();
        fetchProductsByCategory();

        if (isAuthenticated) {
            fetchUserPreOrders();
        }
    }, [categoryName, isAuthenticated, token]);

    const fetchCategoryInfo = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/categories/${encodeURIComponent(categoryName)}`);
            if (res.ok) {
                setCategoryInfo(await res.json());
            }
        } catch (err) {
            console.error("Error fetching category info:", err);
        }
    };

    const fetchProductsByCategory = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:5000/api/products/");
            if (!res.ok) throw new Error('Failed to fetch products');

            const allProducts = await res.json();

            // Filter products locally to match the category name (case-insensitive)
            const filtered = allProducts.filter(p =>
                p.category && p.category.toLowerCase() === categoryName.toLowerCase()
            );

            setProducts(filtered);
            setError(null);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to load category products. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPreOrders = async () => {
        if (!isAuthenticated || !token) return;
        try {
            const res = await fetch("http://localhost:5000/api/preorders/my", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const preOrderMap = {};
                data.forEach(po => {
                    if (po.status === 'PENDING') {
                        preOrderMap[po.product._id] = po;
                    }
                });
                setUserPreOrders(preOrderMap);
            }
        } catch (err) {
            console.error("Failed to fetch pre-orders:", err);
        }
    };

    const handleAddToCart = async (product, quantity) => {
        if (!isAuthenticated) {
            setPromptProduct({ product, quantity });
            setShowLoginPrompt(true);
            return;
        }

        const isPreOrderRequest = product.isPreOrder || product.stock <= 0;

        if (!isPreOrderRequest && quantity > product.stock) {
            alert(`Sorry, only ${product.stock} units available`);
            return;
        }

        if (isPreOrderRequest) {
            if (userPreOrders[product._id]) {
                const existingPreOrder = userPreOrders[product._id];
                const newQuantity = existingPreOrder.quantity + quantity;

                try {
                    const response = await fetch(`http://localhost:5000/api/preorders/${existingPreOrder._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ quantity: newQuantity })
                    });

                    if (!response.ok) throw new Error('Failed to update pre-order');

                    const updatedData = await response.json();
                    setUserPreOrders(prev => ({ ...prev, [product._id]: updatedData }));

                    const toast = document.createElement('div');
                    toast.className = 'cart-toast';
                    toast.innerHTML = `✅ Updated pre-order to ${newQuantity} × ${product.name}!`;
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                    return;

                } catch (error) {
                    console.error("Failed to update pre-order:", error);
                    alert("Failed to update expected quantity.");
                    return;
                }
            }

            try {
                const response = await fetch(`http://localhost:5000/api/preorders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        productId: product._id,
                        quantity: quantity
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        setShowLoginPrompt(true);
                        return;
                    }
                    throw new Error(data.error || 'Failed to place pre-order');
                }

                setUserPreOrders(prev => ({ ...prev, [product._id]: data }));

                const toast = document.createElement('div');
                toast.className = 'cart-toast';
                toast.innerHTML = `✅ Successfully requested pre-order for ${quantity} × ${product.name}!`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
                return;

            } catch (error) {
                console.error("Failed to place pre-order:", error);
                alert(`Failed to place pre-order: ${error.message}`);
                throw error;
            }
        }

        try {
            addToCart(product, quantity);
            const toast = document.createElement('div');
            toast.className = 'cart-toast';
            toast.innerHTML = `✅ Added ${quantity} × ${product.name} to cart`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            console.error("Failed to add to cart:", error);
            alert(`Failed to add to cart: ${error.message}`);
            throw error;
        }
    };

    const handleNotifyMe = async (product) => {
        if (!isAuthenticated) {
            setPromptProduct({ product, quantity: 0 });
            setShowLoginPrompt(true);
            return;
        }
        alert(`🔔 We'll notify you when ${product.name} is back in stock!`);
    };

    const sortedProducts = [...products].sort((a, b) => {
        switch (sortOption) {
            case "price-asc": return a.retailPrice - b.retailPrice;
            case "price-desc": return b.retailPrice - a.retailPrice;
            case "name-asc": return a.name.localeCompare(b.name);
            case "name-desc": return b.name.localeCompare(a.name);
            default: return 0;
        }
    });

    const LoginPromptModal = () => (
        <div className="modal-overlay" onClick={() => setShowLoginPrompt(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-icon"><Lock size={48} /></div>
                <h3>Login Required</h3>
                <p>Please login or create an account to {promptProduct?.quantity > 0 ? 'add items to cart' : 'get notified'}</p>
                <div className="modal-actions">
                    <button className="modal-btn secondary" onClick={() => setShowLoginPrompt(false)}>Cancel</button>
                    <button className="modal-btn primary" onClick={() => navigate("/login")}>Login</button>
                    <button className="modal-btn accent" onClick={() => navigate("/register")}>Sign Up</button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="products-loading">
                <div className="loading-spinner"></div>
                <p>Loading {categoryName}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="products-error">
                <div className="error-icon"><AlertTriangle size={64} /></div>
                <h3>Oops!</h3>
                <p>{error}</p>
                <button className="btn-primary" onClick={() => navigate('/products')}>Back to All Products</button>
            </div>
        );
    }

    return (
        <div className="products-page">
            {showLoginPrompt && <LoginPromptModal />}

            <div className="products-header" style={{
                backgroundImage: categoryInfo && categoryInfo.image ? `url(${categoryInfo.image})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '6rem 2rem',
                position: 'relative',
                borderRadius: '1rem',
                margin: '2rem 5% 3rem'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    borderRadius: '1rem',
                    zIndex: 0
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <button
                        onClick={() => navigate('/products')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem'
                        }}
                    >
                        ← Back to All Categories
                    </button>
                    <h1 className="products-title" style={{ textTransform: 'capitalize', fontSize: '3.5rem' }}>
                        {categoryInfo ? categoryInfo.name : categoryName}
                    </h1>
                    <p className="products-subtitle" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        {categoryInfo && categoryInfo.description ? categoryInfo.description : `Browse our collection of ${categoryName}`}
                    </p>
                </div>
            </div>

            <div className="products-container" style={{ paddingTop: 0 }}>
                <div className="filters-bar" style={{ marginBottom: '2rem' }}>
                    <div className="search-box" style={{ visibility: 'hidden' }}>
                        {/* Holding space for flexbox alignment */}
                        <span className="search-icon"><Search size={18} /></span>
                        <input type="text" placeholder="Search..." />
                    </div>

                    <div className="sort-box">
                        <span className="sort-label">Sort by:</span>
                        <select
                            className="sort-select"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="default">Default</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name-asc">Name: A to Z</option>
                            <option value="name-desc">Name: Z to A</option>
                        </select>
                    </div>
                </div>

                {sortedProducts.length === 0 ? (
                    <div className="no-products">
                        <div className="no-products-icon"><Package size={64} /></div>
                        <h3>No Products Found</h3>
                        <p>We don't have any items in the {categoryName} category yet.</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {sortedProducts.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                onAddToCart={handleAddToCart}
                                onNotify={handleNotifyMe}
                                isLoggedIn={isAuthenticated}
                                existingPreOrder={userPreOrders[product._id]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CategoryPage;
