import express from "express";
import {
  createDirectOrder,
  getMyDirectOrders,
  updateDirectOrderStatus,
} from "../controllers/manufacturerDirectOrderController.js";
import manufacturerAuth from "../middleware/manufacturerAuth.js";

const manufacturerDirectOrderRouter = express.Router();

manufacturerDirectOrderRouter.post("/create", manufacturerAuth, createDirectOrder);
manufacturerDirectOrderRouter.get("/my-orders", manufacturerAuth, getMyDirectOrders);
manufacturerDirectOrderRouter.post("/update-status", manufacturerAuth, updateDirectOrderStatus);

export default manufacturerDirectOrderRouter;
