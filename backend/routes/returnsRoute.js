import express from "express";
import {
  createCustomerReturn,
  getCustomerReturns,
  updateCustomerReturnStatus,
  createSupplierReturn,
  getSupplierReturns,
} from "../controllers/returnsController.js";
import adminAuth from "../middleware/adminAuth.js";

const returnsRouter = express.Router();

// Customer Returns (RMA)
returnsRouter.post("/customer/create", adminAuth, createCustomerReturn);
returnsRouter.get("/customer/list", adminAuth, getCustomerReturns);
returnsRouter.post("/customer/update-status", adminAuth, updateCustomerReturnStatus);

// Supplier Returns (Debit Notes)
returnsRouter.post("/supplier/create", adminAuth, createSupplierReturn);
returnsRouter.get("/supplier/list", adminAuth, getSupplierReturns);

export default returnsRouter;
