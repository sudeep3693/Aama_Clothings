import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Truck,
  Navigation,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight,
  RefreshCw,
  MapPin,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import { useDelivery } from "../context/DeliveryContext";
import JobStatusBadge from "../components/JobStatusBadge";

const Dashboard = () => {
  const { token, partner, backendUrl, currency, setJobStats } = useDelivery();
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState([]);
  const [counts, setCounts] = useState({
    assigned: 0,
    accepted: 0,
    picked_up: 0,
    in_transit: 0,
    delivered: 0,
    total: 0,
    codCollectedTotal: 0,
  });

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/delivery-job/my`, {
        headers: { token },
      });
      if (res.data.success) {
        const jobs = res.data.jobs || [];
        setRecentJobs(jobs.slice(0, 6));

        const assigned = jobs.filter((j) => j.status === "assigned").length;
        const accepted = jobs.filter((j) => j.status === "accepted").length;
        const picked_up = jobs.filter((j) => j.status === "picked_up").length;
        const in_transit = jobs.filter((j) => j.status === "in_transit").length;
        const delivered = jobs.filter((j) => j.status === "delivered").length;

        const codCollectedTotal = jobs
          .filter((j) => j.status === "delivered" && j.isCodCollected)
          .reduce((sum, j) => sum + (j.codAmount || 0), 0);

        const currentCounts = {
          assigned,
          accepted,
          picked_up,
          in_transit,
          delivered,
          total: jobs.length,
          codCashOnHand: codCollectedTotal,
        };
        setCounts(currentCounts);
        setJobStats(currentCounts);
      }
    } catch (err) {
      console.error("Delivery dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, setJobStats]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleQuickAccept = async (jobId) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/delivery-job/accept/${jobId}`,
        {},
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("Delivery task accepted! Pickup address unlocked.");
        loadDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept task");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                Operating City: {partner?.city}
              </span>
              <span className="text-xs text-slate-300">
                Vehicle: <span className="text-blue-300 font-semibold">{partner?.vehicleType || "BIKE"}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {partner?.name} Dispatch Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Real-time courier operations. Pick up packages from local manufacturer hubs and deliver securely to customers across {partner?.city}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/10 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <span>View Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              New Run Offers
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {counts.assigned}
            </span>
            {counts.assigned > 0 && (
              <span className="text-[11px] font-bold text-amber-600 animate-pulse">
                Ready to accept
              </span>
            )}
          </div>
        </div>

        {/* Active Trips */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Trips
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {counts.accepted + counts.picked_up + counts.in_transit}
            </span>
            <span className="text-[11px] text-slate-500">in progress</span>
          </div>
        </div>

        {/* Total Delivered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Deliveries
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {counts.delivered}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Delivered</span>
          </div>
        </div>

        {/* COD Cash On Hand */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              COD Cash On Hand
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {currency}
              {counts.codCashOnHand?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Delivery Jobs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Delivery Tasks</h2>
            <p className="text-xs text-slate-500">
              Pickup from manufacturer hub &amp; doorstep handover
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All ({counts.total})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No delivery tasks assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">
              When manufacturers in {partner?.city} mark packages ready for pickup, assignments will show here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Pickup Hub</th>
                  <th className="py-3 px-4">Customer Destination</th>
                  <th className="py-3 px-4">COD to Collect</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentJobs.map((job) => {
                  const mfg = job.orderAssignment?.manufacturer;
                  const order = job.orderAssignment?.order;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{job.id.slice(-6)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {mfg?.businessName || "Hub"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {mfg?.city}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {order?.address?.city || order?.shippingAddress?.city || "Nepal"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {job.status === "assigned" ? "Accept to view street address" : (order?.address?.street || "Revealed")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {currency}
                        {(job.codAmount || 0).toLocaleString()}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {job.isCodCollected ? "Collected" : "Due on delivery"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <JobStatusBadge status={job.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {job.status === "assigned" ? (
                          <button
                            onClick={() => handleQuickAccept(job.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Accept Run
                          </button>
                        ) : (
                          <Link
                            to={`/jobs/${job.id}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                          >
                            Manage Run
                          </Link>
                        )}
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

export default Dashboard;
