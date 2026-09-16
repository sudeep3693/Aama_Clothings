import React from "react";

export const StatusBadge = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status?.toLowerCase()) {
      case "assigned":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500 animate-pulse",
          label: "New Order (Pending Acceptance)",
        };
      case "accepted":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          label: "Accepted",
        };
      case "preparing":
      case "in_production":
        return {
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          dot: "bg-indigo-500 animate-pulse",
          label: "In Production / Packing",
        };
      case "packed":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          dot: "bg-purple-500",
          label: "Packed",
        };
      case "ready_for_pickup":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500 animate-pulse",
          label: "Ready for Delivery Pickup",
        };
      case "picked_up":
        return {
          bg: "bg-teal-50 text-teal-700 border-teal-200",
          dot: "bg-teal-500",
          label: "Picked Up by Partner",
        };
      case "in_transit":
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200",
          dot: "bg-sky-500",
          label: "In Transit",
        };
      case "delivered":
        return {
          bg: "bg-green-50 text-green-700 border-green-200",
          dot: "bg-green-600",
          label: "Delivered",
        };
      case "rejected":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          label: "Rejected",
        };
      case "cancelled":
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          dot: "bg-slate-400",
          label: status || "Unknown",
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
