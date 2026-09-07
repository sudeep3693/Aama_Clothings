/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import ShippingLabelModal from "../components/ShippingLabelModal";

const ORDER_STATUSES = [
  "All",
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal print states: supports single order or batch of orders
  const [printOrdersList, setPrintOrdersList] = useState(null);

  // Selected orders for checkbox bulk operations
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());

  const fetchAllOrders = async () => {
    if (!token) {
      toast.error("Token is missing. Please log in.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        // Enforce newest orders at top (sorted by date descending)
        const sorted = (response.data.orders || []).sort(
          (a, b) => Number(b.date) - Number(a.date)
        );
        setOrders(sorted);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const statusHandler = async (event, orderId) => {
    const newStatus = event.target.value;
    try {
      const response = await axios.post(
        backendUrl + "/api/order/status",
        { orderId, status: newStatus },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(`Order status updated to "${newStatus}"`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data.message || error.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  // Real-time status counts
  const statusCounts = useMemo(() => {
    const counts = { All: orders.length };
    ORDER_STATUSES.slice(1).forEach((status) => {
      counts[status] = orders.filter((o) => o.status === status).length;
    });
    return counts;
  }, [orders]);

  // All "Order Placed" new orders
  const newOrders = useMemo(() => {
    return orders.filter((o) => o.status === "Order Placed");
  }, [orders]);

  // Filtered orders based on selected tab and search term
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (selectedStatus !== "All" && order.status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = (order.address?.firstName || "")
          .concat(" ")
          .concat(order.address?.lastName || "")
          .toLowerCase();
        const phone = (order.address?.phone || "").toLowerCase();
        const city = (order.address?.city || "").toLowerCase();
        const landmark = (order.address?.landmark || "").toLowerCase();
        const orderId = (order._id || "").toLowerCase();

        return (
          fullName.includes(query) ||
          phone.includes(query) ||
          city.includes(query) ||
          landmark.includes(query) ||
          orderId.includes(query)
        );
      }

      return true;
    });
  }, [orders, selectedStatus, searchQuery]);

  // Toggle order checkbox selection
  const toggleSelectOrder = (id) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select/Deselect all in current filtered view
  const toggleSelectAllFiltered = () => {
    if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o._id)));
    }
  };

  // Batch Print handler for all new orders
  const handlePrintAllNewOrders = () => {
    if (newOrders.length === 0) {
      toast.info("No new orders currently waiting for dispatch.");
      return;
    }
    setPrintOrdersList(newOrders);
  };

  // Batch Print handler for selected orders
  const handlePrintSelectedOrders = () => {
    const selectedList = orders.filter((o) => selectedOrderIds.has(o._id));
    if (selectedList.length === 0) {
      toast.info("Please select at least one order to print.");
      return;
    }
    setPrintOrdersList(selectedList);
  };

  // Status color styles helper
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Order Placed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Packing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Shipped":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Out for delivery":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="pb-16">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Order Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage store orders, status transitions, and batch-print 4x6" courier dispatch slips.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* PRIMARY BATCH PRINT BUTTON FOR ALL NEW ORDERS */}
          <button
            type="button"
            onClick={handlePrintAllNewOrders}
            disabled={newOrders.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
              newOrders.length > 0
                ? "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 ring-2 ring-indigo-200"
                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            }`}
            title="Batch print 4x6 shipping labels for all new orders"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print All New Orders ({newOrders.length})</span>
          </button>

          <button
            onClick={fetchAllOrders}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-xs transition-all"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Highlight Banner if viewing or have pending new orders */}
      {newOrders.length > 0 && (
        <div className="mb-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
              {newOrders.length}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 leading-snug">
                {newOrders.length} New {newOrders.length === 1 ? "Order" : "Orders"} Ready For Courier Dispatch
              </h4>
              <p className="text-xs text-gray-600">
                You can print all {newOrders.length} shipping labels formatted in 4x6" thermal format with a single click.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrintAllNewOrders}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Print All {newOrders.length} Slips Now (4x6)</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Filter Tabs by Order Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-2.5 mb-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {ORDER_STATUSES.map((status) => {
            const isActive = selectedStatus === status;
            const count = statusCounts[status] || 0;
            const isNewTab = status === "Order Placed";

            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60"
                }`}
              >
                {isNewTab && count > 0 && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
                <span>{status === "All" ? "All Orders" : status}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Multi-Select Action Bar within Filters */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-lg">
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by customer name, phone, city, landmark, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
            {/* Checkbox select all toggle */}
            {filteredOrders.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="text-gray-600 hover:text-gray-900 font-semibold text-xs flex items-center gap-1.5"
              >
                <input
                  type="checkbox"
                  checked={
                    selectedOrderIds.size === filteredOrders.length &&
                    filteredOrders.length > 0
                  }
                  onChange={toggleSelectAllFiltered}
                  className="rounded text-indigo-600 cursor-pointer"
                />
                <span>Select All ({filteredOrders.length})</span>
              </button>
            )}

            {/* Print Selected Action Button */}
            {selectedOrderIds.size > 0 && (
              <button
                type="button"
                onClick={handlePrintSelectedOrders}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Selected ({selectedOrderIds.size})</span>
              </button>
            )}

            <div className="text-gray-500 whitespace-nowrap">
              Showing <strong className="text-gray-800">{filteredOrders.length}</strong> of {orders.length}
            </div>
          </div>
        </div>
      </div>

      {/* Orders List / Empty State */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-semibold text-gray-700">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <img
            src={assets.parcel_icon}
            alt="No orders"
            className="w-12 h-12 mx-auto opacity-40 mb-3"
          />
          <h3 className="text-base font-bold text-gray-700">No orders found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No orders match your search criteria. Try a different keyword or reset filters."
              : `There are currently no orders under "${selectedStatus}".`}
          </p>
          {(selectedStatus !== "All" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus("All");
                setSearchQuery("");
              }}
              className="mt-3 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            // Customer full name rule: firstName.concat(" ").concat(lastName)
            const customerFullName = (order.address?.firstName || "")
              .concat(" ")
              .concat(order.address?.lastName || "")
              .trim();

            const isNewOrder = order.status === "Order Placed";
            const isSelected = selectedOrderIds.has(order._id);
            const orderDateStr = new Date(order.date).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order._id || index}
                className={`bg-white rounded-xl border transition-all shadow-xs hover:shadow-md ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : isNewOrder
                    ? "border-blue-300 ring-1 ring-blue-100"
                    : "border-gray-200"
                }`}
              >
                {/* Order Card Top Bar */}
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    {/* Checkbox for batch select */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(order._id)}
                      className="rounded text-indigo-600 cursor-pointer w-4 h-4"
                      title="Select for batch print"
                    />

                    {isNewOrder && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-md uppercase tracking-wider animate-pulse">
                        NEW ORDER
                      </span>
                    )}
                    <span className="font-mono font-bold text-gray-900">
                      ID: #{order._id?.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{orderDateStr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Individual 4x6 Courier Print Button */}
                    <button
                      type="button"
                      onClick={() => setPrintOrdersList([order])}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-xs font-semibold shadow-2xs hover:border-indigo-300 transition-all"
                      title="Print 4x6 Courier Shipping Label"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Courier Slip (4x6)
                    </button>

                    {/* Status Pill Indicator */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Main Order Content */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                  {/* Column 1: Items List (md: 5 cols) */}
                  <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        className="w-6 h-6 opacity-70"
                        src={assets.parcel_icon}
                        alt="Parcel"
                      />
                      <span className="font-bold text-gray-800 uppercase text-[11px] tracking-wide">
                        Order Items ({order.items?.length || 0})
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80 border border-gray-100"
                        >
                          <div className="flex items-center gap-2.5">
                            {item.image && item.image[0] ? (
                              <img
                                src={item.image[0]}
                                alt={item.name}
                                className="w-9 h-9 object-cover rounded border border-gray-200"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-500">
                                Item
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-800 line-clamp-1">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <span>
                                  Qty:{" "}
                                  <strong className="text-gray-700">
                                    {item.quantity}
                                  </strong>
                                </span>
                                {item.size && (
                                  <span className="bg-white border border-gray-200 px-1 py-0.2 rounded text-[10px] font-semibold text-gray-700">
                                    {item.size}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="bg-white border border-gray-200 px-1 py-0.2 rounded text-[10px] font-medium text-gray-600">
                                    {item.color}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <p className="font-bold text-gray-800">
                              {currency} {((item.purchasedUnitPrice || item.price || 0) * (item.quantity || 1))}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {item.quantity} x {currency}{item.purchasedUnitPrice || item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Delivery & Customer Address (md: 4 cols) */}
                  <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="font-bold text-gray-800 uppercase text-[11px] tracking-wide">
                        Recipient & Destination
                      </span>
                    </div>

                    <div className="space-y-1 text-gray-700">
                      <p className="font-extrabold text-gray-900 text-sm">
                        {customerFullName}
                      </p>
                      <p className="font-semibold text-indigo-700 flex items-center gap-1">
                        <span>📞</span> {order.address?.phone}
                      </p>
                      {order.address?.email && (
                        <p className="text-gray-500 text-[11px]">
                          ✉️ {order.address.email}
                        </p>
                      )}
                      <p className="text-gray-700 pt-1">
                        {order.address?.street}
                      </p>

                      {/* Prominently highlight nearest landmark */}
                      {order.address?.landmark && (
                        <div className="my-1.5 p-1.5 bg-yellow-50/80 border border-yellow-300 rounded text-yellow-900 text-[11px] font-medium flex items-start gap-1">
                          <span className="text-xs">📍</span>
                          <div>
                            <span className="font-bold">Landmark: </span>
                            {order.address.landmark}
                          </div>
                        </div>
                      )}

                      <p className="text-gray-600 font-medium">
                        {order.address?.city}, {order.address?.state}
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        {order.address?.country || "Nepal"}{" "}
                        {order.address?.zipcode
                          ? `(${order.address.zipcode})`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Column 3: Payment & Status Controls (md: 3 cols) */}
                  <div className="md:col-span-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-bold text-gray-800 uppercase text-[11px] tracking-wide">
                          Payment & Total
                        </span>
                      </div>

                      {(() => {
                        const itemsSubtotal = (order.items || []).reduce(
                          (acc, it) => acc + (Number(it.purchasedUnitPrice ?? it.price ?? 0) * Number(it.quantity || 1)),
                          0
                        );
                        const deliveryFee = Math.max(0, Math.round(Number(order.amount || 0) - itemsSubtotal));

                        return (
                          <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                            <div className="flex justify-between items-center text-gray-600">
                              <span>Items Subtotal:</span>
                              <span className="font-semibold text-gray-800">{currency} {itemsSubtotal}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600">
                              <span>Delivery Fee:</span>
                              <span className="font-semibold text-gray-800">
                                {deliveryFee > 0 ? `${currency} ${deliveryFee}` : "FREE"}
                              </span>
                            </div>
                            <div className="pt-1.5 border-t border-gray-200 flex justify-between items-center">
                              <span className="font-bold text-gray-900">Total:</span>
                              <span className="text-base font-extrabold text-indigo-700">
                                {currency} {order.amount}
                              </span>
                            </div>
                            <div className="pt-1 border-t border-gray-100 flex justify-between items-center text-[11px]">
                              <span className="text-gray-500">Method:</span>
                              <span className="font-bold text-gray-800">
                                {order.paymentMethod}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-gray-500">Payment:</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  order.payment
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {order.payment ? "Done" : "Pending (COD)"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Status Select Dropdown */}
                    <div className="mt-4">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Update Order Status:
                      </label>
                      <select
                        onChange={(event) => statusHandler(event, order._id)}
                        value={order.status}
                        className="w-full p-2 bg-white border border-gray-300 font-semibold text-xs rounded-lg shadow-2xs focus:border-indigo-500"
                      >
                        <option value="Order Placed">Order Placed</option>
                        <option value="Packing">Packing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for delivery">Out for delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4x6 Inch Courier Shipping Label Modal (Supports single or batch print of all new orders) */}
      {printOrdersList && (
        <ShippingLabelModal
          orders={printOrdersList}
          currency={currency}
          onClose={() => setPrintOrdersList(null)}
        />
      )}
    </div>
  );
};

export default Orders;
