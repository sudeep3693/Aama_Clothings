import express from "express";
import {
  getChartOfAccounts,
  createAccount,
  updateAccount,
  getJournalEntries,
  getJournalEntryById,
  createManualJournalEntry,
  reverseJournalEntry,
  getGeneralLedgerReport,
  getTrialBalanceReport,
  getRealtimeFinancialStatements,
  getSubledgerReconciliation,
  getFiscalYearsAndPeriods,
  createFiscalYear,
  togglePeriodStatus,
} from "../controllers/accountingController.js";
import adminAuth from "../middleware/adminAuth.js";

const accountingRouter = express.Router();

// Chart of Accounts
accountingRouter.get("/chart-of-accounts", adminAuth, getChartOfAccounts);
accountingRouter.post("/create-account", adminAuth, createAccount);
accountingRouter.post("/update-account", adminAuth, updateAccount);

// Journal Entries & Double-Entry Ledger
accountingRouter.get("/journal-entries", adminAuth, getJournalEntries);
accountingRouter.get("/journal-entry/:id", adminAuth, getJournalEntryById);
accountingRouter.post("/manual-journal", adminAuth, createManualJournalEntry);
accountingRouter.post("/reverse-journal", adminAuth, reverseJournalEntry);

// Reports Derived Directly from General Ledger
accountingRouter.get("/general-ledger", adminAuth, getGeneralLedgerReport);
accountingRouter.get("/general-ledger/:accountId", adminAuth, getGeneralLedgerReport);
accountingRouter.get("/trial-balance", adminAuth, getTrialBalanceReport);
accountingRouter.get("/financial-statements", adminAuth, getRealtimeFinancialStatements);
accountingRouter.get("/subledger-reconciliation", adminAuth, getSubledgerReconciliation);

// Fiscal Years & Periods
accountingRouter.get("/fiscal-years", adminAuth, getFiscalYearsAndPeriods);
accountingRouter.post("/create-fiscal-year", adminAuth, createFiscalYear);
accountingRouter.post("/toggle-period", adminAuth, togglePeriodStatus);

export default accountingRouter;
