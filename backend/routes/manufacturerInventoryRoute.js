import express from "express";
import {
  getMyInventory,
  updateStock,
  getAllInventory,
  getLowStockAlerts,
} from "../controllers/manufacturerInventoryController.js";
import authManufacturer from "../middleware/manufacturerAuth.js";
import { authAdmin } from "../middleware/auth.js";

const manufacturerInventoryRouter = express.Router();

// Manufacturer-authenticated
manufacturerInventoryRouter.get("/my", authManufacturer, getMyInventory);
manufacturerInventoryRouter.post("/my", authManufacturer, getMyInventory);
manufacturerInventoryRouter.post("/update", authManufacturer, updateStock);

// Admin-only (supports both /all and /admin/all)
manufacturerInventoryRouter.get("/all", authAdmin, getAllInventory);
manufacturerInventoryRouter.get("/admin/all", authAdmin, getAllInventory);
manufacturerInventoryRouter.get("/low-stock", authAdmin, getLowStockAlerts);
manufacturerInventoryRouter.get("/admin/low-stock", authAdmin, getLowStockAlerts);

export default manufacturerInventoryRouter;
