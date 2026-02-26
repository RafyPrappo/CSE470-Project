import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/techaesthetics")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));

// Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes); // Add this

// Test route
app.get("/", (req, res) => {
  res.send("Tech-Aesthetics API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});