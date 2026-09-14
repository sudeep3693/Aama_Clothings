import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  Search,
  Filter,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { useManufacturer } from "../context/ManufacturerContext";
import StatusBadge from "../components/StatusBadge";

const Orders = () => {
  const { token, backendUrl, currency, setStats } = useManufacturer();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/order-assignment/my`, {
        headers: { token },
      });
      if (res.data.success) {
        const list = res.data.assignments || [];
        setAssignments(list);

        const pending = list.filter((a) => a.status === "assigned").length;
        const accepted = list.filter((a) => a.status === "accepted").length;
        const preparing = list.filter((a) => a.status === "preparing").length;
        const packaged = list.filter((a) => a.status === "packaged").length;
        const ready = list.filter((a) => a.status === "ready_for_pickup").length;
        const delivered = list.filter((a) => a.status === "delivered").length;

        setStats({
          pending,
          accepted,
          preparing,
          packaged,
          ready,
          delivered,
          total: list.length,
          active: accepted + preparing + packaged + ready,
        });
      }
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, setStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAccept = async (id) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/order-assignment/accept/${id}`,
        {},
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("Order accepted for production!");
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error accepting order");
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;
    try {
      const res = await axios.post(
        `${backendUrl}/api/order-assignment/reject/${selectedAssignmentId}`,
        { reason: rejectReason || "Out of capacity" },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.info("Order rejected. The engine will reallocate to next nearest hub.");
        setRejectModalOpen(false);
        setRejectReason("");
        setSelectedAssignmentId(null);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject order");
    }
  };

  const handleQuickStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `${backendUrl}/api/order-assignment/status/${id}`,
        { status },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(`Status updated to ${status}`);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  // Filter logic
  const filteredOrders = assignments.filter((item) => {
    // 1. Tab filter
    if (activeTab === "pending" && item.status !== "assigned") return false;
    if (
      activeTab === "production" &&
      item.status !== "accepted" &&
      item.status !== "preparing"
    )
      return false;
    if (
      activeTab === "ready" &&
      item.status !== "packaged" &&
      item.status !== "ready_for_pickup"
    )
      return false;
    if (
      activeTab === "completed" &&
      item.status !== "picked_up" &&
      item.status !== "in_transit" &&
      item.status !== "delivered"
    )
      return false;
    if (
      activeTab === "rejected" &&
      item.status !== "rejected" &&
      item.status !== "cancelled"
    )
      return false;

    // 2. Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const orderId = (item.order?.id || item.id).toLowerCase();
      const city = (item.order?.address?.city || item.order?.shippingAddress?.city || "").toLowerCase();
      const itemsStr = (item.order?.items || [])
        .map((i) => i.name || i.product?.name || "")
        .join(" ")
        .toLowerCase();
      return orderId.includes(term) || city.includes(term) || itemsStr.includes(term);
    }
    return true;
  });

  const tabCounts = {
    all: assignments.length,
    pending: assignments.filter((a) => a.status === "assigned").length,
    production: assignments.filter((a) => ["accepted", "preparing"].includes(a.status)).length,
    ready: assignments.filter((a) => ["packaged", "ready_for_pickup"].includes(a.status)).length,
    completed: assignments.filter((a) => ["picked_up", "in_transit", "delivered"].includes(a.status)).length,
    rejected: assignments.filter((a) => ["rejected", "cancelled"].includes(a.status)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Order Fulfillment Pipeline
          </h1>
          <p className="text-xs text-slate-500">
            Manage production, packaging, and dispatch for customer orders
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Pipeline
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: "all", label: "All Orders", count: tabCounts.all },
          { id: "pending", label: "Pending Acceptance", count: tabCounts.pending, alert: tabCounts.pending > 0 },
          { id: "production", label: "In Production / Packing", count: tabCounts.production },
          { id: "ready", label: "Packaged / Ready", count: tabCounts.ready },
          { id: "completed", label: "Shipped / Delivered", count: tabCounts.completed },
          { id: "rejected", label: "Rejected", count: tabCounts.rejected },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                activeTab === tab.id
                  ? "bg-slate-800 text-slate-200"
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
            placeholder="Search by order ID, city, or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No orders found in this view</p>
            <p className="text-xs text-slate-400 mt-1">
              Switch tabs or check back when new orders arrive.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Order ID &amp; Date</th>
                  <th className="py-3.5 px-4">Customer Destination</th>
                  <th className="py-3.5 px-4">Items Breakdown</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Assignment Status</th>
                  <th className="py-3.5 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((assignment) => {
                  const order = assignment.order;
                  const items = order?.items || [];
                  const totalQty = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-slate-900 block">
                          #{order?.id?.slice(-8) || assignment.id.slice(-8)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {order?.address?.city || order?.shippingAddress?.city || "Nepal"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {order?.address?.state || "Standard Delivery"}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-bold text-slate-900 block">
                          {totalQty} item{totalQty > 1 ? "s" : ""}
                        </span>
                        <div className="text-[11px] text-slate-600 truncate">
                          {items.map((i, idx) => (
                            <span key={idx}>
                              {i.name || i.product?.name} ({i.size}) x{i.quantity || 1}
                              {idx < items.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {currency}
                        {order?.amount?.toLocaleString() || 0}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {order?.paymentMethod || "COD"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={assignment.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {assignment.status === "assigned" && (
                            <>
                              <button
                                onClick={() => handleAccept(assignment.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAssignmentId(assignment.id);
                                  setRejectModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {assignment.status === "accepted" && (
                            <button
                              onClick={() => handleQuickStatus(assignment.id, "preparing")}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                            >
                              Start Production
                            </button>
                          )}

                          {assignment.status === "preparing" && (
                            <Link
                              to={`/orders/${assignment.id}`}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                            >
                              Package &amp; Ready
                            </Link>
                          )}

                          <Link
                            to={`/orders/${assignment.id}`}
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

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Decline Order Assignment
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please specify the reason for declining. The allocation engine will immediately route this order to the next closest qualified manufacturer hub.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Decline
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                >
                  <option value="">Select reason...</option>
                  <option value="Temporary Hub Capacity Limit">Temporary Hub Capacity Limit</option>
                  <option value="Fabric / Raw Material Delay">Fabric / Raw Material Delay</option>
                  <option value="Maintenance / Power Outage">Maintenance / Power Outage</option>
                  <option value="Other Operational Reason">Other Operational Reason</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
