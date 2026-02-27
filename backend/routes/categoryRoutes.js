import express from "express";
import { getCategories, addCategory, deleteCategory, getCategoryByName } from "../controllers/categoryController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:name", getCategoryByName);

// Protected Admin routes
router.post("/add", protect, adminOnly, addCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
