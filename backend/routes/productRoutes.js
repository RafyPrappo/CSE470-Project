import express from "express";
import { 
  addProduct, 
  getProducts, 
  getProductById,
  orderProduct, 
  updateProductStock,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts 
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (no login required)
router.get("/", getProducts);
router.get("/low-stock", getLowStockProducts);
router.get("/out-of-stock", getOutOfStockProducts);
router.get("/:id", getProductById);

// Protected routes (login required)
router.put("/:id/order", protect, orderProduct);

// Admin only routes
router.post("/add", protect, adminOnly, addProduct);
router.put("/:id/stock", protect, adminOnly, updateProductStock);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;