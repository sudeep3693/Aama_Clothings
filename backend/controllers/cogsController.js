import { prisma } from "../config/db.js";
import { postInboundShipmentAccounting } from "../services/accountingPostingEngine.js";

// Helper to get current Year-Month string e.g. "2026-09"
const getCurrentYearMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// Helper to parse categories
const parseCategories = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {}
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

// Get Full COGS Matrix & Live Profitability Overview
const getCOGSOverview = async (req, res) => {
  try {
    const requestedMonth = req.query.month || getCurrentYearMonth();

    // 1. Fetch products, monthly expense config, and inbound shipments
    const [products, monthlyExpenses, shipments] = await Promise.all([
      prisma.product.findMany({
        orderBy: { date: "desc" },
      }),
      prisma.monthlyExpense.findMany({
        orderBy: { yearMonth: "desc" },
      }),
      prisma.inboundShipment.findMany({
        orderBy: { shipmentDate: "desc" },
      }),
    ]);

    // 2. Resolve active monthly expense (or fallback to defaults)
    let activeExpense = monthlyExpenses.find((e) => e.yearMonth === requestedMonth);
    if (!activeExpense && monthlyExpenses.length > 0) {
      activeExpense = monthlyExpenses[0]; // latest available
    }

    const marketingSpend = activeExpense ? Number(activeExpense.marketingSpend || 0) : 0;
    const officeRent = activeExpense ? Number(activeExpense.officeRent || 0) : 0;
    const utilities = activeExpense ? Number(activeExpense.utilities || 0) : 0;
    const salaries = activeExpense ? Number(activeExpense.salaries || 0) : 0;
    const softwareTools = activeExpense ? Number(activeExpense.softwareTools || 0) : 0;
    const miscExpenses = activeExpense ? Number(activeExpense.miscExpenses || 0) : 0;
    const packagingCostPerUnit = activeExpense ? Number(activeExpense.packagingCostPerUnit || 20) : 20;
    const projectedUnits = Math.max(1, activeExpense ? Number(activeExpense.projectedMonthlyUnits || 300) : 300);

    // Calculated monthly per-unit overhead allocations
    const marketingPerUnit = Number((marketingSpend / projectedUnits).toFixed(2));
    const fixedOverheadTotal = officeRent + utilities + salaries + softwareTools + miscExpenses;
    const fixedOverheadPerUnit = Number((fixedOverheadTotal / projectedUnits).toFixed(2));
    const totalSharedOverheadPerUnit = Number((marketingPerUnit + fixedOverheadPerUnit + packagingCostPerUnit).toFixed(2));

    // 3. Build product-level latest inbound shipment transport allocation lookup
    const productTransportMap = {}; // { [productId]: { unitFreight, shipmentDate, carrier, batchNumber } }

    for (const shipment of shipments) {
      let shipmentItems = [];
      if (Array.isArray(shipment.items)) shipmentItems = shipment.items;
      else if (typeof shipment.items === "string") {
        try {
          shipmentItems = JSON.parse(shipment.items);
        } catch {
          shipmentItems = [];
        }
      }

      for (const item of shipmentItems) {
        const pId = item.productId || item.id;
        if (pId && !productTransportMap[pId]) {
          // Take the latest shipment where this product appeared
          productTransportMap[pId] = {
            unitFreight: Number(item.unitFreightCost || 0),
            shipmentDate: shipment.shipmentDate,
            carrier: shipment.carrier,
            batchNumber: shipment.batchNumber,
          };
        }
      }
    }

    // 4. Calculate full COGS & margin breakdown for each product
    let totalInvestedCOGS = 0;
    let totalMarginSum = 0;

    const vatRate = 0.13; // 13% Embedded VAT

    const analyzedProducts = products.map((prod) => {
      const price = Number(prod.price || 0);
      const discount = Number(prod.discount || 0);
      const effectivePrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;

      // 13% Embedded VAT Breakdown
      const taxableRevenue = Number((effectivePrice / (1 + vatRate)).toFixed(2));
      const vatAmount = Number((effectivePrice - taxableRevenue).toFixed(2));

      const baseCost = Number(prod.costPrice || 0);

      const transportInfo = productTransportMap[prod.id] || {
        unitFreight: 0,
        shipmentDate: null,
        carrier: "Unassigned",
        batchNumber: null,
      };

      const unitTransport = transportInfo.unitFreight;
      const trueCOGS = Number((baseCost + unitTransport + totalSharedOverheadPerUnit).toFixed(2));
      
      // True Net Profit = Taxable Revenue (Net of 13% VAT) - True COGS
      const netProfit = Number((taxableRevenue - trueCOGS).toFixed(2));
      const marginPercentage = taxableRevenue > 0 ? Number(((netProfit / taxableRevenue) * 100).toFixed(1)) : 0;
      const grossProfit = Number((taxableRevenue - baseCost).toFixed(2));
      const grossMarginPercentage = taxableRevenue > 0 ? Number(((grossProfit / taxableRevenue) * 100).toFixed(1)) : 0;

      // Break-even retail tag price (Inclusive of 13% VAT)
      const breakEvenPriceIncVat = Number((trueCOGS * (1 + vatRate)).toFixed(2));

      let health = "HEALTHY";
      if (marginPercentage >= 35) health = "HIGH_MARGIN";
      else if (marginPercentage >= 15) health = "HEALTHY";
      else if (marginPercentage >= 0) health = "LOW_MARGIN";
      else health = "LOSS_MAKING";

      totalInvestedCOGS += trueCOGS;
      totalMarginSum += marginPercentage;

      let images = [];
      if (Array.isArray(prod.image)) images = prod.image;
      else if (typeof prod.image === "string") {
        try {
          images = JSON.parse(prod.image);
        } catch {
          images = [prod.image];
        }
      }

      return {
        id: prod.id,
        _id: prod.id,
        name: prod.name,
        image: images,
        categories: parseCategories(prod.category),
        subCategory: prod.subCategory || "",
        stockQuantity: prod.stockQuantity || 0,
        published: prod.published,
        price,
        discount,
        effectivePrice, // Gross Selling Price (MRP)
        taxableRevenue, // Ex-VAT Base Revenue (Effective Price / 1.13)
        vatAmount, // 13% VAT portion
        vatRate: 13,
        baseCost,
        unitTransport,
        transportInfo,
        packagingCost: packagingCostPerUnit,
        marketingPerUnit,
        fixedOverheadPerUnit,
        totalSharedOverheadPerUnit,
        trueCOGS,
        netProfit,
        marginPercentage,
        grossProfit,
        grossMarginPercentage,
        breakEvenPrice: trueCOGS,
        breakEvenPriceIncVat,
        health,
      };
    });

    const productCount = analyzedProducts.length;
    const avgTrueCOGS = productCount > 0 ? Number((totalInvestedCOGS / productCount).toFixed(2)) : 0;
    const avgNetMargin = productCount > 0 ? Number((totalMarginSum / productCount).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        activeMonth: requestedMonth,
        activeExpense: activeExpense || {
          yearMonth: requestedMonth,
          marketingSpend: 0,
          officeRent: 0,
          utilities: 0,
          salaries: 0,
          softwareTools: 0,
          packagingCostPerUnit: 20,
          miscExpenses: 0,
          projectedMonthlyUnits: 300,
        },
        monthlyOverheadSummary: {
          marketingSpend,
          fixedOverheadTotal,
          projectedUnits,
          marketingPerUnit,
          fixedOverheadPerUnit,
          packagingCostPerUnit,
          totalSharedOverheadPerUnit,
        },
        kpis: {
          totalProducts: productCount,
          avgTrueCOGS,
          avgNetMargin,
          totalInboundBatches: shipments.length,
        },
        products: analyzedProducts,
        availableMonths: monthlyExpenses.map((m) => m.yearMonth),
      },
    });
  } catch (error) {
    console.error("COGS Overview Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Save / Upsert Monthly Overhead & Marketing Expense
const saveMonthlyExpense = async (req, res) => {
  try {
    const {
      yearMonth,
      marketingSpend,
      officeRent,
      utilities,
      salaries,
      softwareTools,
      packagingCostPerUnit,
      miscExpenses,
      projectedMonthlyUnits,
      notes,
    } = req.body;

    if (!yearMonth) {
      return res.json({ success: false, message: "Year-Month is required (e.g. 2026-09)" });
    }

    const dataPayload = {
      marketingSpend: Number(marketingSpend || 0),
      officeRent: Number(officeRent || 0),
      utilities: Number(utilities || 0),
      salaries: Number(salaries || 0),
      softwareTools: Number(softwareTools || 0),
      packagingCostPerUnit: Number(packagingCostPerUnit || 20),
      miscExpenses: Number(miscExpenses || 0),
      projectedMonthlyUnits: Math.max(1, Number(projectedMonthlyUnits || 300)),
      notes: notes || null,
    };

    const record = await prisma.monthlyExpense.upsert({
      where: { yearMonth },
      update: dataPayload,
      create: {
        yearMonth,
        ...dataPayload,
      },
    });

    res.json({ success: true, message: "Monthly expenses saved successfully", record });
  } catch (error) {
    console.error("Save Monthly Expense Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get All Monthly Expenses
const getMonthlyExpenses = async (req, res) => {
  try {
    const expenses = await prisma.monthlyExpense.findMany({
      orderBy: { yearMonth: "desc" },
    });
    res.json({ success: true, expenses });
  } catch (error) {
    console.error("Get Monthly Expenses Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Save / Upsert Inbound Transportation Batch & Inventory Sourcing
const saveInboundShipment = async (req, res) => {
  try {
    const {
      id,
      batchNumber,
      supplierName,
      invoiceNumber,
      carrier,
      shipmentDate,
      totalFreightCost,
      customsOrTaxes,
      totalItemsCost,
      settlementType = "CREDIT_PAYABLE", // FULL_CASH, CREDIT_PAYABLE, PARTIAL
      paidFromAccountId,
      upfrontPaidAmount,
      dueDate,
      notes,
      items,
    } = req.body;

    const parsedDate = shipmentDate ? new Date(shipmentDate) : new Date();
    const freight = Number(totalFreightCost || 0);
    const taxes = Number(customsOrTaxes || 0);
    const totalBatchTransport = freight + taxes;

    let parsedItems = Array.isArray(items) ? items : [];
    if (typeof items === "string") {
      try {
        parsedItems = JSON.parse(items);
      } catch {
        parsedItems = [];
      }
    }

    // Calculate total quantity of items in batch and items base cost
    let calculatedItemsCost = Number(totalItemsCost || 0);
    const totalBatchUnits = parsedItems.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0),
      0
    );

    if (calculatedItemsCost === 0) {
      for (const item of parsedItems) {
        const qty = Number(item.quantity || 1);
        const itemCost = Number(item.costPrice || item.unitCostPrice || item.unitPurchaseCost || 0);
        calculatedItemsCost += itemCost * qty;
      }
    }
    calculatedItemsCost = Number(calculatedItemsCost.toFixed(2));

    const totalLandedCost = Number((totalBatchTransport + calculatedItemsCost).toFixed(2));
    const finalSupplierName = (supplierName && supplierName.trim()) || (carrier && carrier.trim()) || "Supplier / Carrier";

    // Determine Settlement Breakdown (Cash vs Payable)
    let paidAmount = 0;
    let payableAmount = 0;
    let paymentStatus = "PAYABLE_UNPAID";

    if (settlementType === "FULL_CASH") {
      paidAmount = totalLandedCost;
      payableAmount = 0;
      paymentStatus = "PAID";
    } else if (settlementType === "PARTIAL") {
      paidAmount = Math.min(totalLandedCost, Math.max(0, Number(upfrontPaidAmount || 0)));
      payableAmount = Number((totalLandedCost - paidAmount).toFixed(2));
      paymentStatus = payableAmount === 0 ? "PAID" : "PARTIALLY_PAID";
    } else {
      // CREDIT_PAYABLE
      paidAmount = 0;
      payableAmount = totalLandedCost;
      paymentStatus = "PAYABLE_UNPAID";
    }

    // Capital Solvency Verification for any upfront cash payment
    let payingAccount = null;
    if (paidAmount > 0) {
      if (!paidFromAccountId) {
        return res.json({
          success: false,
          message: "Please select a Treasury / Bank account to disburse the upfront cash payment.",
        });
      }
      payingAccount = await prisma.financialAccount.findUnique({ where: { id: paidFromAccountId } });
      if (!payingAccount) {
        return res.json({ success: false, message: "Selected payment account not found" });
      }
      if (payingAccount.currentBalance < paidAmount) {
        return res.json({
          success: false,
          message: `Capital Solvency Constraint: Cannot pay Rs ${paidAmount.toLocaleString()} from ${payingAccount.accountName}. Available liquid balance is Rs ${payingAccount.currentBalance.toLocaleString()} (Shortfall: Rs ${(paidAmount - payingAccount.currentBalance).toLocaleString()}). You can record this shipment on full credit (Accounts Payable) or lower the upfront payment amount.`,
        });
      }
    }

    // Distribute freight evenly or by custom allocation
    const processedItems = parsedItems.map((item) => {
      const itemQty = Number(item.quantity || 1);
      const unitCost =
        item.unitFreightCost !== undefined && item.unitFreightCost !== "" && item.unitFreightCost !== null
          ? Number(item.unitFreightCost)
          : totalBatchUnits > 0
          ? Number((totalBatchTransport / totalBatchUnits).toFixed(2))
          : 0;

      return {
        productId: item.productId || item.id,
        productName: item.productName || item.name || "Product",
        quantity: itemQty,
        unitFreightCost: unitCost,
        totalItemFreight: Number((unitCost * itemQty).toFixed(2)),
      };
    });

    const generatedBatchNumber =
      batchNumber && batchNumber.trim()
        ? batchNumber.trim()
        : `BATCH-${Date.now().toString().slice(-6)}`;

    let savedRecord;
    let payableRecord = null;

    // 1. Create or Update InboundShipment
    const shipmentData = {
      batchNumber: generatedBatchNumber,
      supplierName: finalSupplierName,
      invoiceNumber: invoiceNumber ? invoiceNumber.trim() : "",
      carrier: carrier || "Local Freight",
      shipmentDate: parsedDate,
      totalFreightCost: freight,
      customsOrTaxes: taxes,
      totalItemsCost: calculatedItemsCost,
      totalLandedCost,
      paidFromAccountId: paidAmount > 0 ? paidFromAccountId : null,
      paidAmount,
      payableAmount,
      paymentStatus,
      notes: notes || null,
      items: processedItems,
    };

    if (id) {
      savedRecord = await prisma.inboundShipment.update({
        where: { id },
        data: shipmentData,
      });
    } else {
      savedRecord = await prisma.inboundShipment.create({
        data: shipmentData,
      });
    }

    // 2. If upfront cash was paid, atomically deduct from treasury & record CashTransaction
    if (paidAmount > 0 && payingAccount) {
      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: paidFromAccountId },
          data: { currentBalance: { decrement: paidAmount } },
        }),
        prisma.cashTransaction.create({
          data: {
            amount: paidAmount,
            type: "OUTFLOW",
            fromAccountId: paidFromAccountId,
            category: "SUPPLIER_PAYMENT",
            partyName: finalSupplierName,
            invoiceNumber: invoiceNumber || "",
            referenceId: savedRecord.id,
            description: `Upfront Payment for Inbound Batch ${generatedBatchNumber} to ${finalSupplierName}`,
          },
        }),
      ]);
    }

    // 3. If credit portion exists, create/link an AccountPayable record
    if (payableAmount > 0) {
      payableRecord = await prisma.accountPayable.create({
        data: {
          title: `Inbound Purchase Batch ${generatedBatchNumber} (${finalSupplierName})`,
          payeeName: finalSupplierName,
          category: "SUPPLIER_INVOICE",
          referenceType: "INBOUND_SHIPMENT",
          referenceId: savedRecord.id,
          totalAmount: payableAmount,
          paidAmount: 0,
          remainingBalance: payableAmount,
          dueDate: dueDate ? new Date(dueDate) : null,
          invoiceNumber: invoiceNumber || "",
          priority: "HIGH",
          status: "UNPAID",
          notes: `Supplier invoice payable for Inbound Batch ${generatedBatchNumber}. Total batch cost Rs ${totalLandedCost.toLocaleString()}, upfront paid Rs ${paidAmount.toLocaleString()}, unpaid balance Rs ${payableAmount.toLocaleString()}.`,
        },
      });

      // Update shipment with payable ID
      savedRecord = await prisma.inboundShipment.update({
        where: { id: savedRecord.id },
        data: { payableId: payableRecord.id },
      });
    }

    // 4. Post to Double-Entry General Ledger (Inventory / Input VAT / Bank & Accounts Payable split)
    postInboundShipmentAccounting({
      ...savedRecord,
      paidAmount,
      payableAmount,
      supplierName: finalSupplierName,
      totalItemsCost: calculatedItemsCost,
    }).catch((glErr) => {
      console.error("General Ledger inbound shipment posting error:", glErr);
    });

    res.json({
      success: true,
      message:
        paidAmount > 0 && payableAmount > 0
          ? `Inbound shipment recorded: Rs ${paidAmount.toLocaleString()} paid upfront from ${payingAccount?.accountName || "treasury"} and Rs ${payableAmount.toLocaleString()} registered under Accounts Payable to ${finalSupplierName}.`
          : paidAmount > 0
          ? `Inbound shipment fully paid (Rs ${paidAmount.toLocaleString()}) from ${payingAccount?.accountName || "treasury"}.`
          : `Inbound shipment registered under Accounts Payable (Rs ${payableAmount.toLocaleString()}) to ${finalSupplierName}.`,
      shipment: savedRecord,
      payable: payableRecord,
    });
  } catch (error) {
    console.error("Save Inbound Shipment Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get All Inbound Shipments
const getInboundShipments = async (req, res) => {
  try {
    const shipments = await prisma.inboundShipment.findMany({
      orderBy: { shipmentDate: "desc" },
    });
    res.json({ success: true, shipments });
  } catch (error) {
    console.error("Get Inbound Shipments Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Delete Inbound Shipment
const deleteInboundShipment = async (req, res) => {
  try {
    const { id } = req.body;
    await prisma.inboundShipment.delete({ where: { id } });
    res.json({ success: true, message: "Inbound shipment deleted" });
  } catch (error) {
    console.error("Delete Inbound Shipment Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Quick Update Base Supplier Cost Price from COGS Table
const updateProductCostPrice = async (req, res) => {
  try {
    const { productId, costPrice } = req.body;
    if (!productId) {
      return res.json({ success: false, message: "Product ID is required" });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { costPrice: Math.max(0, Number(costPrice || 0)) },
    });

    res.json({
      success: true,
      message: `Cost price updated for "${updated.name}"`,
      costPrice: updated.costPrice,
    });
  } catch (error) {
    console.error("Update Product Cost Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getCOGSOverview,
  saveMonthlyExpense,
  getMonthlyExpenses,
  saveInboundShipment,
  getInboundShipments,
  deleteInboundShipment,
  updateProductCostPrice,
};
