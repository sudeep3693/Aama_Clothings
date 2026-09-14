import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Navigation,
  DollarSign,
  UserCheck,
  Package,
} from "lucide-react";
import { useDelivery } from "../context/DeliveryContext";

const Sidebar = () => {
  const { jobStats } = useDelivery();

  const navLinkStyle = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? "bg-blue-600 text-white shadow-sm font-semibold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <aside className="w-64 shrink-0 min-h-[calc(100vh-65px)] bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between select-none">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Courier Logistics
          </p>
          <nav className="space-y-1.5">
            <NavLink to="/" className={navLinkStyle} end>
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </div>
            </NavLink>

            <NavLink to="/jobs" className={navLinkStyle}>
              <div className="flex items-center gap-3">
                <Navigation className="w-4 h-4" />
                <span>Delivery Tasks</span>
              </div>
              {jobStats.assigned > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-bounce">
                  {jobStats.assigned}
                </span>
              )}
            </NavLink>

            <NavLink to="/earnings" className={navLinkStyle}>
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4" />
                <span>COD &amp; Earnings</span>
              </div>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* System Indicator */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <div className="text-[11px] leading-tight">
            <p className="font-semibold text-slate-700">Delivery Fleet Hub</p>
            <p className="text-[10px] text-slate-400">Aama Regional Logistics</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
