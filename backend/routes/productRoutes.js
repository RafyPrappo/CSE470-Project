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

const router = express.Router();

// Product routes
router.post("/add", addProduct);
router.get("/", getProducts);
router.get("/low-stock", getLowStockProducts);
router.get("/out-of-stock", getOutOfStockProducts);
router.get("/:id", getProductById);
router.put("/:id/order", orderProduct);
router.put("/:id/stock", updateProductStock);
router.delete("/:id", deleteProduct);

export default router;