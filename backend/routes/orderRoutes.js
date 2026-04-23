import express from "express";
import { 
  createOrder, 
  getMyOrders, 
  getActiveOrders, 
  cancelOrder, 
  addCourierLog,
  updateOrderStatus 
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.get("/", protect, adminOnly, getActiveOrders);
router.delete("/:id", protect, cancelOrder);
router.post("/:id/courier", protect, adminOnly, addCourierLog);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;
