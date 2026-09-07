import express from "express";
import {
  getShippingConfig,
  updateShippingConfig,
} from "../controllers/shippingController.js";
import adminAuth from "../middleware/adminAuth.js";

const shippingRouter = express.Router();

shippingRouter.get("/config", getShippingConfig);
shippingRouter.post("/update", adminAuth, updateShippingConfig);

export default shippingRouter;
