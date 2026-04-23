import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Products.css"; // Reuse general layout styles

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/categories");
            if (res.ok) {
                setCategories(await res.json());
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="products-loading">
                <div className="loading-spinner"></div>
                <p>Loading categories...</p>
            </div>
        );
    }

    return (
        <div className="products-page">
            <div className="products-header">
                <h1 className="products-title">
                    Shop by <span className="gradient-text">Category</span>
                </h1>
                <p className="products-subtitle">
                    Explore our curated collections of premium tech and lifestyle products
                </p>
            </div>

            <div className="products-container" style={{ paddingTop: '2rem' }}>
                {categories.length === 0 ? (
                    <div className="no-products">
                        <div className="no-products-icon">📁</div>
                        <h3>No Categories Found</h3>
                        <p>Our admins are currently setting up the collections. Check back soon!</p>
                    </div>
                ) : (
                    <div className="products-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '2rem'
                    }}>
                        {categories.map((cat) => (
                            <Link
                                key={cat._id}
                                to={`/category/${encodeURIComponent(cat.name.toLowerCase())}`}
                                style={{ textDecoration: 'none' }}
                                className="product-card"
                            >
                                <div className="card-image-container" style={{ display: 'block', height: '200px' }}>
                                    <img
                                        src={cat.image || `https://via.placeholder.com/300x200/1E293B/3B82F6?text=${cat.name}`}
                                        alt={cat.name}
                                        className="card-image"
                                        style={{ height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="card-content" style={{ textAlign: 'center', padding: '1.5rem' }}>
                                    <h3 className="product-name" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #fff, #94a3b8)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {cat.name}
                                    </h3>
                                    {cat.description && (
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                            {cat.description}
                                        </p>
                                    )}
                                    <div style={{ marginTop: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>
                                        Explore Category →
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Categories;
