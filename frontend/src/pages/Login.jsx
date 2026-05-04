import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle } from "lucide-react";
import "./Login.css";
// This is the ONLY place where the backend URL is written
const API_BASE = "https://techaesthetics.onrender.com";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_BASE + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        login({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role
        }, data.token);

        if (data.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/products");
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2 className="gradient-text">Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        {error && (
          <div className="error-message">
            <span style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={20} /></span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className={error ? "error" : ""}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className={error ? "error" : ""}
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="register-link-container">
          <span className="register-link-text">Don't have an account?</span>
          <div className="register-link-wrapper">
            <Link to="/register" className="register-link">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;