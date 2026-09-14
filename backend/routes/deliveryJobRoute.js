import express from "express";
import multer from "multer";
import {
  markReadyForPickup,
  getMyJobs,
  acceptJob,
  updateJobStatus,
  markDelivered,
  failDelivery,
  getAllJobs,
} from "../controllers/deliveryJobController.js";
import authDelivery from "../middleware/deliveryAuth.js";
import authManufacturer from "../middleware/manufacturerAuth.js";
import { authAdmin } from "../middleware/auth.js";

const deliveryJobRouter = express.Router();
const upload = multer({ dest: "uploads/" });

// Manufacturer triggers
deliveryJobRouter.post("/ready-for-pickup/:assignmentId", authManufacturer, markReadyForPickup);
deliveryJobRouter.post("/ready-for-pickup", authManufacturer, markReadyForPickup);

// Delivery partner routes
deliveryJobRouter.get("/my", authDelivery, getMyJobs);
deliveryJobRouter.post("/my", authDelivery, getMyJobs);

deliveryJobRouter.post("/accept/:jobId", authDelivery, acceptJob);
deliveryJobRouter.post("/accept", authDelivery, acceptJob);

deliveryJobRouter.put("/status/:jobId", authDelivery, updateJobStatus);
deliveryJobRouter.post("/status/:jobId", authDelivery, updateJobStatus);
deliveryJobRouter.post("/status", authDelivery, updateJobStatus);

deliveryJobRouter.post("/deliver/:jobId", authDelivery, upload.single("image"), markDelivered);
deliveryJobRouter.post("/delivered", authDelivery, upload.single("proof"), markDelivered);

deliveryJobRouter.post("/fail/:jobId", authDelivery, failDelivery);
deliveryJobRouter.post("/failed", authDelivery, failDelivery);

// Admin routes
deliveryJobRouter.get("/all", authAdmin, getAllJobs);
deliveryJobRouter.get("/admin/all", authAdmin, getAllJobs);

export default deliveryJobRouter;
