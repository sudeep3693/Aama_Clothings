import express from "express";
import {
  loginDeliveryPartner,
  getProfile,
  updateAvailability,
  registerDeliveryPartner,
  listDeliveryPartners,
  updateDeliveryPartner,
  getPartnerStats,
} from "../controllers/deliveryPartnerController.js";
import authDelivery from "../middleware/deliveryAuth.js";
import { authAdmin } from "../middleware/auth.js";

const deliveryPartnerRouter = express.Router();

// Public
deliveryPartnerRouter.post("/login", loginDeliveryPartner);

// Delivery partner-authenticated
deliveryPartnerRouter.get("/profile", authDelivery, getProfile);
deliveryPartnerRouter.post("/profile", authDelivery, getProfile);
deliveryPartnerRouter.put("/availability", authDelivery, updateAvailability);
deliveryPartnerRouter.post("/availability", authDelivery, updateAvailability);
deliveryPartnerRouter.get("/stats", authDelivery, getPartnerStats);

// Admin-only (support both direct and /admin/ prefixed paths)
deliveryPartnerRouter.get("/list", authAdmin, listDeliveryPartners);
deliveryPartnerRouter.get("/admin/list", authAdmin, listDeliveryPartners);

deliveryPartnerRouter.post("/register", authAdmin, registerDeliveryPartner);
deliveryPartnerRouter.post("/admin/register", authAdmin, registerDeliveryPartner);

deliveryPartnerRouter.post("/update", authAdmin, updateDeliveryPartner);
deliveryPartnerRouter.post("/admin/update", authAdmin, updateDeliveryPartner);
deliveryPartnerRouter.put("/admin/update/:id", authAdmin, updateDeliveryPartner);
deliveryPartnerRouter.put("/update/:id", authAdmin, updateDeliveryPartner);

export default deliveryPartnerRouter;
