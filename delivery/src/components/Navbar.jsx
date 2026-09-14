import React from "react";
import { useDelivery } from "../context/DeliveryContext";
import { LogOut, Truck, Bike, MapPin, CheckCircle2, ShieldCheck } from "lucide-react";

const Navbar = () => {
  const { partner, toggleAvailability, logout } = useDelivery();

  if (!partner) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      {/* Left: Driver / Partner Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
          {partner.vehicleType === "BIKE" ? <Bike className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {partner.name}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
              <ShieldCheck className="w-3 h-3" />
              Verified Partner ({partner.vehicleType || "BIKE"})
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-600" />
              {partner.city} Region
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              {partner.totalDeliveries || 0} Delivered
            </span>
          </div>
        </div>
      </div>

      {/* Right: Availability Toggle + User Actions */}
      <div className="flex items-center gap-3">
        {/* Availability Toggle */}
        <button
          onClick={toggleAvailability}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
            partner.isAvailable
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
          }`}
          title="Toggle accepting new delivery pickup tasks"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              partner.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span className="hidden md:inline">
            {partner.isAvailable ? "Online (Accepting Runs)" : "Off Duty (Paused)"}
          </span>
          <span className="md:hidden">
            {partner.isAvailable ? "Online" : "Paused"}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
