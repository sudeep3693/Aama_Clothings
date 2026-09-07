import express from "express";
import {
  addCategory,
  listCategories,
  removeCategory,
} from "../controllers/categoryController.js";
import adminAuth from "../middleware/adminAuth.js";

const categoryRouter = express.Router();

categoryRouter.post("/add", adminAuth, addCategory);
categoryRouter.get("/list", listCategories);
categoryRouter.post("/remove", adminAuth, removeCategory);

export default categoryRouter;
