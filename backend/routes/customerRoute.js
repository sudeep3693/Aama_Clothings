import express from "express";
import {
  listAllCustomers,
  getCustomerDetails,
  uploadCustomerLetter,
  deleteCustomerLetter,
} from "../controllers/customerController.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";

const customerRouter = express.Router();

customerRouter.get("/list", adminAuth, listAllCustomers);
customerRouter.get("/details/:userId", adminAuth, getCustomerDetails);
customerRouter.post("/letter/upload", adminAuth, upload.single("image"), uploadCustomerLetter);
customerRouter.delete("/letter/:id", adminAuth, deleteCustomerLetter);

export default customerRouter;
