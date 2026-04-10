import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    createPreOrder,
    getUserPreOrders,
    getAllPreOrders,
    updatePreOrderStatus,
    updatePreOrderQuantity,
    cancelPreOrder,
    deletePreOrder,
    addPreOrderCourierLog
} from "../controllers/preOrderController.js";

const router = express.Router();

// Customer routes
router.post("/", protect, createPreOrder);
router.get("/my", protect, getUserPreOrders);
router.put("/:id/quantity", protect, updatePreOrderQuantity);
router.delete("/:id", protect, cancelPreOrder); // marks cancelled
router.delete("/:id/remove", protect, deletePreOrder); // removes cancelled

// Admin routes
router.get("/", protect, adminOnly, getAllPreOrders);
router.put("/:id", protect, adminOnly, updatePreOrderStatus);
router.post("/:id/courier", protect, adminOnly, addPreOrderCourierLog);

export default router;
