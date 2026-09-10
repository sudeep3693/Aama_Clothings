/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../App";

const PartnershipEquity = ({ token }) => {
  const [partnerData, setPartnerData] = useState({ partners: [], distributions: [], summary: {} });
  const [liabilities, setLiabilities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState(null);

  // Forms
  const [partnerForm, setPartnerForm] = useState({
    partnerName: "",
    email: "",
    phone: "",
    ownershipPercentage: "",
    initialCapital: "",
    notes: "",
  });

  const [distForm, setDistForm] = useState({
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
    fiscalYear: "2082/2083",
    retainedEarningsPercentage: 20,
    executePayout: false,
    fromAccountId: "",
  });

  const [investorForm, setInvestorForm] = useState({
    investorName: "",
    contactPhone: "",
    contactEmail: "",
    type: "EQUITY_INVESTOR", // EQUITY_INVESTOR, LONG_TERM_LOAN, SHORT_TERM_BORROWING
    principalAmount: "",
    interestRate: "0",
    monthlyInstallment: "0",
    equityGrantedPercentage: "0",
    startDate: new Date().toISOString().split("T")[0],
    depositAccountId: "",
    notes: "",
  });

  const [repayForm, setRepayForm] = useState({
    repaymentAmount: "",
    fromAccountId: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [partRes, liabRes, accRes] = await Promise.all([
        axios.get(`${backendUrl}/api/finance/partnership-overview`, { headers: { token } }),
        axios.get(`${backendUrl}/api/finance/liabilities`, { headers: { token } }),
        axios.get(`${backendUrl}/api/finance/treasury-accounts`, { headers: { token } }),
      ]);

      if (partRes.data.success) setPartnerData(partRes.data.data || { partners: [], distributions: [], summary: {} });
      if (liabRes.data.success) setLiabilities(liabRes.data.liabilities || []);
      if (accRes.data.success) setAccounts(accRes.data.accounts || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load partnership and investor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleSavePartner = async (e) => {
    e.preventDefault();
    if (!partnerForm.partnerName || !partnerForm.email || !partnerForm.ownershipPercentage) {
      return toast.warn("Partner name, email, and ownership percentage are required");
    }

    try {
      const res = await axios.post(`${backendUrl}/api/finance/save-partner`, partnerForm, {
        headers: { token },
      });
      if (res.data.success) {
        toast.success("Partner saved successfully");
        setShowAddPartner(false);
        setPartnerForm({ partnerName: "", email: "", phone: "", ownershipPercentage: "", initialCapital: "", notes: "" });
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleProfitDistribution = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendUrl}/api/finance/profit-distribution`, distForm, {
        headers: { token },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowDistributeModal(false);
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleSaveInvestor = async (e) => {
    e.preventDefault();
    if (!investorForm.investorName || !investorForm.principalAmount) {
      return toast.warn("Investor name and principal amount are required");
    }

    try {
      const res = await axios.post(`${backendUrl}/api/finance/record-financing`, investorForm, {
        headers: { token },
      });
      if (res.data.success) {
        toast.success("Financing record created");
        setShowAddInvestor(false);
        setInvestorForm({
          investorName: "",
          contactPhone: "",
          contactEmail: "",
          type: "EQUITY_INVESTOR",
          principalAmount: "",
          interestRate: "0",
          monthlyInstallment: "0",
          equityGrantedPercentage: "0",
          startDate: new Date().toISOString().split("T")[0],
          depositAccountId: "",
          notes: "",
        });
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleRepayLiability = async (e) => {
    e.preventDefault();
    if (!selectedLiability || !repayForm.repaymentAmount) return;

    try {
      const res = await axios.post(
        `${backendUrl}/api/finance/repay-liability`,
        {
          liabilityId: selectedLiability.id,
          ...repayForm,
        },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("Repayment recorded");
        setShowRepayModal(false);
        setSelectedLiability(null);
        setRepayForm({ repaymentAmount: "", fromAccountId: "", notes: "" });
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const partners = partnerData.partners || [];
  const distributions = partnerData.distributions || [];
  const summary = partnerData.summary || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 rounded-lg border border-purple-200/60">
              Equity &amp; Capital Structure
            </span>
            <span className="text-xs font-medium text-slate-400">Partnership &amp; Investor Vault</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Partnership &amp; Investor Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Partner ownership split %, automated profit distribution engine, and external investor liabilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowDistributeModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Distribute Net Profits</span>
          </button>

          <button
            onClick={() => setShowAddInvestor(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <span>+ Add Investor / Loan</span>
          </button>

          <button
            onClick={() => setShowAddPartner(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span>+ Add Partner</span>
          </button>
        </div>
      </div>

      {/* EQUITY SHARE PROGRESS BAR */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Partner Equity Allocation</h2>
            <p className="text-xs text-slate-400">Total ownership split across partners</p>
          </div>
          <span className="text-xs font-bold text-purple-700 px-3 py-1 bg-purple-50 rounded-xl border border-purple-200/60">
            {summary.totalOwnership || 0}% Allocated
          </span>
        </div>

        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
          {partners.map((p, idx) => {
            const colors = ["bg-purple-600", "bg-indigo-600", "bg-emerald-600", "bg-amber-600", "bg-blue-600"];
            return (
              <div
                key={p.id}
                className={`h-full ${colors[idx % colors.length]} transition-all`}
                style={{ width: `${p.ownershipPercentage}%` }}
                title={`${p.partnerName}: ${p.ownershipPercentage}%`}
              ></div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          {partners.map((p, idx) => {
            const dotColors = ["bg-purple-600", "bg-indigo-600", "bg-emerald-600", "bg-amber-600", "bg-blue-600"];
            return (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${dotColors[idx % dotColors.length]}`}></span>
                <span className="font-semibold text-slate-700">{p.partnerName}:</span>
                <span className="font-bold text-slate-900">{p.ownershipPercentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PARTNERS TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Partner Capital Accounts</h2>
            <p className="text-xs text-slate-400">Equity, initial capital, and cumulative distributions</p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="p-3">Partner Name</th>
                <th className="p-3">Email &amp; Contact</th>
                <th className="p-3 text-right">Ownership %</th>
                <th className="p-3 text-right">Initial Capital</th>
                <th className="p-3 text-right">Current Capital</th>
                <th className="p-3 text-right">Total Payouts Received</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {partners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-slate-400 font-medium">
                    No partners registered yet. Click &quot;+ Add Partner&quot; to configure equity.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{p.partnerName}</td>
                    <td className="p-3 text-slate-500">{p.email}</td>
                    <td className="p-3 text-right font-black text-purple-700">{p.ownershipPercentage}%</td>
                    <td className="p-3 text-right font-semibold">{currency}{Number(p.initialCapital).toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{currency}{Number(p.currentCapital).toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{currency}{Number(p.totalDistributionsReceived).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVESTORS & DEBT LIABILITIES TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">External Investors &amp; Liabilities</h2>
            <p className="text-xs text-slate-400">Debt financing, angel investor equity, and loan repayments</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{liabilities.length} Records</span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="p-3">Investor / Lender</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Principal</th>
                <th className="p-3 text-right">Repaid</th>
                <th className="p-3 text-right">Outstanding</th>
                <th className="p-3 text-right">Interest / Equity</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {liabilities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-400 font-medium">
                    No external investor liabilities or loans recorded.
                  </td>
                </tr>
              ) : (
                liabilities.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{l.investorName}</p>
                      <p className="text-[10px] text-slate-400">{l.contactPhone || l.contactEmail}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {l.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">{currency}{Number(l.principalAmount).toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-600 font-semibold">{currency}{Number(l.amountRepaid).toLocaleString()}</td>
                    <td className="p-3 text-right font-black text-rose-700">{currency}{Number(l.outstandingBalance).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {l.type === "EQUITY_INVESTOR" ? `${l.equityGrantedPercentage}% Equity` : `${l.interestRate}% APR`}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === "ACTIVE" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {l.status === "ACTIVE" && Number(l.outstandingBalance) > 0 && (
                        <button
                          onClick={() => {
                            setSelectedLiability(l);
                            setShowRepayModal(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          Repay
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD PARTNER */}
      {showAddPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Business Partner</h3>
              <button onClick={() => setShowAddPartner(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Partner Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sudeep Subedi"
                  value={partnerForm.partnerName}
                  onChange={(e) => setPartnerForm({ ...partnerForm, partnerName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    placeholder="partner@example.com"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="98XXXXXXXX"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Equity Share (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="50.0"
                    value={partnerForm.ownershipPercentage}
                    onChange={(e) => setPartnerForm({ ...partnerForm, ownershipPercentage: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Capital ({currency})</label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={partnerForm.initialCapital}
                    onChange={(e) => setPartnerForm({ ...partnerForm, initialCapital: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPartner(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROFIT DISTRIBUTION */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Run Profit Distribution Engine</h3>
              <button onClick={() => setShowDistributeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleProfitDistribution} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Period Start</label>
                  <input
                    type="date"
                    value={distForm.periodStart}
                    onChange={(e) => setDistForm({ ...distForm, periodStart: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Period End</label>
                  <input
                    type="date"
                    value={distForm.periodEnd}
                    onChange={(e) => setDistForm({ ...distForm, periodEnd: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fiscal Year</label>
                  <input
                    type="text"
                    value={distForm.fiscalYear}
                    onChange={(e) => setDistForm({ ...distForm, fiscalYear: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Retained Earnings (% Reinvested)</label>
                  <input
                    type="number"
                    value={distForm.retainedEarningsPercentage}
                    onChange={(e) => setDistForm({ ...distForm, retainedEarningsPercentage: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="execPayout"
                  checked={distForm.executePayout}
                  onChange={(e) => setDistForm({ ...distForm, executePayout: e.target.checked })}
                  className="w-4 h-4 rounded-md accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="execPayout" className="cursor-pointer">
                  <span className="font-bold text-slate-900 block">Execute Instant Bank/Cash Payout</span>
                  <span className="text-[10px] text-slate-400">Deducts dividend amounts from treasury account immediately.</span>
                </label>
              </div>

              {distForm.executePayout && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Disburse From Treasury Account *</label>
                  <select
                    value={distForm.fromAccountId}
                    onChange={(e) => setDistForm({ ...distForm, fromAccountId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900 font-medium"
                    required
                  >
                    <option value="">Select Treasury account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({currency}{Number(a.currentBalance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDistributeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  Calculate &amp; Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INVESTOR / LOAN */}
      {showAddInvestor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Investor Financing / Loan</h3>
              <button onClick={() => setShowAddInvestor(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveInvestor} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Investor / Lender Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Himalayan Angel Ventures / Bank Overdraft"
                  value={investorForm.investorName}
                  onChange={(e) => setInvestorForm({ ...investorForm, investorName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Financing Type</label>
                  <select
                    value={investorForm.type}
                    onChange={(e) => setInvestorForm({ ...investorForm, type: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900 font-medium"
                  >
                    <option value="EQUITY_INVESTOR">Angel / Equity Investor</option>
                    <option value="LONG_TERM_LOAN">Long-Term Bank Loan</option>
                    <option value="SHORT_TERM_BORROWING">Short-Term Working Capital</option>
                    <option value="CREDIT_LINE">Credit Line</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Principal Amount ({currency}) *</label>
                  <input
                    type="number"
                    placeholder="1000000"
                    value={investorForm.principalAmount}
                    onChange={(e) => setInvestorForm({ ...investorForm, principalAmount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900 font-bold"
                    required
                  />
                </div>
              </div>

              {investorForm.type === "EQUITY_INVESTOR" ? (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Equity Stake Granted (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="10.0"
                    value={investorForm.equityGrantedPercentage}
                    onChange={(e) => setInvestorForm({ ...investorForm, equityGrantedPercentage: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Interest Rate (% APR)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="11.5"
                      value={investorForm.interestRate}
                      onChange={(e) => setInvestorForm({ ...investorForm, interestRate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Monthly EMI ({currency})</label>
                    <input
                      type="number"
                      placeholder="25000"
                      value={investorForm.monthlyInstallment}
                      onChange={(e) => setInvestorForm({ ...investorForm, monthlyInstallment: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deposit Funds Into Treasury Account</label>
                <select
                  value={investorForm.depositAccountId}
                  onChange={(e) => setInvestorForm({ ...investorForm, depositAccountId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                >
                  <option value="">Do not credit treasury balance</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddInvestor(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                >
                  Save Financing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPAY LIABILITY */}
      {showRepayModal && selectedLiability && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Loan / Liability Repayment</h3>
              <button onClick={() => setShowRepayModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRepayLiability} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900">{selectedLiability.investorName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Outstanding Balance: <span className="font-bold text-rose-700">{currency}{Number(selectedLiability.outstandingBalance).toLocaleString()}</span>
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Repayment Amount ({currency}) *</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={repayForm.repaymentAmount}
                  onChange={(e) => setRepayForm({ ...repayForm, repaymentAmount: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deduct From Treasury Account</label>
                <select
                  value={repayForm.fromAccountId}
                  onChange={(e) => setRepayForm({ ...repayForm, fromAccountId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-slate-900"
                >
                  <option value="">Select Treasury account...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({currency}{Number(a.currentBalance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipEquity;
