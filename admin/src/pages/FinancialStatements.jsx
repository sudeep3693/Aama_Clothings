/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../App";

const FinancialStatements = ({ token }) => {
  const [statementData, setStatementData] = useState(null);
  const [activeTab, setActiveTab] = useState("PL"); // PL, BS, CF
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchStatements = async (month) => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/finance/statements?month=${month}`, {
        headers: { token },
      });
      if (res.data.success) {
        setStatementData(res.data.data);
      } else {
        toast.error(res.data.message || "Failed to load financial statements");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStatements(selectedMonth);
  }, [token, selectedMonth]);

  if (loading && !statementData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Compiling GAAP / IFRS Financial Statements...
          </p>
        </div>
      </div>
    );
  }

  const pl = statementData?.incomeStatement || {};
  const bs = statementData?.balanceSheet || {};
  const cf = statementData?.cashFlowStatement || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 rounded-lg border border-teal-200/60">
              Audited Financial Reporting
            </span>
            <span className="text-xs font-medium text-slate-400">P&amp;L, Balance Sheet &amp; Cash Flow</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Financial Statements Suite</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Double-entry reconciled income statement, balance sheet statement, and cash flow operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <label className="text-xs font-semibold text-slate-600">Period:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => fetchStatements(selectedMonth)}
            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh Statements"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* STATEMENTS NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("PL")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "PL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Income Statement (P&amp;L)
        </button>

        <button
          onClick={() => setActiveTab("BS")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "BS" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Balance Sheet
        </button>

        <button
          onClick={() => setActiveTab("CF")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "CF" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Cash Flow Statement
        </button>
      </div>

      {/* 1. INCOME STATEMENT (P&L) */}
      {activeTab === "PL" && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-4xl space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Aama Clothings Inc.</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement of Profit &amp; Loss</p>
            <p className="text-xs text-slate-500 font-medium mt-1">For Period Ending {pl.period || selectedMonth}</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* REVENUE SECTION */}
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Revenue</p>
              <div className="space-y-1 pl-4">
                <div className="flex justify-between py-1 border-b border-slate-50 text-slate-700">
                  <span>Gross Sales (MRP Inc. 13% VAT)</span>
                  <span className="font-mono">{currency}{(pl.grossRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-rose-600">
                  <span>Less: Customer Returns &amp; Refunds</span>
                  <span className="font-mono">({currency}{(pl.returnsAndAllowances || 0).toLocaleString()})</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-slate-900 pt-2">
                  <span>Net Taxable Sales Revenue (Ex-VAT Base)</span>
                  <span className="font-mono">{currency}{(pl.taxableNetRevenue || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* COGS SECTION */}
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Cost of Goods Sold (COGS)</p>
              <div className="space-y-1 pl-4">
                <div className="flex justify-between py-1 border-b border-slate-50 text-rose-600">
                  <span>Direct Product Supplier Costs</span>
                  <span className="font-mono">({currency}{(pl.cogs || 0).toLocaleString()})</span>
                </div>
                <div className="flex justify-between py-1 font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span className="text-sm">Gross Profit</span>
                  <span className="font-mono text-sm text-emerald-600">{currency}{(pl.grossProfit || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* OPERATING EXPENSES */}
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Operating Expenses (OPEX)</p>
              <div className="space-y-1 pl-4 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Digital Marketing &amp; Meta Ads</span>
                  <span className="font-mono">{currency}{(pl.operatingExpenses?.marketing || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Office Rent &amp; Warehousing</span>
                  <span className="font-mono">{currency}{(pl.operatingExpenses?.rent || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Staff Salaries &amp; Payroll</span>
                  <span className="font-mono">{currency}{(pl.operatingExpenses?.salaries || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Utilities &amp; Internet</span>
                  <span className="font-mono">{currency}{(pl.operatingExpenses?.utilities || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Software Tools &amp; SaaS</span>
                  <span className="font-mono">{currency}{(pl.operatingExpenses?.software || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Miscellaneous &amp; Packaging</span>
                  <span className="font-mono">{currency}{(pl.operatingExpenses?.misc || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Operating Expenses</span>
                  <span className="font-mono text-rose-600">({currency}{(pl.operatingExpenses?.total || 0).toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* DEPRECIATION & TAX */}
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Depreciation &amp; Tax</p>
              <div className="space-y-1 pl-4 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-50 text-amber-700">
                  <span>Asset Depreciation (IRD Diminishing Balance)</span>
                  <span className="font-mono">({currency}{(pl.depreciation || 0).toLocaleString()})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-slate-900 font-bold">
                  <span>Net Operating Income (EBT)</span>
                  <span className="font-mono">{currency}{(pl.netOperatingIncome || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 text-rose-600">
                  <span>Estimated Corporate Income Tax (25%)</span>
                  <span className="font-mono">({currency}{(pl.incomeTaxEstimate || 0).toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* NET INCOME */}
            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
              <span className="text-base font-black text-slate-900 uppercase">Net Income (Bottom Line)</span>
              <span className={`text-xl font-black font-mono ${pl.netIncomeAfterTax >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {currency}{(pl.netIncomeAfterTax || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. BALANCE SHEET */}
      {activeTab === "BS" && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-4xl space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Aama Clothings Inc.</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement of Financial Position (Balance Sheet)</p>
            <p className="text-xs text-slate-500 font-medium mt-1">As of {selectedMonth}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* ASSETS SIDE */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-900 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Assets</span>
                <span className="text-xs text-slate-400 font-semibold">Total Debit</span>
              </div>

              <div>
                <p className="font-bold text-slate-800 uppercase text-[11px] mb-2">Current Assets</p>
                <div className="space-y-1 pl-3 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span>Cash &amp; Liquid Bank Accounts</span>
                    <span className="font-mono">{currency}{(bs.assets?.currentAssets?.cashAndEquivalents || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span>Merchandise Inventory at Cost</span>
                    <span className="font-mono">{currency}{(bs.assets?.currentAssets?.inventoryValuation || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-slate-900 pt-1">
                    <span>Total Current Assets</span>
                    <span className="font-mono">{currency}{(bs.assets?.currentAssets?.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-800 uppercase text-[11px] mb-2">Non-Current (Fixed) Assets</p>
                <div className="space-y-1 pl-3 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span>Gross Fixed Assets (Historical Cost)</span>
                    <span className="font-mono">{currency}{(bs.assets?.fixedAssets?.grossCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 text-amber-700">
                    <span>Less: Accumulated Depreciation</span>
                    <span className="font-mono">({currency}{(bs.assets?.fixedAssets?.accumulatedDepreciation || 0).toLocaleString()})</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-slate-900 pt-1">
                    <span>Net Book Value</span>
                    <span className="font-mono">{currency}{(bs.assets?.fixedAssets?.netBookValue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center font-black text-slate-900 text-sm">
                <span>TOTAL ASSETS</span>
                <span className="font-mono text-emerald-600 text-base">{currency}{(bs.assets?.totalAssets || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY SIDE */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-900 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Liabilities &amp; Equity</span>
                <span className="text-xs text-slate-400 font-semibold">Total Credit</span>
              </div>

              <div>
                <p className="font-bold text-slate-800 uppercase text-[11px] mb-2">Liabilities</p>
                <div className="space-y-1 pl-3 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span>Investor Loans &amp; Outstanding Debt</span>
                    <span className="font-mono">{currency}{(bs.liabilities?.totalLiabilities || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-slate-900 pt-1">
                    <span>Total Liabilities</span>
                    <span className="font-mono">{currency}{(bs.liabilities?.totalLiabilities || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-800 uppercase text-[11px] mb-2">Owner &amp; Partner Equity</p>
                <div className="space-y-1 pl-3 text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span>Partner Contributed Capital</span>
                    <span className="font-mono">{currency}{(bs.equity?.partnerCapital || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span>Retained Earnings &amp; Reserves</span>
                    <span className="font-mono">{currency}{(bs.equity?.retainedEarnings || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-slate-900 pt-1">
                    <span>Total Equity</span>
                    <span className="font-mono">{currency}{(bs.equity?.totalEquity || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center font-black text-slate-900 text-sm">
                <span>TOTAL LIABILITIES &amp; EQUITY</span>
                <span className="font-mono text-emerald-600 text-base">
                  {currency}{((bs.liabilities?.totalLiabilities || 0) + (bs.equity?.totalEquity || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CASH FLOW STATEMENT */}
      {activeTab === "CF" && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-4xl space-y-6">
          <div className="text-center pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Aama Clothings Inc.</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement of Cash Flows</p>
            <p className="text-xs text-slate-500 font-medium mt-1">For Period Ending {selectedMonth}</p>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Cash Flows from Operating Activities</p>
              <div className="space-y-1 pl-4">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Net Cash from Customer Sales &amp; Operations</span>
                  <span className="font-mono text-emerald-600">{currency}{(cf.operatingActivities || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Cash Flows from Investing Activities</p>
              <div className="space-y-1 pl-4">
                <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                  <span>Fixed Asset Additions / Maintenance</span>
                  <span className="font-mono">{currency}{(cf.investingActivities || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Cash Flows from Financing Activities</p>
              <div className="space-y-1 pl-4">
                <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                  <span>Partner Equity / Debt Financing Activity</span>
                  <span className="font-mono">{currency}{(cf.financingActivities || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center font-black text-slate-900 text-sm">
              <span>NET CHANGE IN LIQUID CASH</span>
              <span className="font-mono text-emerald-600 text-base">{currency}{(cf.netCashFlow || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialStatements;
