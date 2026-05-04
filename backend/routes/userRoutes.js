import express from "express";
import { 
  addAddress, 
  getAddresses, 
  deleteAddress,
  getMembership,
  updateMembership,
  getAllMembershipStats
} from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.delete("/addresses/:id", protect, deleteAddress);

// Membership routes
router.get("/membership", protect, getMembership);
router.get("/members/all", protect, adminOnly, getAllMembershipStats);
router.put("/membership/:id", protect, adminOnly, updateMembership);

export default router;