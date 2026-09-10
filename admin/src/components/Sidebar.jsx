/* eslint-disable no-unused-vars */
import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const navLinkStyle = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
      isActive
        ? "bg-slate-900 text-white shadow-xs font-semibold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
    }`;

  const iconStyle = (isActive) =>
    `w-4 h-4 transition-transform duration-150 ${
      isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"
    }`;

  return (
    <aside className="w-64 shrink-0 min-h-[calc(100vh-65px)] bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between select-none">
      <div className="space-y-6">
        {/* SECTION 1: CATALOG & MERCHANDISING */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Catalog &amp; Products
          </p>
          <nav className="space-y-1">
            <NavLink to="/list" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>All Products</span>
                </>
              )}
            </NavLink>

            <NavLink to="/add" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Product</span>
                </>
              )}
            </NavLink>

            <NavLink to="/categories" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Categories &amp; Types</span>
                </>
              )}
            </NavLink>

            <NavLink to="/special-offers" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Festive Campaigns</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* SECTION 2: SALES & FULFILLMENT */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Sales &amp; Orders
          </p>
          <nav className="space-y-1">
            <NavLink to="/orders" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Customer Orders</span>
                </>
              )}
            </NavLink>

            <NavLink to="/create-order" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Create Direct Order</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* SECTION 3: FINANCE & ACCOUNTING */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Finance &amp; Accounting
          </p>
          <nav className="space-y-1">
            <NavLink to="/finance" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Financial Dashboard</span>
                </>
              )}
            </NavLink>

            <NavLink to="/treasury" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Liquid Cash &amp; Banks</span>
                </>
              )}
            </NavLink>

            <NavLink to="/assets" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Assets &amp; Depreciation</span>
                </>
              )}
            </NavLink>

            <NavLink to="/partners" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Partners &amp; Investors</span>
                </>
              )}
            </NavLink>

            <NavLink to="/tax" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>13% VAT &amp; Tax Strategy</span>
                </>
              )}
            </NavLink>

            <NavLink to="/returns" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                  <span>Returns &amp; Debit Notes</span>
                </>
              )}
            </NavLink>

            <NavLink to="/payables" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Payables &amp; Receivables</span>
                </>
              )}
            </NavLink>

            <NavLink to="/statements" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Financial Statements</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* SECTION 4: OPERATIONS & LOGISTICS */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Operations &amp; Logistics
          </p>
          <nav className="space-y-1">
            <NavLink to="/inventory" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>Inventory &amp; Stock</span>
                </>
              )}
            </NavLink>

            <NavLink to="/cogs" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>COGS &amp; Landed Costs</span>
                </>
              )}
            </NavLink>

            <NavLink to="/shipping" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                  </svg>
                  <span>Shipping Rates</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>


        {/* SECTION 4: CUSTOMERS & RELATIONSHIPS */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Customers &amp; Loyalty
          </p>
          <nav className="space-y-1">
            <NavLink to="/customers" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Customer Profiles</span>
                </>
              )}
            </NavLink>

            <NavLink to="/loyalty-levels" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>VIP Loyalty Tiers</span>
                </>
              )}
            </NavLink>

            <NavLink to="/reviews" className={navLinkStyle}>
              {({ isActive }) => (
                <>
                  <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>Reviews &amp; Ratings</span>
                </>
              )}
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        {/* Admin Settings */}
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Admin Settings
          </p>
          <NavLink to="/change-password" className={navLinkStyle}>
            {({ isActive }) => (
              <>
                <svg className={iconStyle(isActive)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Change Password</span>
              </>
            )}
          </NavLink>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <div className="text-[11px] leading-tight">
            <p className="font-semibold text-slate-700">Aama Store Active</p>
            <p className="text-[10px] text-slate-400">v2.4 Management</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
