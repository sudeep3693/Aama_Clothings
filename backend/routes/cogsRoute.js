import express from "express";
import {
  getCOGSOverview,
  saveMonthlyExpense,
  getMonthlyExpenses,
  saveInboundShipment,
  getInboundShipments,
  deleteInboundShipment,
  updateProductCostPrice,
} from "../controllers/cogsController.js";
import adminAuth from "../middleware/adminAuth.js";

const cogsRouter = express.Router();

cogsRouter.get("/overview", adminAuth, getCOGSOverview);
cogsRouter.get("/monthly-expenses", adminAuth, getMonthlyExpenses);
cogsRouter.post("/save-monthly-expense", adminAuth, saveMonthlyExpense);
cogsRouter.get("/shipments", adminAuth, getInboundShipments);
cogsRouter.post("/save-shipment", adminAuth, saveInboundShipment);
cogsRouter.post("/delete-shipment", adminAuth, deleteInboundShipment);
cogsRouter.post("/update-cost-price", adminAuth, updateProductCostPrice);

export default cogsRouter;
