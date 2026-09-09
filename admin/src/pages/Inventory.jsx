/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const Inventory = ({ token }) => {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory"); // 'inventory' | 'logs'
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'low' | 'out' | 'in'
  const [searchQuery, setSearchQuery] = useState("");

  // Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustReason, setAdjustReason] = useState("restock");
  const [adjustSource, setAdjustSource] = useState("admin");
  const [adjustNote, setAdjustNote] = useState("");
  const [variantAdjustments, setVariantAdjustments] = useState({}); // { index: qtyChange }
  const [simpleQtyChange, setSimpleQtyChange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, logRes] = await Promise.all([
        axios.get(`${backendUrl}/api/product/list`, { headers: { token } }),
        axios.get(`${backendUrl}/api/product/stock-logs?limit=50`, { headers: { token } }),
      ]);

      if (prodRes.data.success) {
        setProducts(prodRes.data.products || []);
      }
      if (logRes.data.success) {
        setLogs(logRes.data.logs || []);
      }
    } catch (error) {
      console.error("Error loading inventory data:", error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Calculated Stats
  const totalProducts = products.length;
  const totalUnits = products.reduce((acc, p) => acc + (Number(p.stockQuantity) || 0), 0);
  const lowStockCount = products.filter(
    (p) => (Number(p.stockQuantity) || 0) <= (Number(p.lowStockThreshold) || 5) && (Number(p.stockQuantity) || 0) > 0
  ).length;
  const outOfStockCount = products.filter((p) => (Number(p.stockQuantity) || 0) === 0).length;

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const qty = Number(p.stockQuantity) || 0;
    const threshold = Number(p.lowStockThreshold) || 5;

    let matchesStatus = true;
    if (filterStatus === "low") matchesStatus = qty <= threshold && qty > 0;
    else if (filterStatus === "out") matchesStatus = qty === 0;
    else if (filterStatus === "in") matchesStatus = qty > threshold;

    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  // Open adjustment modal for a product
  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustReason("restock");
    setAdjustSource("admin");
    setAdjustNote("");
    setSimpleQtyChange("");

    let initialVariantMap = {};
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((v, idx) => {
        initialVariantMap[idx] = 0;
      });
    }
    setVariantAdjustments(initialVariantMap);
  };

  const closeAdjustModal = () => {
    setSelectedProduct(null);
  };

  const handleVariantQtyChange = (idx, value) => {
    setVariantAdjustments((prev) => ({
      ...prev,
      [idx]: Number(value) || 0,
    }));
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      let payload = {
        productId: selectedProduct._id || selectedProduct.id,
        reason: adjustReason,
        source: adjustSource,
        note: adjustNote,
        adjustments: [],
      };

      const hasVariants = Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0;

      if (hasVariants) {
        payload.adjustments = selectedProduct.variants.map((v, idx) => ({
          size: v.size,
          color: v.color,
          quantity: variantAdjustments[idx] || 0,
        }));
      } else {
        payload.adjustments = [
          {
            quantity: Number(simpleQtyChange) || 0,
          },
        ];
      }

      const response = await axios.post(
        `${backendUrl}/api/product/adjust-stock`,
        payload,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Stock updated successfully");
        closeAdjustModal();
        fetchData();
      } else {
        toast.error(response.data.message || "Failed to adjust stock");
      }
    } catch (error) {
      console.error("Stock adjust error:", error);
      toast.error(error.response?.data?.message || "Server error while adjusting stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonBadge = (reason) => {
    switch (reason) {
      case "restock":
        return <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 font-medium">Restock</span>;
      case "order_sale":
        return <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-medium">Order Sale</span>;
      case "return":
        return <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 font-medium">Return</span>;
      case "correction":
        return <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 font-medium">Correction</span>;
      case "damage":
        return <span className="px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-800 font-medium">Damage / Loss</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800 font-medium">{reason}</span>;
    }
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case "website":
        return <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">Website</span>;
      case "instagram":
        return <span className="px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-700 border border-pink-200">Instagram</span>;
      case "facebook":
        return <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">Facebook</span>;
      case "tiktok":
        return <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800 border border-slate-300">TikTok</span>;
      case "phone":
        return <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200">Phone Order</span>;
      case "walk_in":
        return <span className="px-2 py-0.5 rounded text-xs bg-teal-50 text-teal-700 border border-teal-200">Walk-in</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-200">Admin</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track product stock levels, set low-stock thresholds, and log stock movements across all sales channels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "inventory"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            Stock Overview
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "logs"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            Audit Logs ({logs.length})
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total SKUs</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalProducts}</span>
            <span className="text-xs text-slate-500">Products listed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Units in Stock</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalUnits.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-medium">Available</span>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider">
            <span>Low Stock Alert</span>
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-900">{lowStockCount}</span>
            <button
              onClick={() => {
                setActiveTab("inventory");
                setFilterStatus("low");
              }}
              className="text-xs text-amber-700 font-medium underline hover:text-amber-900"
            >
              View Items
            </button>
          </div>
        </div>

        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold uppercase tracking-wider">
            <span>Out of Stock</span>
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-900">{outOfStockCount}</span>
            <button
              onClick={() => {
                setActiveTab("inventory");
                setFilterStatus("out");
              }}
              className="text-xs text-rose-700 font-medium underline hover:text-rose-900"
            >
              View Items
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "inventory" ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "All Items" },
                { id: "low", label: `Low Stock (${lowStockCount})`, badgeClass: "bg-amber-100 text-amber-800" },
                { id: "out", label: `Out of Stock (${outOfStockCount})`, badgeClass: "bg-rose-100 text-rose-800" },
                { id: "in", label: "In Stock" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    filterStatus === f.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Loading inventory list...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No products found matching filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 border-collapse">
                <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Categories</th>
                    <th className="py-3 px-4">Variant Breakdown</th>
                    <th className="py-3 px-4 text-center">Threshold</th>
                    <th className="py-3 px-4 text-center">Total Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => {
                    const totalQty = Number(product.stockQuantity) || 0;
                    const threshold = Number(product.lowStockThreshold) || 5;

                    const isOut = totalQty === 0;
                    const isLow = !isOut && totalQty <= threshold;

                    const variants = Array.isArray(product.variants) ? product.variants : [];
                    const imgUrl = Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : "";

                    return (
                      <tr
                        key={product._id || product.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isOut ? "bg-rose-50/30" : isLow ? "bg-amber-50/30" : ""
                        }`}
                      >
                        {/* Product Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0">
                                No img
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 hover:text-rose-600 transition-colors">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {currency} {product.price}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {product.category || "Uncategorized"}
                          {product.subCategory && (
                            <span className="block text-gray-400 text-[11px] mt-0.5">{product.subCategory}</span>
                          )}
                        </td>

                        {/* Variant Breakdown */}
                        <td className="py-3 px-4">
                          {variants.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {variants.map((v, i) => {
                                const vQty = Number(v.quantity) || 0;
                                return (
                                  <span
                                    key={i}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                      vQty === 0
                                        ? "bg-rose-50 border-rose-200 text-rose-700"
                                        : vQty <= threshold
                                        ? "bg-amber-50 border-amber-200 text-amber-800"
                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {v.size}/{v.color}: <strong>{vQty}</strong>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-mono">Standard Product</span>
                          )}
                        </td>

                        {/* Low Stock Threshold */}
                        <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">
                          {threshold}
                        </td>

                        {/* Total Stock */}
                        <td className="py-3 px-4 text-center">
                          <span className={`font-bold font-mono text-sm ${isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-gray-900"}`}>
                            {totalQty}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openAdjustModal(product)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-rose-600 transition-colors shadow-sm"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Audit Logs Tab */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Stock Audit Trail</h2>
            <button
              onClick={fetchData}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
            >
              🔄 Refresh Logs
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Loading stock logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No stock adjustment logs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 border-collapse">
                <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Variant</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Channel Source</th>
                    <th className="py-3 px-4 text-center">Stock Change</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    const isPositive = log.changeQty > 0;
                    const logDate = new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap font-mono">{logDate}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{log.productName}</td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {log.variantLabel ? (
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono text-[11px]">
                              {log.variantLabel}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-mono text-[11px]">General</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{getReasonBadge(log.reason)}</td>
                        <td className="py-3 px-4">{getSourceBadge(log.source)}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="text-xs text-gray-400 mr-2">
                            {log.previousQty} ➔ {log.newQty}
                          </span>
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isPositive ? `+${log.changeQty}` : log.changeQty}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">{log.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Adjust Stock</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedProduct.name}</p>
              </div>
              <button
                onClick={closeAdjustModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-sm">
              {/* Reason & Source */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Adjustment</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-slate-900 focus:border-slate-900"
                  >
                    <option value="restock">Restock (Supplier Arrival)</option>
                    <option value="order_sale">Order Sale (Manual)</option>
                    <option value="return">Customer Return</option>
                    <option value="correction">Stock Audit Correction</option>
                    <option value="damage">Damage / Loss Write-off</option>
                    <option value="other">Other Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Channel Source</label>
                  <select
                    value={adjustSource}
                    onChange={(e) => setAdjustSource(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-slate-900 focus:border-slate-900"
                  >
                    <option value="admin">Admin Direct</option>
                    <option value="instagram">Instagram DM</option>
                    <option value="facebook">Facebook Messenger</option>
                    <option value="tiktok">TikTok Shop / DM</option>
                    <option value="phone">Phone / Viber Order</option>
                    <option value="walk_in">Store Walk-in</option>
                    <option value="website">Website Online</option>
                  </select>
                </div>
              </div>

              {/* Variant / Quantity Inputs */}
              {Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 ? (
                <div className="space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Enter Quantity Adjustment per Variant (+ to add stock, - to deduct stock)
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedProduct.variants.map((v, idx) => {
                      const currentVal = variantAdjustments[idx] !== undefined ? variantAdjustments[idx] : 0;
                      const newCalc = (Number(v.quantity) || 0) + Number(currentVal);
                      return (
                        <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-gray-200">
                          <div>
                            <span className="font-semibold text-gray-900 text-xs">{v.size} / {v.color}</span>
                            <span className="text-xs text-gray-500 ml-2">(Current: {v.quantity})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="+/- 0"
                              value={currentVal === 0 ? "" : currentVal}
                              onChange={(e) => handleVariantQtyChange(idx, e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-xs focus:ring-rose-500 focus:border-rose-500"
                            />
                            <span className="text-xs font-mono font-medium text-gray-600 w-12 text-right">
                              ➔ {newCalc < 0 ? 0 : newCalc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stock Change (+ for restock, - for deduction)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="e.g. +10 or -2"
                      value={simpleQtyChange}
                      onChange={(e) => setSimpleQtyChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-rose-500 focus:border-rose-500"
                    />
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      Current: <strong>{selectedProduct.stockQuantity || 0}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Note / Audit details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment #402 / Instagram sale for customer Sam"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={closeAdjustModal}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
