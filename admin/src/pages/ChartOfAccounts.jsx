/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const CATEGORY_COLORS = {
  ASSET: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LIABILITY: "bg-amber-50 text-amber-700 border-amber-200",
  EQUITY: "bg-purple-50 text-purple-700 border-purple-200",
  REVENUE: "bg-blue-50 text-blue-700 border-blue-200",
  COGS: "bg-orange-50 text-orange-700 border-orange-200",
  EXPENSE: "bg-rose-50 text-rose-700 border-rose-200",
  TAX: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const ChartOfAccounts = ({ token }) => {
  const [accounts, setAccounts] = useState([]);
  const [groupedAccounts, setGroupedAccounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    accountCode: "",
    accountName: "",
    category: "EXPENSE",
    subType: "OPERATING_EXPENSE",
    normalBalance: "DEBIT",
    description: "",
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/accounting/chart-of-accounts`, {
        headers: { token },
      });
      if (res.data.success) {
        setAccounts(res.data.accounts || []);
        setGroupedAccounts(res.data.grouped || {});
      } else {
        toast.error(res.data.message || "Failed to load Chart of Accounts");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to Accounting Engine");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!formData.accountCode || !formData.accountName) {
      toast.warn("Account Code and Name are required");
      return;
    }

    try {
      const res = await axios.post(
        `${backendUrl}/api/accounting/chart-of-accounts`,
        formData,
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Account created successfully");
        setShowAddModal(false);
        setFormData({
          accountCode: "",
          accountName: "",
          category: "EXPENSE",
          subType: "OPERATING_EXPENSE",
          normalBalance: "DEBIT",
          description: "",
        });
        fetchAccounts();
      } else {
        toast.error(res.data.message || "Failed to create account");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Server error while saving account");
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchCat = selectedCategory === "ALL" || acc.category === selectedCategory;
    const matchSearch =
      acc.accountCode.toLowerCase().includes(search.toLowerCase()) ||
      acc.accountName.toLowerCase().includes(search.toLowerCase()) ||
      acc.subType?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalAssets = accounts
    .filter((a) => a.category === "ASSET")
    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);

  const totalLiabilities = accounts
    .filter((a) => a.category === "LIABILITY")
    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);

  const totalEquity = accounts
    .filter((a) => a.category === "EQUITY")
    .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chart of Accounts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              GAAP Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master ledger account taxonomy and double-entry classification engine
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAccounts}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Account
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{accounts.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active ledger definitions</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Asset Accounts (1000s)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">Rs {totalAssets.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Liquid + Inventory + Fixed</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Liabilities (2000s)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">Rs {totalLiabilities.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Payables + Loans + VAT Due</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Equity Accounts (3000s)</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">Rs {totalEquity.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Capital + Retained Earnings</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "COGS", "EXPENSE", "TAX"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search code or account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Account Code</th>
                <th className="py-3.5 px-4">Account Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4 text-center">Normal Bal</th>
                <th className="py-3.5 px-4 text-right">Current Balance</th>
                <th className="py-3.5 px-4 text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                    Loading accounts...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                    No matching accounts found.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {acc.accountCode}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      {acc.accountName}
                      {acc.description && (
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {acc.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          CATEGORY_COLORS[acc.category] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {acc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {acc.subType}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          acc.normalBalance === "DEBIT"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {acc.normalBalance}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      Rs {Number(acc.currentBalance || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {acc.isSystemAccount ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium" title="System Locked GAAP Account">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          System
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">Custom</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add New General Ledger Account</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Account Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6150"
                    value={formData.accountCode}
                    onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const norm = ["ASSET", "COGS", "EXPENSE"].includes(cat) ? "DEBIT" : "CREDIT";
                      setFormData({ ...formData, category: cat, normalBalance: norm });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    <option value="ASSET">ASSET (1000s)</option>
                    <option value="LIABILITY">LIABILITY (2000s)</option>
                    <option value="EQUITY">EQUITY (3000s)</option>
                    <option value="REVENUE">REVENUE (4000s)</option>
                    <option value="COGS">COGS (5000s)</option>
                    <option value="EXPENSE">EXPENSE (6000s)</option>
                    <option value="TAX">TAX (7000s)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Account Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Influencer Collaboration Expense"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Classification / Subtype
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MARKETING_EXPENSE"
                    value={formData.subType}
                    onChange={(e) => setFormData({ ...formData, subType: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Normal Balance
                  </label>
                  <select
                    value={formData.normalBalance}
                    onChange={(e) => setFormData({ ...formData, normalBalance: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    <option value="DEBIT">DEBIT (Dr)</option>
                    <option value="CREDIT">CREDIT (Cr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Description / Memo
                </label>
                <textarea
                  rows="2"
                  placeholder="Accounting notes and guidance for this ledger account..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;
