import express from "express";
import { 
  registerUser, 
  loginUser, 
  promoteToAdmin, 
  getAllUsers 
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (require login)
router.get("/users", protect, adminOnly, getAllUsers);
router.put("/promote/:id", protect, adminOnly, promoteToAdmin);

export default router;