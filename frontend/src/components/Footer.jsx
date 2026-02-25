import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0L48 8.8C96 17.6 192 35.2 288 44C384 52.8 480 52.8 576 44C672 35.2 768 17.6 864 8.8C960 0 1056 0 1152 8.8C1248 17.6 1344 35.2 1392 44L1440 52.8V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V0Z" 
            fill="url(#gradient)" 
            fillOpacity="0.2"
          />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1440" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-section brand-section">
            <div className="footer-brand">
              <span className="brand-icon">⚡</span>
              <span className="brand-text">TechAesthetics</span>
            </div>
            <p className="brand-description">
              Premium gadget and minimalist decor inventory management system. 
              Bridging the gap between Chinese imports and Bangladeshi customers with style.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">📱</a>
              <a href="#" className="social-link">💬</a>
              <a href="#" className="social-link">📧</a>
              <a href="#" className="social-link">📘</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/admin">Admin Panel</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-section">
            <h3 className="footer-title">Categories</h3>
            <ul className="footer-links">
              <li><a href="#">Gadgets</a></li>
              <li><a href="#">Minimalist Decor</a></li>
              <li><a href="#">iPhone Cases</a></li>
              <li><a href="#">Accessories</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Connect With Us</h3>
            <ul className="contact-info">
              <li>📍 Dhaka, Bangladesh</li>
              <li>📞 +880 1234-567890</li>
              <li>✉️ hello@techaesthetics.com</li>
              <li>🕒 Mon-Fri: 9AM - 6PM</li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="newsletter-section">
          <h3 className="newsletter-title">Stay Updated</h3>
          <p>Get notified about new arrivals and exclusive offers</p>
          <form className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="newsletter-input"
            />
            <button type="submit" className="newsletter-btn">
              Subscribe
            </button>
          </form>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>&copy; {currentYear} TechAesthetics. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Shipping Info</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;