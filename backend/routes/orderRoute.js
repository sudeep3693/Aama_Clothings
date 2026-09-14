import express from "express";
import {
  placeOrder,
  allOrders,
  allAdminOrders,
  userOrders,
  updateStatus,
  cashReceived,
  adminCreateOrder,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// Admin Features
// /list → all orders (read-only, hub monitor view)
orderRouter.post("/list", adminAuth, allOrders);
// /admin-list → only admin-created orders (operational management tab)
orderRouter.post("/admin-list", adminAuth, allAdminOrders);
orderRouter.post("/status", adminAuth, updateStatus);
orderRouter.post("/cash-received", adminAuth, cashReceived);
orderRouter.post("/admin-create", adminAuth, adminCreateOrder);

// Payment Features
orderRouter.post("/place", authUser, placeOrder);

// User Features
orderRouter.post("/userorders", authUser, userOrders);

export default orderRouter;
