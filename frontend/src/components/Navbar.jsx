import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, memo } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

const Navbar = memo(() => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { getCartItemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  // Navigation links - Admin only sees admin panel
  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/categories", label: "Categories" },
    { path: "/products", label: "All Products" },
    ...(isAuthenticated && !isAdmin ? [
        { path: "/my-orders", label: "My Orders" },
        { path: "/my-preorders", label: "My Pre-Orders" }
    ] : []),
    ...(isAdmin ? [{ path: "/admin", label: "Admin Dashboard" }] : []),
  ];

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Brand Logo - Keeping the emoji here as it's part of the brand identity */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">
            Tech<span className="brand-highlight">Aesthetics</span>
          </span>
        </Link>

        {/* Desktop Navigation Links - No emojis */}
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
            >
              <span>{link.label}</span>
              {location.pathname === link.path && <span className="active-indicator" />}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/cart"
              className={`nav-link cart-link ${location.pathname === '/cart' ? "active" : ""}`}
            >
              <span>Cart</span>
              {getCartItemCount() > 0 && (
                <span className="cart-badge">{getCartItemCount()}</span>
              )}
              {location.pathname === '/cart' && <span className="active-indicator" />}
            </Link>
          )}
        </div>

        {/* User Menu / Auth Links - No emojis */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <div className="user-profile">
                <span className="user-greeting">{user?.name?.split(' ')[0] || 'User'}</span>
                {isAdmin && (
                  <span className="admin-badge">Admin</span>
                )}
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-link login-link">
                Log In
              </Link>
              <Link to="/register" className="auth-link register-link">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="hamburger-icon">{mobileMenuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile Navigation Menu - No emojis */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-nav-link ${location.pathname === link.path ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Mobile Auth Links - No emojis */}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          ) : (
            <button onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }} className="mobile-nav-link logout-mobile">
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
});

export default Navbar;