import express from "express";
import {
  getFinancialAnalyticsDashboard,
  getTreasuryAccounts,
  createTreasuryAccount,
  recordCashTransfer,
  getCashTransactions,
  getFixedAssets,
  createFixedAsset,
  runDepreciationBatch,
  recordAssetDamageOrDisposal,
  getPartnershipOverview,
  savePartner,
  calculateAndExecuteProfitDistribution,
  getInvestorsAndLiabilities,
  recordInvestorFinancing,
  recordLiabilityRepayment,
  getPayablesAndReceivables,
  createPayable,
  createReceivable,
  settlePayable,
  collectReceivable,
  getVATAndTaxReport,
  getFinancialStatements,
} from "../controllers/financialController.js";
import adminAuth from "../middleware/adminAuth.js";

const financialRouter = express.Router();

// Executive Analytics & Overview
financialRouter.get("/dashboard", adminAuth, getFinancialAnalyticsDashboard);

// Treasury & Liquid Cash
financialRouter.get("/treasury-accounts", adminAuth, getTreasuryAccounts);
financialRouter.post("/create-account", adminAuth, createTreasuryAccount);
financialRouter.post("/cash-transfer", adminAuth, recordCashTransfer);
financialRouter.get("/cash-transactions", adminAuth, getCashTransactions);

// Fixed Assets & Depreciation
financialRouter.get("/fixed-assets", adminAuth, getFixedAssets);
financialRouter.post("/create-asset", adminAuth, createFixedAsset);
financialRouter.post("/run-depreciation", adminAuth, runDepreciationBatch);
financialRouter.post("/damage-asset", adminAuth, recordAssetDamageOrDisposal);

// Partnership & Profit Distribution
financialRouter.get("/partnership-overview", adminAuth, getPartnershipOverview);
financialRouter.post("/save-partner", adminAuth, savePartner);
financialRouter.post("/profit-distribution", adminAuth, calculateAndExecuteProfitDistribution);

// Investors & Liabilities
financialRouter.get("/liabilities", adminAuth, getInvestorsAndLiabilities);
financialRouter.post("/record-financing", adminAuth, recordInvestorFinancing);
financialRouter.post("/repay-liability", adminAuth, recordLiabilityRepayment);

// Accounts Payable & Receivable (Liabilities & Settlements)
financialRouter.get("/payables-receivables", adminAuth, getPayablesAndReceivables);
financialRouter.post("/create-payable", adminAuth, createPayable);
financialRouter.post("/create-receivable", adminAuth, createReceivable);
financialRouter.post("/settle-payable", adminAuth, settlePayable);
financialRouter.post("/collect-receivable", adminAuth, collectReceivable);

// Tax & VAT
financialRouter.get("/tax-report", adminAuth, getVATAndTaxReport);

// Financial Statements
financialRouter.get("/statements", adminAuth, getFinancialStatements);

export default financialRouter;
