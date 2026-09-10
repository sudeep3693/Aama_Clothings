/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const CogsCalculator = ({ token }) => {
  const [activeTab, setActiveTab] = useState("matrix"); // 'matrix' | 'shipments' | 'overheads' | 'sandbox'
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [monthlyExpensesList, setMonthlyExpensesList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [healthFilter, setHealthFilter] = useState("ALL");

  // Inline Cost Price Editing
  const [editingCostId, setEditingCostId] = useState(null);
  const [tempCostValue, setTempCostValue] = useState("");
  const [savingCost, setSavingCost] = useState(false);

  // Shipment Batch Modal State
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [batchNumber, setBatchNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [carrier, setCarrier] = useState("Local Freight");
  const [shipmentDate, setShipmentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [totalFreightCost, setTotalFreightCost] = useState("");
  const [customsOrTaxes, setCustomsOrTaxes] = useState("");
  const [settlementType, setSettlementType] = useState("CREDIT_PAYABLE"); // 'FULL_CASH' | 'CREDIT_PAYABLE' | 'PARTIAL'
  const [paidFromAccountId, setPaidFromAccountId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [shipmentNotes, setShipmentNotes] = useState("");
  const [shipmentItems, setShipmentItems] = useState([]); // [{ productId, productName, quantity, unitFreightCost }]
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [productAddQty, setProductAddQty] = useState("50");
  const [isSavingShipment, setIsSavingShipment] = useState(false);

  // Monthly Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    yearMonth: "",
    marketingSpend: 0,
    officeRent: 0,
    utilities: 0,
    salaries: 0,
    softwareTools: 0,
    packagingCostPerUnit: 20,
    miscExpenses: 0,
    projectedMonthlyUnits: 300,
    notes: "",
  });
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Simulation Modal State (Product Specific)
  const [simProduct, setSimProduct] = useState(null);
  const [simTargetMargin, setSimTargetMargin] = useState(35);
  const [simExtraMarketing, setSimExtraMarketing] = useState(0);
  const [simCustomTransport, setSimCustomTransport] = useState(0);

  // Sandbox State (Tab 4)
  const [sandboxBaseCost, setSandboxBaseCost] = useState(800);
  const [sandboxTransport, setSandboxTransport] = useState(50);
  const [sandboxPackaging, setSandboxPackaging] = useState(25);
  const [sandboxMarketing, setSandboxMarketing] = useState(120);
  const [sandboxFixedOverhead, setSandboxFixedOverhead] = useState(80);
  const [sandboxTargetMargin, setSandboxTargetMargin] = useState(35);

  const fetchOverview = async (month) => {
    setLoading(true);
    try {
      const targetMonth = month || selectedMonth;
      const res = await axios.get(`${backendUrl}/api/cogs/overview?month=${targetMonth}`, {
        headers: { token },
      });
      if (res.data.success) {
        setOverviewData(res.data.data);
        if (res.data.data.activeExpense) {
          setExpenseForm({
            yearMonth: res.data.data.activeExpense.yearMonth || targetMonth,
            marketingSpend: res.data.data.activeExpense.marketingSpend || 0,
            officeRent: res.data.data.activeExpense.officeRent || 0,
            utilities: res.data.data.activeExpense.utilities || 0,
            salaries: res.data.data.activeExpense.salaries || 0,
            softwareTools: res.data.data.activeExpense.softwareTools || 0,
            packagingCostPerUnit: res.data.data.activeExpense.packagingCostPerUnit ?? 20,
            miscExpenses: res.data.data.activeExpense.miscExpenses || 0,
            projectedMonthlyUnits: res.data.data.activeExpense.projectedMonthlyUnits || 300,
            notes: res.data.data.activeExpense.notes || "",
          });
        }
      } else {
        toast.error(res.data.message || "Failed to load COGS overview");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to COGS service");
    } finally {
      setLoading(false);
    }
  };

  const fetchShipments = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/cogs/shipments`, {
        headers: { token },
      });
      if (res.data.success) {
        setShipments(res.data.shipments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonthlyExpenses = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/cogs/monthly-expenses`, {
        headers: { token },
      });
      if (res.data.success) {
        setMonthlyExpensesList(res.data.expenses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/finance/treasury-accounts`, {
        headers: { token },
      });
      if (res.data.success) {
        setAccounts(res.data.accounts || []);
        if (res.data.accounts?.length > 0 && !paidFromAccountId) {
          setPaidFromAccountId(res.data.accounts[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOverview(selectedMonth);
      fetchShipments();
      fetchMonthlyExpenses();
      fetchAccounts();
    }
  }, [token, selectedMonth]);

  // Handle Inline Base Cost Update
  const handleSaveCostPrice = async (productId) => {
    setSavingCost(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/cogs/update-cost-price`,
        { productId, costPrice: Number(tempCostValue) },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setEditingCostId(null);
        fetchOverview(selectedMonth);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to update cost price");
    } finally {
      setSavingCost(false);
    }
  };

  // Handle Save Monthly Expense
  const handleSaveMonthlyExpense = async (e) => {
    e.preventDefault();
    setIsSavingExpense(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/cogs/save-monthly-expense`,
        expenseForm,
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("Monthly expenses & overheads updated");
        fetchOverview(selectedMonth);
        fetchMonthlyExpenses();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to save monthly expenses");
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Add Item to Inbound Shipment Batch
  const handleAddItemToShipment = () => {
    if (!selectedProductToAdd) {
      toast.warning("Please select a product");
      return;
    }
    const foundProduct = overviewData?.products?.find((p) => p.id === selectedProductToAdd);
    if (!foundProduct) return;

    if (shipmentItems.some((item) => item.productId === selectedProductToAdd)) {
      toast.info("Product already added in this batch. Adjust quantity below.");
      return;
    }

    setShipmentItems((prev) => [
      ...prev,
      {
        productId: foundProduct.id,
        productName: foundProduct.name,
        quantity: Math.max(1, Number(productAddQty || 1)),
        unitFreightCost: "",
      },
    ]);
    setSelectedProductToAdd("");
    setProductAddQty("50");
  };

  // Remove Item from Shipment Batch
  const handleRemoveShipmentItem = (idx) => {
    setShipmentItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Inbound Shipment
  const handleSaveShipmentSubmit = async (e) => {
    e.preventDefault();
    if (shipmentItems.length === 0) {
      toast.warning("Please add at least one product to this shipment batch");
      return;
    }

    setIsSavingShipment(true);
    try {
      const payload = {
        batchNumber,
        supplierName,
        invoiceNumber,
        carrier,
        shipmentDate,
        totalFreightCost: Number(totalFreightCost || 0),
        customsOrTaxes: Number(customsOrTaxes || 0),
        settlementType,
        paidFromAccountId: settlementType !== "CREDIT_PAYABLE" ? paidFromAccountId : null,
        paidAmount: settlementType === "PARTIAL" ? Number(paidAmount || 0) : null,
        notes: shipmentNotes,
        items: shipmentItems,
      };

      const res = await axios.post(`${backendUrl}/api/cogs/save-shipment`, payload, {
        headers: { token },
      });

      if (res.data.success) {
        toast.success(res.data.message || "Inbound shipment recorded & freight allocated");
        setShowShipmentModal(false);
        setBatchNumber("");
        setSupplierName("");
        setInvoiceNumber("");
        setTotalFreightCost("");
        setCustomsOrTaxes("");
        setPaidAmount("");
        setSettlementType("CREDIT_PAYABLE");
        setShipmentNotes("");
        setShipmentItems([]);
        fetchShipments();
        fetchOverview(selectedMonth);
        fetchAccounts();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record shipment");
    } finally {
      setIsSavingShipment(false);
    }
  };

  // Delete Inbound Shipment
  const handleDeleteShipment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shipment record?")) return;
    try {
      const res = await axios.post(
        `${backendUrl}/api/cogs/delete-shipment`,
        { id },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchShipments();
        fetchOverview(selectedMonth);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to delete shipment");
    }
  };

  // Open Simulator for specific product
  const openSimulatorModal = (prod) => {
    setSimProduct(prod);
    setSimTargetMargin(35);
    setSimExtraMarketing(0);
    setSimCustomTransport(prod.unitTransport || 0);
  };

  // Filtered Products for Matrix
  const filteredProducts = (overviewData?.products || []).filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categories?.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.subCategory?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesHealth = true;
    if (healthFilter !== "ALL") {
      matchesHealth = p.health === healthFilter;
    }

    return matchesSearch && matchesHealth;
  });

  const getHealthBadge = (health, margin) => {
    switch (health) {
      case "HIGH_MARGIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            High Margin ({margin}%)
          </span>
        );
      case "HEALTHY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Healthy ({margin}%)
          </span>
        );
      case "LOW_MARGIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Low Margin ({margin}%)
          </span>
        );
      case "LOSS_MAKING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            Loss Making ({margin}%)
          </span>
        );
      default:
        return null;
    }
  };

  // Sandbox Live Calculations (with 13% Embedded VAT)
  const sandboxTrueCOGS =
    Number(sandboxBaseCost || 0) +
    Number(sandboxTransport || 0) +
    Number(sandboxPackaging || 0) +
    Number(sandboxMarketing || 0) +
    Number(sandboxFixedOverhead || 0);

  // Required Ex-VAT Revenue to achieve Target Net Margin %
  const sandboxTaxableRevenue =
    sandboxTargetMargin < 100
      ? Number((sandboxTrueCOGS / (1 - sandboxTargetMargin / 100)).toFixed(2))
      : 0;

  // Recommended Retail Tag Price (with 13% VAT embedded)
  const sandboxRecPrice = Number((sandboxTaxableRevenue * 1.13).toFixed(2));
  const sandboxVatAmount = Number((sandboxRecPrice - sandboxTaxableRevenue).toFixed(2));
  const sandboxProfit = Number((sandboxTaxableRevenue - sandboxTrueCOGS).toFixed(2));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              COGS &amp; True Landed Cost Calculator
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculate the true landed cost per unit (supplier price + batch freight + packaging + ad spend + office overhead) and 13% embedded VAT.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
            <span className="text-xs text-slate-400 pl-2">Period:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:ring-0 p-1 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200/80">
        {[
          { id: "matrix", label: "Profitability Matrix", desc: "Live COGS & Margins" },
          { id: "shipments", label: "Inbound Freight Batches", desc: "Consignments & Dates" },
          { id: "overheads", label: "Monthly Overheads & Ad Spend", desc: "Shared Cost Allocation" },
          { id: "sandbox", label: "Pricing Sandbox Simulator", desc: "Launch Planning" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap text-left ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <div>{tab.label}</div>
          </button>
        ))}
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Avg True Landed COGS</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {currency} {overviewData?.kpis?.avgTrueCOGS?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-slate-400">Per unit avg</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Avg Net Margin</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold font-mono ${
                (overviewData?.kpis?.avgNetMargin || 0) >= 20 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {overviewData?.kpis?.avgNetMargin || 0}%
            </span>
            <span className="text-xs text-emerald-600 font-medium">Catalog avg</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Marketing / Unit</span>
            <span className="p-1.5 bg-pink-50 text-pink-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {currency} {overviewData?.monthlyOverheadSummary?.marketingPerUnit || 0}
            </span>
            <span className="text-xs text-slate-400">Ad spend load</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Fixed Overhead / Unit</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {currency} {overviewData?.monthlyOverheadSummary?.fixedOverheadPerUnit || 0}
            </span>
            <span className="text-xs text-slate-400">Rent &amp; staff load</span>
          </div>
        </div>
      </div>

      {/* TAB 1: PRODUCT COGS MATRIX */}
      {activeTab === "matrix" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by product name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            </div>

            {/* Health Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Items" },
                { id: "HIGH_MARGIN", label: "High Margin (≥35%)" },
                { id: "HEALTHY", label: "Healthy (15-35%)" },
                { id: "LOW_MARGIN", label: "Low Margin (0-15%)" },
                { id: "LOSS_MAKING", label: "Loss Making (<0%)" },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHealthFilter(h.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    healthFilter === h.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Matrix Table */}
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Calculating COGS matrix...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No products found matching filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 border-collapse">
                <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3 text-right">Retail Tag (Inc. 13% VAT)</th>
                    <th className="py-3 px-3 text-right">Ex-VAT Revenue</th>
                    <th className="py-3 px-3 text-right">13% VAT</th>
                    <th className="py-3 px-3 text-right">Base Cost</th>
                    <th className="py-3 px-3 text-right">Freight</th>
                    <th className="py-3 px-3 text-right">Overhead+Ads</th>
                    <th className="py-3 px-3 text-right">True COGS</th>
                    <th className="py-3 px-3 text-right">Net Profit</th>
                    <th className="py-3 px-4 text-center">Margin Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const isEditing = editingCostId === p.id;
                    const imgUrl = Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : "";

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Product Info */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-center gap-3">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-gray-400 truncate">
                                  {p.categories?.join(", ") || "General"}
                                </span>
                                {p.discount > 0 && (
                                  <span className="text-[10px] text-rose-600 bg-rose-50 px-1 rounded font-bold">
                                    -{p.discount}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Retail Tag Price (VAT Inclusive) */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="font-semibold text-gray-900 font-mono">
                            {currency}{p.effectivePrice}
                          </span>
                          {p.discount > 0 && (
                            <div className="line-through text-[11px] text-gray-400">
                              {currency}{p.price}
                            </div>
                          )}
                        </td>

                        {/* Ex-VAT Taxable Base Revenue */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-blue-900 font-medium whitespace-nowrap">
                          {currency}{p.taxableRevenue}
                        </td>

                        {/* 13% VAT Portion */}
                        <td className="py-3 px-3 text-right font-mono text-[11px] text-gray-400 whitespace-nowrap">
                          {currency}{p.vatAmount}
                        </td>

                        {/* Base Supplier Cost (Inline Editable) */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={tempCostValue}
                                onChange={(e) => setTempCostValue(e.target.value)}
                                className="w-16 px-1.5 py-0.5 text-right border border-emerald-500 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveCostPrice(p.id)}
                                disabled={savingCost}
                                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-1"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingCostId(null)}
                                className="text-gray-400 hover:text-gray-600 text-xs px-1"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingCostId(p.id);
                                setTempCostValue(p.baseCost);
                              }}
                              className="cursor-pointer group flex items-center justify-end gap-1"
                              title="Click to edit supplier cost"
                            >
                              <span className={`font-mono text-xs ${p.baseCost === 0 ? "text-amber-500 italic" : "text-gray-700"}`}>
                                {p.baseCost === 0 ? "Set Cost" : `${currency}${p.baseCost}`}
                              </span>
                              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400">✎</span>
                            </div>
                          )}
                        </td>

                        {/* Inbound Transport */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-gray-600 whitespace-nowrap">
                          <span title={p.transportInfo?.shipmentDate ? `Shipment: ${new Date(p.transportInfo.shipmentDate).toLocaleDateString()} (${p.transportInfo.carrier})` : "Unassigned transport"}>
                            {currency}{p.unitTransport}
                          </span>
                        </td>

                        {/* Marketing + Overhead + Packaging */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-gray-600 whitespace-nowrap">
                          {currency}{(p.marketingPerUnit + p.fixedOverheadPerUnit + p.packagingCost).toFixed(2)}
                        </td>

                        {/* Total True COGS */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="font-bold font-mono text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {currency}{p.trueCOGS}
                          </span>
                        </td>

                        {/* Net Profit per Unit (Ex-VAT Revenue - True COGS) */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span
                            className={`font-bold font-mono text-xs ${
                              p.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {p.netProfit >= 0 ? `+${currency}${p.netProfit}` : `-${currency}${Math.abs(p.netProfit)}`}
                          </span>
                        </td>

                        {/* Health Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getHealthBadge(p.health, p.marginPercentage)}
                        </td>

                        {/* Action: Simulate */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openSimulatorModal(p)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
                          >
                            Simulate
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
      )}

      {/* TAB 2: INBOUND SHIPMENTS */}
      {activeTab === "shipments" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Inbound Transportation Batches</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Log shipment arrivals with dates and carrier freight costs. The freight is automatically distributed per product unit.
              </p>
            </div>
            <button
              onClick={() => {
                setBatchNumber(`BATCH-${Date.now().toString().slice(-6)}`);
                setShowShipmentModal(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start"
            >
              <span>+</span> Log Inbound Shipment
            </button>
          </div>

          {shipments.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No inbound transport shipments recorded yet. Click &quot;+ Log Inbound Shipment&quot; to add your first batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 border-collapse">
                <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Carrier</th>
                    <th className="py-3 px-4 text-right">Total Freight</th>
                    <th className="py-3 px-4 text-right">Customs/Taxes</th>
                    <th className="py-3 px-4 text-center">Units Transported</th>
                    <th className="py-3 px-4">Allocated Items</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shipments.map((s) => {
                    let items = [];
                    if (Array.isArray(s.items)) items = s.items;
                    else if (typeof s.items === "string") {
                      try {
                        items = JSON.parse(s.items);
                      } catch {
                        items = [];
                      }
                    }

                    const totalUnits = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                          {new Date(s.shipmentDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-gray-900 text-xs">{s.batchNumber}</td>
                        <td className="py-3 px-4 text-xs text-gray-700">{s.carrier}</td>
                        <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-gray-900">
                          {currency}{s.totalFreightCost}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-gray-500">
                          {currency}{s.customsOrTaxes}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs font-bold text-gray-800">
                          {totalUnits}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {items.map((it, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px] text-gray-700"
                              >
                                {it.productName}: <strong>{it.quantity} units</strong> ({currency}{it.unitFreightCost}/ea)
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteShipment(s.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                          >
                            Delete
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
      )}

      {/* TAB 3: MONTHLY OVERHEAD & MARKETING SETTINGS */}
      {activeTab === "overheads" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Monthly Operating Expenses &amp; Ad Spend</h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure your monthly overheads and marketing budget. The system divides these expenses across your monthly unit volume to determine the exact overhead per product.
            </p>
          </div>

          <form onSubmit={handleSaveMonthlyExpense} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Year Month */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Month (YYYY-MM)</label>
                <input
                  type="month"
                  value={expenseForm.yearMonth}
                  onChange={(e) => setExpenseForm({ ...expenseForm, yearMonth: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              {/* Projected Monthly Units */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expected Monthly Unit Sales Volume
                </label>
                <input
                  type="number"
                  min="1"
                  value={expenseForm.projectedMonthlyUnits}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, projectedMonthlyUnits: Number(e.target.value) })
                  }
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
                <span className="text-[11px] text-gray-400">Total units sold/handled this month</span>
              </div>

              {/* Marketing Ad Spend */}
              <div>
                <label className="block text-xs font-semibold text-pink-700 mb-1">
                  Monthly Marketing &amp; Ad Spend ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={expenseForm.marketingSpend}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, marketingSpend: Number(e.target.value) })
                  }
                  className="w-full p-2.5 border border-pink-300 bg-pink-50/20 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500 font-mono"
                />
                <span className="text-[11px] text-pink-600 font-medium">Meta, Google, TikTok Ads &amp; PR</span>
              </div>

              {/* Office Rent */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Office / Warehouse Rent ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={expenseForm.officeRent}
                  onChange={(e) => setExpenseForm({ ...expenseForm, officeRent: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Utilities */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Utilities &amp; Internet ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={expenseForm.utilities}
                  onChange={(e) => setExpenseForm({ ...expenseForm, utilities: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Salaries */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Staff / Admin Salaries ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={expenseForm.salaries}
                  onChange={(e) => setExpenseForm({ ...expenseForm, salaries: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Software & Tools */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Software, Domain &amp; Tools ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={expenseForm.softwareTools}
                  onChange={(e) => setExpenseForm({ ...expenseForm, softwareTools: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Packaging Cost per Unit */}
              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Packaging Cost Per Unit ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={expenseForm.packagingCostPerUnit}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, packagingCostPerUnit: Number(e.target.value) })
                  }
                  className="w-full p-2.5 border border-amber-300 bg-amber-50/20 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 font-mono"
                />
                <span className="text-[11px] text-amber-700">Boxes, poly-bags, tags, tissue wrap</span>
              </div>

              {/* Misc */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Miscellaneous Expenses ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={expenseForm.miscExpenses}
                  onChange={(e) => setExpenseForm({ ...expenseForm, miscExpenses: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Live Calculated Allocation Box */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">
                Live Resulting Overhead Breakdown per Unit
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Marketing / Unit:</span>
                  <div className="font-bold text-emerald-900 font-mono text-sm mt-0.5">
                    {currency}
                    {(
                      Number(expenseForm.marketingSpend || 0) /
                      Math.max(1, Number(expenseForm.projectedMonthlyUnits || 1))
                    ).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Fixed Overhead / Unit:</span>
                  <div className="font-bold text-emerald-900 font-mono text-sm mt-0.5">
                    {currency}
                    {(
                      (Number(expenseForm.officeRent || 0) +
                        Number(expenseForm.utilities || 0) +
                        Number(expenseForm.salaries || 0) +
                        Number(expenseForm.softwareTools || 0) +
                        Number(expenseForm.miscExpenses || 0)) /
                      Math.max(1, Number(expenseForm.projectedMonthlyUnits || 1))
                    ).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Packaging / Unit:</span>
                  <div className="font-bold text-emerald-900 font-mono text-sm mt-0.5">
                    {currency}{expenseForm.packagingCostPerUnit || 0}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Total Shared Overhead / Unit:</span>
                  <div className="font-bold text-emerald-950 font-mono text-base mt-0.5">
                    {currency}
                    {(
                      (Number(expenseForm.marketingSpend || 0) +
                        Number(expenseForm.officeRent || 0) +
                        Number(expenseForm.utilities || 0) +
                        Number(expenseForm.salaries || 0) +
                        Number(expenseForm.softwareTools || 0) +
                        Number(expenseForm.miscExpenses || 0)) /
                        Math.max(1, Number(expenseForm.projectedMonthlyUnits || 1)) +
                      Number(expenseForm.packagingCostPerUnit || 0)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingExpense}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isSavingExpense ? "Saving..." : "Save Monthly Expenses"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: WHAT-IF PRICING SANDBOX */}
      {activeTab === "sandbox" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">What-If Product Launch Simulator</h2>
            <p className="text-xs text-gray-500 mt-1">
              Simulate new clothing items before ordering from suppliers. Enter your projected costs to calculate the break-even threshold and recommended retail price at target margins.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Base Supplier Cost ({currency})
                  </label>
                  <input
                    type="number"
                    value={sandboxBaseCost}
                    onChange={(e) => setSandboxBaseCost(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Inbound Transport / Unit ({currency})
                  </label>
                  <input
                    type="number"
                    value={sandboxTransport}
                    onChange={(e) => setSandboxTransport(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Packaging ({currency})</label>
                  <input
                    type="number"
                    value={sandboxPackaging}
                    onChange={(e) => setSandboxPackaging(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-700 mb-1">Ad Spend / Unit ({currency})</label>
                  <input
                    type="number"
                    value={sandboxMarketing}
                    onChange={(e) => setSandboxMarketing(Number(e.target.value))}
                    className="w-full p-2.5 border border-pink-300 bg-pink-50/20 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fixed Overhead ({currency})</label>
                  <input
                    type="number"
                    value={sandboxFixedOverhead}
                    onChange={(e) => setSandboxFixedOverhead(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">Target Net Profit Margin</label>
                  <span className="text-xs font-bold text-emerald-600 font-mono">{sandboxTargetMargin}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="70"
                  step="1"
                  value={sandboxTargetMargin}
                  onChange={(e) => setSandboxTargetMargin(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>5% (Thin)</span>
                  <span>35% (Healthy)</span>
                  <span>70% (Luxury)</span>
                </div>
              </div>
            </div>

            {/* Results Output Box */}
            <div className="lg:col-span-6 bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pricing Output</span>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500">True Invested COGS</span>
                    <div className="text-xl font-bold text-gray-900 font-mono mt-1">
                      {currency}{sandboxTrueCOGS.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-rose-600 font-medium">Break-even threshold</span>
                  </div>

                  <div className="bg-emerald-600 p-3.5 rounded-xl text-white shadow-sm">
                    <span className="text-xs text-emerald-100">Recommended Retail Price</span>
                    <div className="text-2xl font-bold font-mono mt-1">
                      {currency}{sandboxRecPrice.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-200">For {sandboxTargetMargin}% net margin</span>
                  </div>
                </div>
              </div>

              {/* Profit & VAT Breakdown */}
              <div className="space-y-2 text-xs border-t border-gray-200 pt-3">
                <div className="flex justify-between text-gray-600">
                  <span>Ex-VAT Base Revenue:</span>
                  <span className="font-bold text-gray-900 font-mono">{currency}{sandboxTaxableRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Embedded 13% VAT (Payable to Govt):</span>
                  <span className="font-bold text-amber-700 font-mono">{currency}{sandboxVatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Net Business Profit (Revenue - COGS):</span>
                  <span className="font-bold text-emerald-700 font-mono">{currency}{sandboxProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOG INBOUND SHIPMENT MODAL */}
      {showShipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Log Inbound Shipment Batch</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record freight expenses for a new batch of stock arriving at your warehouse.
                </p>
              </div>
              <button
                onClick={() => setShowShipmentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            {/* Inbound Shipment Form */}
            {(() => {
              const itemsCost = shipmentItems.reduce((acc, it) => {
                const prod = overviewData?.products?.find((p) => p.id === it.productId);
                const cost = prod ? Number(prod.costPrice || 0) : 0;
                return acc + cost * Number(it.quantity || 0);
              }, 0);
              const landedCost = Number(totalFreightCost || 0) + Number(customsOrTaxes || 0);
              const totalInboundValue = itemsCost + landedCost;

              const activeAccount = accounts.find((a) => a.id === paidFromAccountId);
              const requiredUpfront = settlementType === "FULL_CASH" 
                ? totalInboundValue 
                : settlementType === "PARTIAL" 
                  ? Number(paidAmount || 0) 
                  : 0;
              const remainingPayable = Math.max(0, totalInboundValue - requiredUpfront);
              const isInsufficientFunds = (settlementType === "FULL_CASH" || settlementType === "PARTIAL") && activeAccount && Number(activeAccount.currentBalance || 0) < requiredUpfront;

              return (
                <form onSubmit={handleSaveShipmentSubmit} className="space-y-4 text-sm">
                  {/* Supplier & Invoice */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">
                        Supplier / Purchased From <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kathmandu Textile Mills Ltd"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold focus:border-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier Invoice / Ref #</label>
                      <input
                        type="text"
                        placeholder="e.g. KTM-INV-8890"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Identifier</label>
                      <input
                        type="text"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Shipment Arrival Date</label>
                      <input
                        type="date"
                        value={shipmentDate}
                        onChange={(e) => setShipmentDate(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Carrier / Transporter</label>
                      <input
                        type="text"
                        placeholder="e.g. Local Cargo"
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Total Freight Cost ({currency})</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={totalFreightCost}
                        onChange={(e) => setTotalFreightCost(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Customs / Toll ({currency})</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={customsOrTaxes}
                        onChange={(e) => setCustomsOrTaxes(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Products in Batch Selector */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-3">
                    <span className="text-xs font-bold text-gray-800">Add Products in this Shipment</span>
                    <div className="flex gap-2">
                      <select
                        value={selectedProductToAdd}
                        onChange={(e) => setSelectedProductToAdd(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-xs bg-white"
                      >
                        <option value="">Select a product...</option>
                        {overviewData?.products?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Base Cost: {currency}{Number(p.costPrice || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={productAddQty}
                        onChange={(e) => setProductAddQty(e.target.value)}
                        className="w-20 p-2 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddItemToShipment}
                        className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Items List */}
                    {shipmentItems.length > 0 && (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {shipmentItems.map((it, idx) => {
                          const prod = overviewData?.products?.find((p) => p.id === it.productId);
                          const unitCost = prod ? Number(prod.costPrice || 0) : 0;
                          const lineCost = unitCost * Number(it.quantity || 0);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 text-xs shadow-2xs"
                            >
                              <div>
                                <span className="font-semibold text-gray-800">{it.productName}</span>
                                <div className="text-[10px] text-gray-500">
                                  {it.quantity} units × {currency}{unitCost.toLocaleString()} = {currency}{lineCost.toLocaleString()}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveShipmentItem(idx)}
                                className="text-rose-600 hover:text-rose-800 font-bold p-1"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SETTLEMENT & CAPITAL SOLVENCY SECTION */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Payment &amp; Solvency Settlement
                      </span>
                      <span className="text-xs font-black text-slate-900 font-mono">
                        Total Value: {currency}{totalInboundValue.toLocaleString()}
                      </span>
                    </div>

                    {/* Settlement Type Selector */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSettlementType("CREDIT_PAYABLE")}
                        className={`p-2 rounded-lg text-xs font-bold border text-center transition-all ${
                          settlementType === "CREDIT_PAYABLE"
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        📄 100% Credit (Payable)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettlementType("PARTIAL")}
                        className={`p-2 rounded-lg text-xs font-bold border text-center transition-all ${
                          settlementType === "PARTIAL"
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        ⚖️ Partial Payment Split
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettlementType("FULL_CASH")}
                        className={`p-2 rounded-lg text-xs font-bold border text-center transition-all ${
                          settlementType === "FULL_CASH"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        💵 100% Upfront Cash
                      </button>
                    </div>

                    {/* Account and Amount inputs for Cash / Partial */}
                    {settlementType !== "CREDIT_PAYABLE" && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Disbursement Account (Liquid)
                          </label>
                          <select
                            value={paidFromAccountId}
                            onChange={(e) => setPaidFromAccountId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                            required
                          >
                            <option value="">Select Treasury Account...</option>
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.accountName} ({currency}{Number(a.currentBalance || 0).toLocaleString()} available)
                              </option>
                            ))}
                          </select>
                        </div>

                        {settlementType === "PARTIAL" ? (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Upfront Cash Amount ({currency}) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={totalInboundValue || 999999999}
                              placeholder="e.g. 100000"
                              value={paidAmount}
                              onChange={(e) => setPaidAmount(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                              required
                            />
                          </div>
                        ) : (
                          <div className="flex items-end pb-1">
                            <span className="text-xs text-slate-600">
                              Full amount <strong className="text-slate-900">{currency}{totalInboundValue.toLocaleString()}</strong> will be disbursed immediately.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Solvency Warning or Split Breakdown */}
                    {isInsufficientFunds && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
                        <span>⚠️ Insufficient liquid funds in selected account! Available: {currency}{Number(activeAccount?.currentBalance || 0).toLocaleString()}, required: {currency}{requiredUpfront.toLocaleString()}. Please choose 100% Credit or reduce upfront payment.</span>
                      </div>
                    )}

                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Inventory Items Cost:</span>
                        <span className="font-mono font-bold">{currency}{itemsCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Freight &amp; Landed Costs:</span>
                        <span className="font-mono font-bold">{currency}{landedCost.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-slate-100 pt-1 flex justify-between font-bold text-slate-900">
                        <span>Paid Upfront via Liquid Bank:</span>
                        <span className="font-mono text-emerald-700">{currency}{requiredUpfront.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Recorded as Accounts Payable to Supplier:</span>
                        <span className="font-mono text-amber-700">{currency}{remainingPayable.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Dashain festive shipment arrived via truck"
                      value={shipmentNotes}
                      onChange={(e) => setShipmentNotes(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowShipmentModal(false)}
                      className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingShipment || isInsufficientFunds}
                      className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                    >
                      {isSavingShipment ? "Saving..." : "Record Inbound Shipment"}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* INDIVIDUAL PRODUCT SIMULATOR MODAL */}
      {simProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Price &amp; Margin Simulator</h3>
                <p className="text-xs text-gray-500 mt-0.5">{simProduct.name}</p>
              </div>
              <button
                onClick={() => setSimProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500">Current Selling Price:</span>
                  <div className="font-bold text-gray-900 font-mono text-sm mt-0.5">
                    {currency}{simProduct.effectivePrice}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Current True COGS:</span>
                  <div className="font-bold text-gray-900 font-mono text-sm mt-0.5">
                    {currency}{simProduct.trueCOGS}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-gray-700">Target Net Margin %</label>
                  <span className="font-bold text-emerald-600 font-mono">{simTargetMargin}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={simTargetMargin}
                  onChange={(e) => setSimTargetMargin(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* Recommended Price Result */}
              {(() => {
                const targetTaxableRevenue =
                  simTargetMargin < 100
                    ? Number((simProduct.trueCOGS / (1 - simTargetMargin / 100)).toFixed(2))
                    : 0;
                const targetTagPrice = Number((targetTaxableRevenue * 1.13).toFixed(2));
                const targetVat = Number((targetTagPrice - targetTaxableRevenue).toFixed(2));
                const profitDiff = Number((targetTaxableRevenue - simProduct.trueCOGS).toFixed(2));

                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                    <span className="text-emerald-800 font-semibold uppercase tracking-wider text-[11px]">
                      Recommended Tag Price (Inc. 13% VAT) for {simTargetMargin}% Net Margin
                    </span>
                    <div className="text-3xl font-extrabold text-emerald-950 font-mono">
                      {currency}{targetTagPrice.toLocaleString()}
                    </div>
                    <div className="text-gray-600 text-xs flex justify-around border-t border-emerald-200/60 pt-2 mt-2">
                      <span>Ex-VAT Base: <strong>{currency}{targetTaxableRevenue.toFixed(2)}</strong></span>
                      <span>13% VAT: <strong>{currency}{targetVat.toFixed(2)}</strong></span>
                      <span className="text-emerald-700 font-semibold">Net Profit: <strong>{currency}{profitDiff.toFixed(2)}</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSimProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CogsCalculator;
