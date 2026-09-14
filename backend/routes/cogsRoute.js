import express from "express";
import {
  getCOGSOverview,
  acceptProposedPrice,
  rejectProposedPrice,
  getPendingProposals,
} from "../controllers/cogsController.js";
import { authAdmin } from "../middleware/auth.js";

const cogsRouter = express.Router();

// Admin-protected COGS & Manufacturer Pricing Agreement routes
cogsRouter.get("/overview", authAdmin, getCOGSOverview);
cogsRouter.get("/margins", authAdmin, getCOGSOverview);
cogsRouter.get("/pending-proposals", authAdmin, getPendingProposals);
cogsRouter.post("/accept-price", authAdmin, acceptProposedPrice);
cogsRouter.post("/reject-price", authAdmin, rejectProposedPrice);

export default cogsRouter;
