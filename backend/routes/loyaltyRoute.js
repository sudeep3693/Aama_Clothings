import express from "express";
import {
  getAllLevels,
  createOrUpdateLevel,
  deleteLevel,
  getUserLoyaltyStatus,
} from "../controllers/loyaltyController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const loyaltyRouter = express.Router();

// Public / Frontend & Admin read
loyaltyRouter.get("/levels", getAllLevels);

// Customer loyalty status
loyaltyRouter.get("/my-status", authUser, getUserLoyaltyStatus);

// Admin level configuration
loyaltyRouter.post("/level", adminAuth, createOrUpdateLevel);
loyaltyRouter.delete("/level/:id", adminAuth, deleteLevel);

export default loyaltyRouter;
