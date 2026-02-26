import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from 'node:dns/promises';
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// FORCE DNS SERVERS - ADD THIS RIGHT AFTER IMPORTS
try {
  dns.setServers(["1.1.1.1", "8.8.8.8", "8.8.4.4"]);
  console.log("✅ DNS servers set to Cloudflare and Google");
} catch (err) {
  console.error("❌ Failed to set DNS servers:", err.message);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with better options
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4 // Still keep IPv4 force as backup
    });
    console.log("✅ MongoDB Connected Successfully!");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("⚠️  Please check:");
    console.log("   1. Your IP is whitelisted in MongoDB Atlas");
    console.log("   2. Your username and password are correct");
    console.log("   3. Your network isn't blocking MongoDB");
    process.exit(1);
  }
};

connectDB();

// Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Tech-Aesthetics API is running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});