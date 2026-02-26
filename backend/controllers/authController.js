import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "30d"
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Check if this is the first user (will become admin)
    const isFirstUser = await User.isFirstUser();
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: isFirstUser ? "admin" : "user", // First user becomes admin
      isFirstUser: isFirstUser
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
      message: isFirstUser ? "🎉 First user! You are now the Admin." : "Registration successful!"
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide email and password" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// @desc    Promote user to admin (admin only)
// @route   PUT /api/auth/promote/:id
export const promoteToAdmin = async (req, res) => {
  try {
    // Check if requester is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized. Admin only." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ error: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    res.json({
      message: `✅ ${user.name} is now an admin`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Promotion error:", error);
    res.status(500).json({ error: "Failed to promote user" });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized. Admin only." });
    }

    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};