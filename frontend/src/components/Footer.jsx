import { Link } from "react-router-dom";
import { memo } from "react";
import { Zap, MapPin, Phone, Mail, Clock } from "lucide-react";
import "./Footer.css";

const Footer = memo(() => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      {/* Modern gradient separator */}
      <div className="footer-gradient"></div>
      <div className="footer-glow"></div>
      <div className="footer-divider"></div>
      
      <div className="footer-content">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-section brand-section">
            <div className="footer-brand">
              <span className="brand-icon"><Zap size={24} /></span>
              <span className="brand-text">TechAesthetics</span>
            </div>
            <p className="brand-description">
              Premium gadget and minimalist decor inventory management system. 
              Bridging the gap between Chinese imports and Bangladeshi customers with style.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">📘</a>
              <a href="#" className="social-link" aria-label="Instagram">📷</a>
              <a href="#" className="social-link" aria-label="Twitter">🐦</a>
              <a href="#" className="social-link" aria-label="LinkedIn">💼</a>
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
              <li><a href="#">Phone Cases</a></li>
              <li><a href="#">Accessories</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Connect With Us</h3>
            <ul className="contact-info">
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> Dhaka, Bangladesh</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={16} /> +880 1234-567890</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={16} /> hello@techaesthetics.com</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> Mon-Fri: 9AM - 6PM</li>
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
});

export default Footer;