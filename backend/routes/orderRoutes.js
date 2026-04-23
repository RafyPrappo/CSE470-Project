import express from "express";
import { 
  createOrder, 
  getMyOrders, 
  getActiveOrders, 
  cancelOrder, 
  addCourierLog,
  updateOrderStatus,
  getTotalRevenue // 1. Don't forget to add this to your imports!
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);

// 2. ADD IT HERE (Before the general GET "/" and "/:id" routes)
router.get("/revenue", protect, adminOnly, getTotalRevenue);

router.get("/", protect, adminOnly, getActiveOrders);
router.delete("/:id", protect, cancelOrder);
router.post("/:id/courier", protect, adminOnly, addCourierLog);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;