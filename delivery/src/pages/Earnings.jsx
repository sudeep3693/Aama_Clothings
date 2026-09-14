import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useDelivery } from "../context/DeliveryContext";

const Earnings = () => {
  const { token, partner, backendUrl, currency } = useDelivery();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);

  const fetchEarningsData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/delivery-job/my`, {
        headers: { token },
      });
      if (res.data.success) {
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  const deliveredJobs = jobs.filter((j) => j.status === "delivered");
  const codJobs = deliveredJobs.filter((j) => j.isCodCollected);
  const totalCodCash = codJobs.reduce((sum, j) => sum + (j.codAmount || 0), 0);
  const payoutPerDelivery = 150; // Standard Rs 150 per successful delivery run
  const totalEarnings = deliveredJobs.length * payoutPerDelivery;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Driver COD Reconciliation &amp; Earnings
          </h1>
          <p className="text-xs text-slate-500">
            Track Cash On Delivery collected and delivery commission payouts
          </p>
        </div>

        <button
          onClick={fetchEarningsData}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Statement
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* COD Cash On Hand */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              COD Cash On Hand
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {currency}
              {totalCodCash.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Deposit to Aama treasury at end of weekly run
          </p>
        </div>

        {/* Total Courier Payout */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Delivery Commission Payout
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">
              {currency}
              {totalEarnings.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Earned at Rs {payoutPerDelivery} / successful trip
          </p>
        </div>

        {/* Trips Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Trips
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {deliveredJobs.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Deliveries</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            100% verified doorstep deliveries
          </p>
        </div>
      </div>

      {/* COD Delivery History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Delivered COD Statements</h2>
            <p className="text-xs text-slate-500">
              Verified deliveries with cash collection records
            </p>
          </div>
        </div>

        {codJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No COD deliveries logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Task Reference</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4">COD Collected</th>
                  <th className="py-3 px-4">Driver Earnings</th>
                  <th className="py-3 px-4 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {codJobs.map((job) => {
                  const order = job.orderAssignment?.order;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{job.id.slice(-8)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        {order?.address?.firstName} {order?.address?.lastName}
                        <span className="block text-[11px] text-slate-400">
                          {order?.address?.city}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(job.deliveredAt || job.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {currency}{(job.codAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">
                        +{currency}{payoutPerDelivery}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified Cash
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
