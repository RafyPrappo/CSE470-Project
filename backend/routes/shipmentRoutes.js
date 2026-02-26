import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    createShipment,
    getAllShipments,
    updateShipment
} from "../controllers/shipmentController.js";

const router = express.Router();

// All shipment routes are Admin only in this design
router.post("/", protect, adminOnly, createShipment);
router.get("/", protect, adminOnly, getAllShipments);
router.put("/:id", protect, adminOnly, updateShipment);

export default router;
