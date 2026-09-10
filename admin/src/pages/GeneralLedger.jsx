/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const GeneralLedger = ({ token }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Accounts list on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/accounting/chart-of-accounts`, {
          headers: { token },
        });
        if (res.data.success) {
          const accs = res.data.accounts || [];
          setAccounts(accs);
          if (accs.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accs[0].id);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load accounts for General Ledger");
      }
    };
    fetchAccounts();
  }, [token]);

  const fetchStatement = async () => {
    if (!selectedAccountId) return;
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get(
        `${backendUrl}/api/accounting/general-ledger/${selectedAccountId}`,
        {
          headers: { token },
          params,
        }
      );

      if (res.data.success) {
        setStatement(res.data);
      } else {
        toast.error(res.data.message || "Failed to load ledger statement");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to General Ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchStatement();
    }
  }, [selectedAccountId, token]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">General Ledger Statement</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Account-Level Drilldown
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Running debit/credit activity and cumulative balance for individual ledger accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatement}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Statement
          </button>
        </div>
      </div>

      {/* Control Bar: Account Selector & Date Range */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Select General Ledger Account
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                [{acc.accountCode}] {acc.accountName} — {acc.category} ({acc.normalBalance})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            To Date
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            <button
              onClick={fetchStatement}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Account Metric Cards */}
      {statement && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Opening Balance</div>
            <div className="text-xl font-mono font-bold text-slate-900 mt-1">
              Rs {Number(statement.openingBalance || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Prior to period start</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[10px] font-bold text-blue-500 uppercase">Period Debits (Dr)</div>
            <div className="text-xl font-mono font-bold text-blue-700 mt-1">
              Rs {Number(statement.periodDebit || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Inflows / Increases</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[10px] font-bold text-purple-500 uppercase">Period Credits (Cr)</div>
            <div className="text-xl font-mono font-bold text-purple-700 mt-1">
              Rs {Number(statement.periodCredit || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Outflows / Decreases</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-[10px] font-bold text-emerald-500 uppercase">Closing Balance</div>
            <div className="text-xl font-mono font-bold text-emerald-700 mt-1">
              Rs {Number(statement.closingBalance || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Normal: {selectedAccount?.normalBalance}
            </div>
          </div>
        </div>
      )}

      {/* Ledger Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Transactions &amp; Activity Log
            </h2>
            <p className="text-[11px] text-slate-400">
              Account: <span className="font-mono font-semibold text-slate-700">{selectedAccount?.accountCode}</span> — {selectedAccount?.accountName}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {statement?.lines?.length || 0} entries in period
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Entry #</th>
                <th className="py-3 px-4">Source Type</th>
                <th className="py-3 px-4">Memo / Description</th>
                <th className="py-3 px-4 text-right">Debit (Dr)</th>
                <th className="py-3 px-4 text-right">Credit (Cr)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    Loading ledger statement...
                  </td>
                </tr>
              ) : !statement?.lines || statement.lines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    No transactions recorded for this account in the selected period.
                  </td>
                </tr>
              ) : (
                statement.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(line.entryDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {line.entryNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                        {line.sourceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      <div>{line.memo || "—"}</div>
                      {line.description && (
                        <div className="text-[10px] text-slate-400">{line.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {Number(line.debit) > 0 ? `Rs ${Number(line.debit).toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {Number(line.credit) > 0 ? `Rs ${Number(line.credit).toLocaleString()}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                      Rs {Number(line.runningBalance).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {statement && (
              <tfoot className="bg-slate-50 border-t border-slate-200 font-mono font-bold text-xs text-slate-900">
                <tr>
                  <td colSpan="4" className="py-3 px-4 text-right uppercase text-[10px] text-slate-500">
                    Period Totals &amp; Closing:
                  </td>
                  <td className="py-3 px-4 text-right text-blue-700">
                    Rs {Number(statement.periodDebit || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-purple-700">
                    Rs {Number(statement.periodCredit || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 bg-emerald-50/30">
                    Rs {Number(statement.closingBalance || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default GeneralLedger;
