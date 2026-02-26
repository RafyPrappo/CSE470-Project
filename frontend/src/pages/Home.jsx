import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

function Home() {
  const statsRef = useRef(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
          }
        });
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section with Particle Effect */}
      <section className="hero-section">
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="glowing-dot" />
            Next-Gen Inventory Management
          </div>
          
          <h1 className="hero-title">
            Welcome to{' '}
            <span className="gradient-text">
              Tech‑Aesthetics
            </span>
          </h1>
          
          <p className="hero-description">
            A sleek inventory management system that blends technology with design.
            Track products, manage stock, and prepare for profit insights — all in one modern dashboard.
          </p>

          <div className="hero-cta">
            <Link to="/products" className="cta-primary">
              <span>Explore Products</span>
              <span className="cta-icon">→</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" className="cta-secondary">
                <span>Admin Dashboard</span>
                <span className="cta-icon">⚡</span>
              </Link>
            )}
          </div>

          <div className="hero-stats" ref={statsRef}>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Happy Clients</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Support</span>
            </div>
          </div>
        </div>

        <div className="hero-scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            Why Choose{' '}
            <span className="gradient-text">TechAesthetics</span>
          </h2>
          <p className="section-subtitle">
            Experience the perfect blend of technology and aesthetics in inventory management
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Product Management</h3>
            <p>Keep track of all items with clean listings and real-time stock updates.</p>
            <div className="feature-hover-effect" />
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics Ready</h3>
            <p>Prepare for profit tracking and sales insights with detailed analytics.</p>
            <div className="feature-hover-effect" />
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔑</div>
            <h3>Admin Control</h3>
            <p>Securely add, edit, and manage your inventory with powerful tools.</p>
            <div className="feature-hover-effect" />
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Fast Delivery</h3>
            <p>Track orders from China to Bangladesh with real-time updates.</p>
            <div className="feature-hover-effect" />
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Profit Calculator</h3>
            <p>Automatically calculate margins from import to retail price.</p>
            <div className="feature-hover-effect" />
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Premium Design</h3>
            <p>Experience a beautiful, intuitive interface that's a pleasure to use.</p>
            <div className="feature-hover-effect" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to transform your inventory?</h2>
          <p>Join TechAesthetics today and experience the future of inventory management</p>
          <Link to="/products" className="cta-button">
            Get Started Now
            <span className="button-glow" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;