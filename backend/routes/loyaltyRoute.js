import express from "express";
import {
  getAllLevels,
  createOrUpdateLevel,
  deleteLevel,
  getUserLoyaltyStatus,
  getCustomerLoyaltyByPhone,
  getHubCustomers,
  recordLoyaltyGift,
  getHubGifts,
} from "../controllers/loyaltyController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";
import authManufacturer from "../middleware/manufacturerAuth.js";

const loyaltyRouter = express.Router();

// ── Public / Frontend & Admin read ──────────────────────────────────────────
loyaltyRouter.get("/levels", getAllLevels);

// ── Customer loyalty status ──────────────────────────────────────────────────
loyaltyRouter.get("/my-status", authUser, getUserLoyaltyStatus);

// ── Admin level configuration ────────────────────────────────────────────────
loyaltyRouter.post("/level", adminAuth, createOrUpdateLevel);
loyaltyRouter.delete("/level/:id", adminAuth, deleteLevel);

// ── Manufacturer loyalty endpoints ───────────────────────────────────────────
// Look up customer loyalty status by phone number
loyaltyRouter.get("/customer-by-phone", authManufacturer, getCustomerLoyaltyByPhone);

// Get all hub customers (deduped from direct orders) with loyalty tiers
loyaltyRouter.get("/hub-customers", authManufacturer, getHubCustomers);

// Record a loyalty gift/perk physically given to a customer
loyaltyRouter.post("/hub-gift", authManufacturer, recordLoyaltyGift);

// Get all gift records for this manufacturer hub
loyaltyRouter.get("/hub-gifts", authManufacturer, getHubGifts);

export default loyaltyRouter;
