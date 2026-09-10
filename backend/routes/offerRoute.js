import express from "express";
import {
  getActiveOffer,
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../controllers/offerController.js";
import adminAuth from "../middleware/adminAuth.js";

const offerRouter = express.Router();

// Public route to get currently active festive campaign
offerRouter.get("/active", getActiveOffer);

// Admin routes
offerRouter.get("/list", adminAuth, listOffers);
offerRouter.post("/create", adminAuth, createOffer);
offerRouter.post("/update", adminAuth, updateOffer);
offerRouter.post("/delete", adminAuth, deleteOffer);

export default offerRouter;
