import express from "express";
import authAdmin from "../middleware/adminAuth.js";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from "../controllers/expenseController.js";

const expenseRouter = express.Router();

expenseRouter.post("/add", authAdmin, createExpense);
expenseRouter.get("/list", authAdmin, getExpenses);
expenseRouter.post("/update", authAdmin, updateExpense);
expenseRouter.post("/delete", authAdmin, deleteExpense);
expenseRouter.get("/summary", authAdmin, getExpenseSummary);

export default expenseRouter;
