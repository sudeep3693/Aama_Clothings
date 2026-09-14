import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Truck,
  Navigation,
  CheckCircle,
  Search,
  Filter,
  ArrowRight,
  MapPin,
  RefreshCw,
  Phone,
  Package,
} from "lucide-react";
import { useDelivery } from "../context/DeliveryContext";
import JobStatusBadge from "../components/JobStatusBadge";

const Jobs = () => {
  const { token, backendUrl, currency, setJobStats } = useDelivery();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchJobs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/delivery-job/my`, {
        headers: { token },
      });
      if (res.data.success) {
        const list = res.data.jobs || [];
        setJobs(list);

        const assigned = list.filter((j) => j.status === "assigned").length;
        const accepted = list.filter((j) => j.status === "accepted").length;
        const picked_up = list.filter((j) => j.status === "picked_up").length;
        const in_transit = list.filter((j) => j.status === "in_transit").length;
        const delivered = list.filter((j) => j.status === "delivered").length;

        setJobStats({
          assigned,
          accepted,
          picked_up,
          in_transit,
          delivered,
          total: list.length,
        });
      }
    } catch (err) {
      toast.error("Failed to load delivery tasks");
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, setJobStats]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleAccept = async (jobId) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/delivery-job/accept/${jobId}`,
        {},
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("Delivery run accepted! Pickup address unlocked.");
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept");
    }
  };

  const handleQuickStatus = async (jobId, nextStatus) => {
    try {
      const res = await axios.put(
        `${backendUrl}/api/delivery-job/status/${jobId}`,
        { status: nextStatus },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(`Task updated to ${nextStatus}`);
        fetchJobs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const filteredJobs = jobs.filter((item) => {
    if (activeTab === "assigned" && item.status !== "assigned") return false;
    if (activeTab === "pickup" && item.status !== "accepted") return false;
    if (activeTab === "active" && !["picked_up", "in_transit"].includes(item.status))
      return false;
    if (activeTab === "delivered" && item.status !== "delivered") return false;
    if (activeTab === "failed" && item.status !== "failed") return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const jobId = item.id.toLowerCase();
      const mfgName = (item.orderAssignment?.manufacturer?.businessName || "").toLowerCase();
      const destCity = (
        item.orderAssignment?.order?.address?.city ||
        item.orderAssignment?.order?.shippingAddress?.city ||
        ""
      ).toLowerCase();
      return jobId.includes(term) || mfgName.includes(term) || destCity.includes(term);
    }
    return true;
  });

  const tabCounts = {
    all: jobs.length,
    assigned: jobs.filter((j) => j.status === "assigned").length,
    pickup: jobs.filter((j) => j.status === "accepted").length,
    active: jobs.filter((j) => ["picked_up", "in_transit"].includes(j.status)).length,
    delivered: jobs.filter((j) => j.status === "delivered").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Delivery Tasks &amp; Runs
          </h1>
          <p className="text-xs text-slate-500">
            Accept runs, collect parcels from manufacturer hubs, and deliver to customers
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Tasks
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: "all", label: "All Tasks", count: tabCounts.all },
          { id: "assigned", label: "New Offers", count: tabCounts.assigned, alert: tabCounts.assigned > 0 },
          { id: "pickup", label: "Pickup Pending", count: tabCounts.pickup },
          { id: "active", label: "Out on Route", count: tabCounts.active },
          { id: "delivered", label: "Delivered", count: tabCounts.delivered },
          { id: "failed", label: "Failed / Returned", count: tabCounts.failed },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === tab.id
                  ? "bg-blue-700 text-white"
                  : tab.alert
                  ? "bg-rose-100 text-rose-700 font-bold"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by task ID, hub name, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading delivery runs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No tasks in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Task ID</th>
                  <th className="py-3.5 px-4">Pickup Manufacturer</th>
                  <th className="py-3.5 px-4">Customer Destination</th>
                  <th className="py-3.5 px-4">COD Cash Collection</th>
                  <th className="py-3.5 px-4">Task Status</th>
                  <th className="py-3.5 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredJobs.map((job) => {
                  const mfg = job.orderAssignment?.manufacturer;
                  const order = job.orderAssignment?.order;

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{job.id.slice(-8)}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {mfg?.businessName || "Hub"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {mfg?.city} • {mfg?.phone || "Phone hidden"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {order?.address?.city || order?.shippingAddress?.city || "Nepal"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {job.status === "assigned"
                            ? "Accept to view street address"
                            : `${order?.address?.street || ""}, ${order?.address?.phone || ""}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {currency}
                        {(job.codAmount || 0).toLocaleString()}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {job.isCodCollected ? (
                            <span className="text-emerald-600 font-semibold">✓ Collected</span>
                          ) : (
                            "Due from customer"
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <JobStatusBadge status={job.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {job.status === "assigned" && (
                            <button
                              onClick={() => handleAccept(job.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                            >
                              Accept Run
                            </button>
                          )}

                          {job.status === "accepted" && (
                            <button
                              onClick={() => handleQuickStatus(job.id, "picked_up")}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                            >
                              Mark Picked Up
                            </button>
                          )}

                          {job.status === "picked_up" && (
                            <button
                              onClick={() => handleQuickStatus(job.id, "in_transit")}
                              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                            >
                              Start Delivery Run
                            </button>
                          )}

                          {job.status === "in_transit" && (
                            <Link
                              to={`/jobs/${job.id}`}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                            >
                              Deliver &amp; COD
                            </Link>
                          )}

                          <Link
                            to={`/jobs/${job.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                          >
                            Details
                          </Link>
                        </div>
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

export default Jobs;
