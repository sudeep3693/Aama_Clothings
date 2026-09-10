import { prisma } from "../config/db.js";

// Helper to get current Year-Month
const getCurrentYearMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// ==========================================
// 1. EXECUTIVE FINANCIAL ANALYTICS & DASHBOARD
// ==========================================
export const getFinancialAnalyticsDashboard = async (req, res) => {
  try {
    const requestedMonth = req.query.month || getCurrentYearMonth();
    const [year, month] = requestedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const startTimestamp = BigInt(startDate.getTime());
    const endTimestamp = BigInt(endDate.getTime());

    // Fetch all financial data in parallel
    const [
      orders,
      products,
      monthlyExpense,
      accounts,
      fixedAssets,
      partners,
      liabilities,
      customerReturns,
      supplierReturns,
      payables,
      receivables,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          date: { gte: startTimestamp, lte: endTimestamp },
          status: { notIn: ["Cancelled"] },
        },
      }),
      prisma.product.findMany(),
      prisma.monthlyExpense.findUnique({ where: { yearMonth: requestedMonth } }),
      prisma.financialAccount.findMany({ where: { status: "ACTIVE" } }),
      prisma.fixedAsset.findMany(),
      prisma.partnerEquity.findMany({ where: { status: "ACTIVE" } }),
      prisma.investorLiability.findMany({ where: { status: "ACTIVE" } }),
      prisma.customerReturn.findMany({
        where: {
          returnDate: { gte: startDate, lte: endDate },
          refundStatus: "COMPLETED",
        },
      }),
      prisma.supplierReturn.findMany({
        where: {
          returnDate: { gte: startDate, lte: endDate },
          status: "COMPLETED",
        },
      }),
      prisma.accountPayable.findMany({
        where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
      }),
      prisma.accountReceivable.findMany({
        where: { status: { in: ["UNPAID", "PARTIALLY_RECEIVED"] } },
      }),
    ]);

    // Revenue calculations (Gross MRP, VAT Breakdown)
    const vatRate = 0.13; // 13% Nepal VAT
    let grossPeriodRevenueIncVat = 0;
    let periodDirectCOGS = 0;
    let unitsSoldPeriod = 0;

    // Build Product Cost lookup
    const productCostMap = {};
    products.forEach((p) => {
      productCostMap[p.id] = Number(p.costPrice || 0);
    });

    orders.forEach((ord) => {
      grossPeriodRevenueIncVat += Number(ord.amount || 0);
      let items = [];
      try {
        items = typeof ord.items === "string" ? JSON.parse(ord.items) : (ord.items || []);
      } catch {
        items = [];
      }
      items.forEach((item) => {
        const qty = Number(item.quantity || 1);
        unitsSoldPeriod += qty;
        const pId = item.productId || item._id || item.id;
        const unitCost = productCostMap[pId] || 0;
        periodDirectCOGS += unitCost * qty;
      });
    });

    // Customer Returns adjustments in period
    const totalCustomerRefunds = customerReturns.reduce((acc, r) => acc + Number(r.totalRefundAmount || 0), 0);
    const netRevenueIncVat = Math.max(0, grossPeriodRevenueIncVat - totalCustomerRefunds);
    
    // Net Taxable Revenue (Net of 13% embedded VAT)
    const taxableRevenue = Number((netRevenueIncVat / (1 + vatRate)).toFixed(2));
    const outputVatCollected = Number((netRevenueIncVat - taxableRevenue).toFixed(2));

    // Operating Overheads
    const marketingSpend = monthlyExpense ? Number(monthlyExpense.marketingSpend || 0) : 0;
    const officeRent = monthlyExpense ? Number(monthlyExpense.officeRent || 0) : 0;
    const utilities = monthlyExpense ? Number(monthlyExpense.utilities || 0) : 0;
    const salaries = monthlyExpense ? Number(monthlyExpense.salaries || 0) : 0;
    const softwareTools = monthlyExpense ? Number(monthlyExpense.softwareTools || 0) : 0;
    const miscExpenses = monthlyExpense ? Number(monthlyExpense.miscExpenses || 0) : 0;
    const packagingCostPerUnit = monthlyExpense ? Number(monthlyExpense.packagingCostPerUnit || 20) : 20;
    const totalPackagingExpense = Number((packagingCostPerUnit * unitsSoldPeriod).toFixed(2));

    const totalFixedOverheads = officeRent + utilities + salaries + softwareTools + miscExpenses;
    const totalVariableCosts = periodDirectCOGS + marketingSpend + totalPackagingExpense;
    const totalOperatingExpenses = totalFixedOverheads + marketingSpend + totalPackagingExpense;

    // Monthly Asset Depreciation
    let monthlyDepreciation = 0;
    let damagedAssetLoss = 0;
    fixedAssets.forEach((asset) => {
      if (asset.status === "ACTIVE") {
        const annualRate = Number(asset.depreciationRate || 25) / 100;
        const monthlyRate = annualRate / 12;
        const bookVal = Number(asset.currentBookValue || asset.purchaseCost || 0);
        monthlyDepreciation += Number((bookVal * monthlyRate).toFixed(2));
      } else if (asset.status === "DAMAGED" || asset.status === "WRITTEN_OFF") {
        damagedAssetLoss += Number(asset.scrapLossAmount || asset.currentBookValue || 0);
      }
    });

    // Profitability Metrics
    const grossProfit = Number((taxableRevenue - periodDirectCOGS).toFixed(2));
    const grossProfitMargin = taxableRevenue > 0 ? Number(((grossProfit / taxableRevenue) * 100).toFixed(1)) : 0;
    
    const operatingProfitEBITDA = Number((grossProfit - totalOperatingExpenses).toFixed(2));
    const netProfitBeforeTax = Number((operatingProfitEBITDA - monthlyDepreciation - damagedAssetLoss).toFixed(2));
    const netProfitMargin = taxableRevenue > 0 ? Number(((netProfitBeforeTax / taxableRevenue) * 100).toFixed(1)) : 0;

    // Break-even Analysis (BEP)
    const totalContributionMargin = Math.max(0, taxableRevenue - totalVariableCosts);
    const contributionMarginRatio = taxableRevenue > 0 ? (totalContributionMargin / taxableRevenue) : 0.4;
    const breakEvenRevenue = contributionMarginRatio > 0 ? Number((totalFixedOverheads / contributionMarginRatio).toFixed(2)) : 0;
    const avgRevenuePerUnit = unitsSoldPeriod > 0 ? (taxableRevenue / unitsSoldPeriod) : 1000;
    const avgVariableCostPerUnit = unitsSoldPeriod > 0 ? (totalVariableCosts / unitsSoldPeriod) : 600;
    const unitContributionMargin = Math.max(1, avgRevenuePerUnit - avgVariableCostPerUnit);
    const breakEvenUnits = Math.ceil(totalFixedOverheads / unitContributionMargin);

    // Live Assets & Liquid Cash Aggregates
    const totalLiquidCash = accounts.reduce((acc, a) => acc + Number(a.currentBalance || 0), 0);
    const totalFixedAssetBookValue = fixedAssets
      .filter((a) => a.status === "ACTIVE")
      .reduce((acc, a) => acc + Number(a.currentBookValue || 0), 0);
    
    // Inventory Valuation at Cost Price
    const inventoryValuationCost = products.reduce((acc, p) => acc + (Number(p.costPrice || 0) * Number(p.stockQuantity || 0)), 0);

    // Outstanding Accounts Receivable (Money owed to business)
    const totalOutstandingReceivables = receivables.reduce((acc, r) => acc + Number(r.remainingBalance || 0), 0);

    // Total Live Assets = Liquid Cash + Accounts Receivable + Inventory + Net Fixed Assets
    const totalLiveAssets = Number((totalLiquidCash + totalOutstandingReceivables + inventoryValuationCost + totalFixedAssetBookValue).toFixed(2));

    // Outstanding Liabilities = Investor/Loans Debt + Accounts Payable (Money business owes)
    const totalOutstandingLoans = liabilities.reduce((acc, l) => acc + Number(l.outstandingBalance || 0), 0);
    const totalAccountsPayable = payables.reduce((acc, p) => acc + Number(p.remainingBalance || 0), 0);
    const totalOutstandingLiabilities = Number((totalOutstandingLoans + totalAccountsPayable).toFixed(2));

    // Working Capital = Current Assets (Cash + A/R + Inventory) - Current Liabilities (A/P + Short-term Debt)
    const currentAssets = Number((totalLiquidCash + totalOutstandingReceivables + inventoryValuationCost).toFixed(2));
    const currentLiabilities = totalOutstandingLiabilities;
    const netWorkingCapital = Number((currentAssets - currentLiabilities).toFixed(2));

    // Partner Equity
    const totalPartnerCapital = partners.reduce((acc, p) => acc + Number(p.currentCapital || 0), 0);
    const netBusinessEquity = Number((totalLiveAssets - totalOutstandingLiabilities).toFixed(2));

    // Return on Investment (ROI)
    const totalInvestedCapital = Math.max(10000, totalPartnerCapital + totalOutstandingLiabilities);
    const annualizedNetProfit = netProfitBeforeTax * 12;
    const roiPercentage = Number(((annualizedNetProfit / totalInvestedCapital) * 100).toFixed(1));

    // Solvency / Health Score (0 - 100)
    let healthScore = 75;
    if (netProfitMargin >= 20) healthScore += 15;
    else if (netProfitMargin < 0) healthScore -= 25;
    if (totalLiquidCash >= totalAccountsPayable) healthScore += 10;
    else healthScore -= 10;
    if (totalOutstandingLiabilities > totalLiveAssets * 0.7) healthScore -= 15;
    healthScore = Math.max(10, Math.min(100, healthScore));

    res.json({
      success: true,
      data: {
        activeMonth: requestedMonth,
        revenue: {
          grossRevenueIncVat: grossPeriodRevenueIncVat,
          customerRefunds: totalCustomerRefunds,
          netRevenueIncVat,
          taxableRevenue,
          outputVatCollected,
          unitsSold: unitsSoldPeriod,
        },
        costsAndExpenses: {
          directCOGS: periodDirectCOGS,
          fixedOverheads: totalFixedOverheads,
          marketingSpend,
          salaries,
          officeRent,
          utilities,
          softwareTools,
          miscExpenses,
          packagingExpense: totalPackagingExpense,
          totalOperatingExpenses,
          monthlyDepreciation,
          damagedAssetLoss,
        },
        profitability: {
          grossProfit,
          grossProfitMargin,
          operatingProfitEBITDA,
          netProfitBeforeTax,
          netProfitMargin,
        },
        breakEven: {
          breakEvenRevenue,
          breakEvenUnits,
          contributionMarginRatio: Number((contributionMarginRatio * 100).toFixed(1)),
          fixedCosts: totalFixedOverheads,
          currentRevenuePacingPercent: breakEvenRevenue > 0 ? Number(((taxableRevenue / breakEvenRevenue) * 100).toFixed(1)) : 100,
        },
        balanceSheetSnapshot: {
          liquidCash: totalLiquidCash,
          accountsReceivable: totalOutstandingReceivables,
          inventoryValuation: inventoryValuationCost,
          fixedAssetsBookValue: totalFixedAssetBookValue,
          totalAssets: totalLiveAssets,
          accountsPayable: totalAccountsPayable,
          loansAndFinancing: totalOutstandingLoans,
          totalLiabilities: totalOutstandingLiabilities,
          netWorkingCapital,
          netEquity: netBusinessEquity,
          totalPartnerCapital,
        },
        analytics: {
          roiPercentage,
          totalInvestedCapital,
          healthScore,
          currency: "Rs ",
        },
      },
    });
  } catch (error) {
    console.error("Financial Analytics Dashboard Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. TREASURY & LIQUID CASH MANAGEMENT
// ==========================================
export const getTreasuryAccounts = async (req, res) => {
  try {
    const accounts = await prisma.financialAccount.findMany({
      include: {
        inflows: { take: 10, orderBy: { date: "desc" } },
        outflows: { take: 10, orderBy: { date: "desc" } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ success: true, accounts });
  } catch (error) {
    console.error("Get Treasury Accounts Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const createTreasuryAccount = async (req, res) => {
  try {
    const { accountName, accountType, accountNumber, bankName, initialBalance } = req.body;
    if (!accountName) {
      return res.json({ success: false, message: "Account Name is required" });
    }

    const created = await prisma.financialAccount.create({
      data: {
        accountName: accountName.trim(),
        accountType: accountType || "BANK",
        accountNumber: accountNumber || "",
        bankName: bankName || "",
        currentBalance: Number(initialBalance || 0),
      },
    });

    if (Number(initialBalance || 0) > 0) {
      await prisma.cashTransaction.create({
        data: {
          amount: Number(initialBalance),
          type: "INFLOW",
          toAccountId: created.id,
          category: "CAPITAL_INJECTION",
          description: `Opening Balance for ${created.accountName}`,
        },
      });
    }

    res.json({ success: true, message: "Account created successfully", account: created });
  } catch (error) {
    console.error("Create Treasury Account Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const recordCashTransfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, category, description, type } = req.body;
    const transferAmount = Number(amount || 0);

    if (transferAmount <= 0) {
      return res.json({ success: false, message: "A positive transaction amount is required" });
    }

    // 1. Inter-Account Transfer
    if (type === "TRANSFER" && fromAccountId && toAccountId) {
      if (fromAccountId === toAccountId) {
        return res.json({ success: false, message: "Source and destination accounts must be different" });
      }

      const fromAccount = await prisma.financialAccount.findUnique({ where: { id: fromAccountId } });
      if (!fromAccount) {
        return res.json({ success: false, message: "Source account not found" });
      }

      // CRITICAL CHECK: Overdraft protection
      if (fromAccount.currentBalance < transferAmount) {
        return res.json({
          success: false,
          message: `Insufficient funds in ${fromAccount.accountName}. Available: Rs ${fromAccount.currentBalance.toLocaleString()}, Requested: Rs ${transferAmount.toLocaleString()}.`,
        });
      }

      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: fromAccountId },
          data: { currentBalance: { decrement: transferAmount } },
        }),
        prisma.financialAccount.update({
          where: { id: toAccountId },
          data: { currentBalance: { increment: transferAmount } },
        }),
        prisma.cashTransaction.create({
          data: {
            amount: transferAmount,
            type: "TRANSFER",
            fromAccountId,
            toAccountId,
            category: "INTERNAL_TRANSFER",
            description: description || "Internal account transfer",
          },
        }),
      ]);

      return res.json({ success: true, message: "Transfer completed successfully" });
    }

    // 2. Direct Inflow
    if (type === "INFLOW" && toAccountId) {
      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: toAccountId },
          data: { currentBalance: { increment: transferAmount } },
        }),
        prisma.cashTransaction.create({
          data: {
            amount: transferAmount,
            type: "INFLOW",
            toAccountId,
            category: category || "SALES",
            description: description || "Direct cash deposit",
          },
        }),
      ]);
      return res.json({ success: true, message: "Inflow recorded successfully" });
    }

    // 3. Direct Outflow
    if (type === "OUTFLOW" && fromAccountId) {
      const fromAccount = await prisma.financialAccount.findUnique({ where: { id: fromAccountId } });
      if (!fromAccount) {
        return res.json({ success: false, message: "Source account not found" });
      }

      // CRITICAL CHECK: Overdraft protection
      if (fromAccount.currentBalance < transferAmount) {
        return res.json({
          success: false,
          message: `Cannot deduct Rs ${transferAmount.toLocaleString()} from ${fromAccount.accountName}. Current balance is Rs ${fromAccount.currentBalance.toLocaleString()}. You can record this expense as an Accounts Payable (Liability) to pay later when funds are available.`,
        });
      }

      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: fromAccountId },
          data: { currentBalance: { decrement: transferAmount } },
        }),
        prisma.cashTransaction.create({
          data: {
            amount: transferAmount,
            type: "OUTFLOW",
            fromAccountId,
            category: category || "EXPENSE",
            description: description || "Direct cash payment",
          },
        }),
      ]);
      return res.json({ success: true, message: "Outflow payment recorded successfully" });
    }

    res.json({ success: false, message: "Invalid transaction parameters" });
  } catch (error) {
    console.error("Record Cash Transfer Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const getCashTransactions = async (req, res) => {
  try {
    const transactions = await prisma.cashTransaction.findMany({
      include: {
        fromAccount: { select: { accountName: true, accountType: true } },
        toAccount: { select: { accountName: true, accountType: true } },
      },
      orderBy: { date: "desc" },
      take: 100,
    });
    res.json({ success: true, transactions });
  } catch (error) {
    console.error("Get Cash Transactions Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. FIXED ASSETS & DEPRECIATION ENGINE
// ==========================================
export const getFixedAssets = async (req, res) => {
  try {
    const assets = await prisma.fixedAsset.findMany({
      orderBy: { purchaseDate: "desc" },
    });
    res.json({ success: true, assets });
  } catch (error) {
    console.error("Get Fixed Assets Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const createFixedAsset = async (req, res) => {
  try {
    const {
      assetName,
      category,
      purchaseDate,
      purchaseCost,
      salvageValue,
      depreciationRate,
      depreciationMethod,
      usefulLifeMonths,
      paidFromAccountId,
      recordAsPayable = false,
      vendorName,
      dueDate,
    } = req.body;

    if (!assetName || !purchaseCost) {
      return res.json({ success: false, message: "Asset Name and Purchase Cost are required" });
    }

    const cost = Number(purchaseCost);
    if (cost <= 0) {
      return res.json({ success: false, message: "Purchase cost must be greater than zero" });
    }

    // If paid from liquid cash account, verify balance first!
    if (paidFromAccountId && !recordAsPayable) {
      const payingAccount = await prisma.financialAccount.findUnique({ where: { id: paidFromAccountId } });
      if (!payingAccount) {
        return res.json({ success: false, message: "Selected payment account not found" });
      }
      if (payingAccount.currentBalance < cost) {
        return res.json({
          success: false,
          message: `Insufficient funds in ${payingAccount.accountName} (Balance: Rs ${payingAccount.currentBalance.toLocaleString()}) to pay Rs ${cost.toLocaleString()}. Select 'Purchase on Credit / Record as Payable' instead to register as a liability without deducting cash.`,
        });
      }
    }

    const tag = `AST-${Date.now().toString().slice(-6)}`;

    // Default rates per Nepal Tax Slabs
    let rate = Number(depreciationRate);
    if (!rate || rate <= 0) {
      if (category === "COMPUTERS_IT" || category === "FURNITURE_FIXTURES") rate = 25;
      else if (category === "VEHICLES") rate = 20;
      else if (category === "MACHINERY_EQUIPMENT") rate = 15;
      else rate = 25;
    }

    // 1. Create the Fixed Asset
    const asset = await prisma.fixedAsset.create({
      data: {
        assetName: assetName.trim(),
        assetTag: tag,
        category: category || "COMPUTERS_IT",
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        purchaseCost: cost,
        salvageValue: Number(salvageValue || 0),
        depreciationRate: rate,
        depreciationMethod: depreciationMethod || "WRITTEN_DOWN_VALUE_SLAB",
        usefulLifeMonths: Number(usefulLifeMonths || 60),
        accumulatedDepreciation: 0,
        currentBookValue: cost,
        status: "ACTIVE",
      },
    });

    // 2. Handle Payment Deduction OR Payable Liability Record
    if (paidFromAccountId && !recordAsPayable) {
      // Deduct from Treasury Account
      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: paidFromAccountId },
          data: { currentBalance: { decrement: cost } },
        }),
        prisma.cashTransaction.create({
          data: {
            amount: cost,
            type: "OUTFLOW",
            fromAccountId: paidFromAccountId,
            category: "ASSET_PURCHASE",
            referenceId: asset.id,
            description: `Asset Purchase: ${asset.assetName} (${tag})`,
          },
        }),
      ]);
    } else {
      // Record as an Accounts Payable (Liability)
      await prisma.accountPayable.create({
        data: {
          title: `Asset Purchase: ${asset.assetName} (${tag})`,
          payeeName: vendorName ? vendorName.trim() : "Asset Vendor / Supplier",
          category: "ASSET_PURCHASE",
          referenceType: "FIXED_ASSET",
          referenceId: asset.id,
          totalAmount: cost,
          paidAmount: 0,
          remainingBalance: cost,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: "UNPAID",
          priority: "MEDIUM",
          notes: `Asset ${asset.assetName} (${tag}) acquired on credit. Settle from Liquid Treasury when funds are available.`,
        },
      });
    }

    res.json({
      success: true,
      message: paidFromAccountId && !recordAsPayable
        ? "Fixed asset purchased and deducted from liquid treasury"
        : "Fixed asset recorded and registered under Accounts Payable (Liability)",
      asset,
    });
  } catch (error) {
    console.error("Create Fixed Asset Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const runDepreciationBatch = async (req, res) => {
  try {
    const { monthsCount = 1 } = req.body;
    const assets = await prisma.fixedAsset.findMany({ where: { status: "ACTIVE" } });
    
    let totalDepreciated = 0;
    const updatedAssets = [];

    for (const asset of assets) {
      const annualRate = Number(asset.depreciationRate || 25) / 100;
      const currentBook = Number(asset.currentBookValue);
      const salvage = Number(asset.salvageValue || 0);

      if (currentBook <= salvage) continue;

      let depAmount = 0;
      if (asset.depreciationMethod === "STRAIGHT_LINE") {
        const monthlyDep = (Number(asset.purchaseCost) - salvage) / Math.max(1, Number(asset.usefulLifeMonths || 60));
        depAmount = monthlyDep * Number(monthsCount);
      } else {
        const monthlyRate = annualRate / 12;
        depAmount = currentBook * monthlyRate * Number(monthsCount);
      }

      depAmount = Math.min(depAmount, currentBook - salvage);
      depAmount = Number(depAmount.toFixed(2));

      const newBookValue = Number((currentBook - depAmount).toFixed(2));
      const newAccDep = Number((Number(asset.accumulatedDepreciation) + depAmount).toFixed(2));

      const updated = await prisma.fixedAsset.update({
        where: { id: asset.id },
        data: {
          currentBookValue: newBookValue,
          accumulatedDepreciation: newAccDep,
        },
      });

      totalDepreciated += depAmount;
      updatedAssets.push(updated);
    }

    res.json({
      success: true,
      message: `Depreciation executed for ${updatedAssets.length} assets`,
      totalDepreciated: Number(totalDepreciated.toFixed(2)),
    });
  } catch (error) {
    console.error("Run Depreciation Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const recordAssetDamageOrDisposal = async (req, res) => {
  try {
    const { assetId, status, damageNotes, disposalAmount, depositAccountId } = req.body;
    const asset = await prisma.fixedAsset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return res.json({ success: false, message: "Asset not found" });
    }

    const currentBook = Number(asset.currentBookValue);
    const recoveredAmount = Number(disposalAmount || 0);
    const scrapLoss = Math.max(0, currentBook - recoveredAmount);

    const updated = await prisma.fixedAsset.update({
      where: { id: assetId },
      data: {
        status: status || "DAMAGED",
        damageNotes: damageNotes || "Damaged/Disposed",
        disposalDate: new Date(),
        disposalAmount: recoveredAmount,
        scrapLossAmount: scrapLoss,
        currentBookValue: 0,
      },
    });

    // If salvage cash was recovered, deposit into treasury
    if (recoveredAmount > 0 && depositAccountId) {
      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: depositAccountId },
          data: { currentBalance: { increment: recoveredAmount } },
        }),
        prisma.cashTransaction.create({
          data: {
            amount: recoveredAmount,
            type: "INFLOW",
            toAccountId: depositAccountId,
            category: "CAPITAL_INJECTION",
            referenceId: asset.id,
            description: `Salvage Recovery for ${asset.assetName}`,
          },
        }),
      ]);
    }

    res.json({ success: true, message: `Asset marked as ${status}`, asset: updated, scrapLoss });
  } catch (error) {
    console.error("Asset Damage/Disposal Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. PARTNERSHIP EQUITY & PROFIT DISTRIBUTION
// ==========================================
export const getPartnershipOverview = async (req, res) => {
  try {
    const [partners, distributions, distributionPayables] = await Promise.all([
      prisma.partnerEquity.findMany({ orderBy: { ownershipPercentage: "desc" } }),
      prisma.profitDistribution.findMany({ orderBy: { periodEnd: "desc" }, take: 10 }),
      prisma.accountPayable.findMany({
        where: {
          category: "PARTNER_DISTRIBUTION",
          status: { in: ["UNPAID", "PARTIALLY_PAID"] },
        },
      }),
    ]);

    const totalOwnership = partners.reduce((acc, p) => acc + Number(p.ownershipPercentage || 0), 0);
    const totalCapital = partners.reduce((acc, p) => acc + Number(p.currentCapital || 0), 0);
    const totalDrawings = partners.reduce((acc, p) => acc + Number(p.totalDrawings || 0), 0);
    const pendingDistributionPayablesTotal = distributionPayables.reduce(
      (acc, p) => acc + Number(p.remainingBalance || 0),
      0
    );

    res.json({
      success: true,
      data: {
        partners,
        distributions,
        distributionPayables,
        summary: {
          totalOwnership: Number(totalOwnership.toFixed(1)),
          totalCapital,
          totalDrawings,
          pendingDistributionPayablesTotal,
          partnerCount: partners.length,
        },
      },
    });
  } catch (error) {
    console.error("Get Partnership Overview Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const savePartner = async (req, res) => {
  try {
    const { id, partnerName, email, phone, ownershipPercentage, initialCapital, currentCapital, notes } = req.body;
    if (!partnerName || !email) {
      return res.json({ success: false, message: "Partner Name and Email are required" });
    }

    const payload = {
      partnerName: partnerName.trim(),
      email: email.trim(),
      phone: phone || "",
      ownershipPercentage: Number(ownershipPercentage || 0),
      initialCapital: Number(initialCapital || 0),
      currentCapital: currentCapital !== undefined ? Number(currentCapital) : Number(initialCapital || 0),
      notes: notes || null,
    };

    let partner;
    if (id) {
      partner = await prisma.partnerEquity.update({
        where: { id },
        data: payload,
      });
    } else {
      partner = await prisma.partnerEquity.create({
        data: payload,
      });
    }

    res.json({ success: true, message: "Partner saved successfully", partner });
  } catch (error) {
    console.error("Save Partner Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const calculateAndExecuteProfitDistribution = async (req, res) => {
  try {
    const {
      periodStart,
      periodEnd,
      fiscalYear,
      retainedEarningsPercentage = 20,
      executePayout = false,
      fromAccountId,
    } = req.body;
    
    const pStart = periodStart ? new Date(periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const pEnd = periodEnd ? new Date(periodEnd) : new Date();

    const [orders, monthlyExpenses, partners] = await Promise.all([
      prisma.order.findMany({
        where: {
          date: { gte: BigInt(pStart.getTime()), lte: BigInt(pEnd.getTime()) },
          status: { notIn: ["Cancelled"] },
        },
      }),
      prisma.monthlyExpense.findMany(),
      prisma.partnerEquity.findMany({ where: { status: "ACTIVE" } }),
    ]);

    if (partners.length === 0) {
      return res.json({ success: false, message: "No active partners registered to distribute profit to" });
    }

    const grossRevenue = orders.reduce((acc, o) => acc + Number(o.amount || 0), 0);
    const taxableRevenue = grossRevenue / 1.13;
    const estCOGS = taxableRevenue * 0.55;
    const totalExpenses = monthlyExpenses.reduce(
      (acc, e) =>
        acc +
        Number(e.salaries || 0) +
        Number(e.officeRent || 0) +
        Number(e.marketingSpend || 0) +
        Number(e.utilities || 0),
      0
    );

    const netProfit = Math.max(0, taxableRevenue - estCOGS - (totalExpenses / 12));
    const retainPct = Number(retainedEarningsPercentage || 20);
    const retainedAmount = Number(((netProfit * retainPct) / 100).toFixed(2));
    const distributableAmount = Number((netProfit - retainedAmount).toFixed(2));

    // If user wants to execute cash payout immediately, verify liquid cash balance
    if (executePayout && fromAccountId) {
      const payingAccount = await prisma.financialAccount.findUnique({ where: { id: fromAccountId } });
      if (!payingAccount) {
        return res.json({ success: false, message: "Selected treasury account not found" });
      }
      if (payingAccount.currentBalance < distributableAmount) {
        return res.json({
          success: false,
          message: `Cannot pay out Rs ${distributableAmount.toLocaleString()} from ${payingAccount.accountName} (Balance: Rs ${payingAccount.currentBalance.toLocaleString()}). Approve as 'Distribution Payable (Liability)' instead, and settle partners individually as cash becomes available.`,
        });
      }
    }

    const breakdown = partners.map((p) => {
      const share = Number(((distributableAmount * Number(p.ownershipPercentage)) / 100).toFixed(2));
      return {
        partnerId: p.id,
        name: p.partnerName,
        percentage: p.ownershipPercentage,
        amount: share,
        paymentStatus: executePayout && fromAccountId ? "PAID" : "PAYABLE_DEFERRED",
        paidDate: executePayout && fromAccountId ? new Date() : null,
      };
    });

    const record = await prisma.profitDistribution.create({
      data: {
        periodStart: pStart,
        periodEnd: pEnd,
        fiscalYear: fiscalYear || "2082/2083",
        grossRevenue: Number(grossRevenue.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        retainedEarningsPercentage: retainPct,
        retainedAmount,
        distributableAmount,
        partnerBreakdown: breakdown,
        status: executePayout && fromAccountId ? "PAID" : "APPROVED_PAYABLE",
      },
    });

    if (executePayout && fromAccountId && distributableAmount > 0) {
      // Immediate Cash Payout
      await prisma.financialAccount.update({
        where: { id: fromAccountId },
        data: { currentBalance: { decrement: distributableAmount } },
      });

      for (const item of breakdown) {
        await prisma.partnerEquity.update({
          where: { id: item.partnerId },
          data: {
            totalDistributionsReceived: { increment: item.amount },
          },
        });
        await prisma.cashTransaction.create({
          data: {
            amount: item.amount,
            type: "OUTFLOW",
            fromAccountId,
            category: "DRAWINGS",
            referenceId: record.id,
            description: `Profit Distribution Payout to ${item.name} (${item.percentage}%)`,
          },
        });
      }
    } else if (distributableAmount > 0) {
      // Record individual partner distribution payables in AccountPayable ledger
      for (const item of breakdown) {
        if (item.amount > 0) {
          await prisma.accountPayable.create({
            data: {
              title: `Partner Profit Share: ${fiscalYear || "FY"} - ${item.name} (${item.percentage}%)`,
              payeeName: item.name,
              category: "PARTNER_DISTRIBUTION",
              referenceType: "PROFIT_DISTRIBUTION",
              referenceId: `${record.id}#${item.partnerId}`,
              totalAmount: item.amount,
              paidAmount: 0,
              remainingBalance: item.amount,
              dueDate: null,
              status: "UNPAID",
              priority: "HIGH",
              notes: `Declared profit dividend share for partner ${item.name} for period ${pStart.toISOString().slice(0, 10)} to ${pEnd.toISOString().slice(0, 10)}.`,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      message: executePayout && fromAccountId
        ? "Profit distribution calculated and paid out from liquid treasury"
        : "Profit distribution declared and recorded under Accounts Payable (Liabilities)",
      record,
    });
  } catch (error) {
    console.error("Profit Distribution Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. INVESTORS & FINANCING LIABILITIES
// ==========================================
export const getInvestorsAndLiabilities = async (req, res) => {
  try {
    const liabilities = await prisma.investorLiability.findMany({
      orderBy: { startDate: "desc" },
    });
    res.json({ success: true, liabilities });
  } catch (error) {
    console.error("Get Liabilities Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const recordInvestorFinancing = async (req, res) => {
  try {
    const {
      investorName,
      contactPhone,
      contactEmail,
      type,
      principalAmount,
      interestRate,
      monthlyInstallment,
      equityGrantedPercentage,
      startDate,
      maturityDate,
      depositAccountId,
      notes,
    } = req.body;

    if (!investorName || !principalAmount) {
      return res.json({ success: false, message: "Investor Name and Principal Amount are required" });
    }

    const principal = Number(principalAmount);

    const record = await prisma.investorLiability.create({
      data: {
        investorName: investorName.trim(),
        contactPhone: contactPhone || "",
        contactEmail: contactEmail || "",
        type: type || "EQUITY_INVESTOR",
        principalAmount: principal,
        amountRepaid: 0,
        outstandingBalance: principal,
        interestRate: Number(interestRate || 0),
        monthlyInstallment: Number(monthlyInstallment || 0),
        equityGrantedPercentage: Number(equityGrantedPercentage || 0),
        startDate: startDate ? new Date(startDate) : new Date(),
        maturityDate: maturityDate ? new Date(maturityDate) : null,
        status: "ACTIVE",
        notes: notes || null,
      },
    });

    // Automatically deposit funds into Treasury account if specified
    if (depositAccountId && principal > 0) {
      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: depositAccountId },
          data: { currentBalance: { increment: principal } },
        }),
        prisma.cashTransaction.create({
          data: {
            amount: principal,
            type: "INFLOW",
            toAccountId: depositAccountId,
            category: type === "EQUITY_INVESTOR" ? "CAPITAL_INJECTION" : "LOAN_DISBURSEMENT",
            referenceId: record.id,
            description: `Financing Received: ${record.investorName} (${record.type})`,
          },
        }),
      ]);
    }

    res.json({ success: true, message: "Financing record saved successfully", record });
  } catch (error) {
    console.error("Record Financing Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const recordLiabilityRepayment = async (req, res) => {
  try {
    const { liabilityId, repaymentAmount, fromAccountId, notes } = req.body;
    const amount = Number(repaymentAmount || 0);

    if (amount <= 0) {
      return res.json({ success: false, message: "Repayment amount must be greater than zero" });
    }

    const liability = await prisma.investorLiability.findUnique({ where: { id: liabilityId } });
    if (!liability) {
      return res.json({ success: false, message: "Liability record not found" });
    }

    // Overdraft check if paying from cash
    if (fromAccountId) {
      const payingAccount = await prisma.financialAccount.findUnique({ where: { id: fromAccountId } });
      if (!payingAccount) {
        return res.json({ success: false, message: "Payment account not found" });
      }
      if (payingAccount.currentBalance < amount) {
        return res.json({
          success: false,
          message: `Cannot pay Rs ${amount.toLocaleString()} from ${payingAccount.accountName}. Available liquid balance is Rs ${payingAccount.currentBalance.toLocaleString()}.`,
        });
      }
    }

    const newRepaid = Number(liability.amountRepaid) + amount;
    const newOutstanding = Math.max(0, Number(liability.principalAmount) - newRepaid);
    const newStatus = newOutstanding === 0 ? "SETTLED" : "ACTIVE";

    const updated = await prisma.investorLiability.update({
      where: { id: liabilityId },
      data: {
        amountRepaid: newRepaid,
        outstandingBalance: newOutstanding,
        status: newStatus,
        notes: notes ? `${liability.notes || ""}\n${notes}` : liability.notes,
      },
    });

    if (fromAccountId) {
      await prisma.$transaction([
        prisma.financialAccount.update({
          where: { id: fromAccountId },
          data: { currentBalance: { decrement: amount } },
        }),
        prisma.cashTransaction.create({
          data: {
            amount,
            type: "OUTFLOW",
            fromAccountId,
            category: "LOAN_REPAYMENT",
            referenceId: liability.id,
            description: `Repayment to ${liability.investorName}`,
          },
        }),
      ]);
    }

    res.json({ success: true, message: "Repayment recorded successfully", liability: updated });
  } catch (error) {
    console.error("Record Repayment Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. ACCOUNTS PAYABLE & RECEIVABLE SUITE (LIABILITIES & SETTLEMENTS)
// ==========================================
export const getPayablesAndReceivables = async (req, res) => {
  try {
    const [payables, receivables, accounts] = await Promise.all([
      prisma.accountPayable.findMany({
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      }),
      prisma.accountReceivable.findMany({
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      }),
      prisma.financialAccount.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, accountName: true, currentBalance: true, accountType: true },
      }),
    ]);

    const totalPayablesOutstanding = payables
      .filter((p) => p.status !== "SETTLED" && p.status !== "CANCELLED")
      .reduce((acc, p) => acc + Number(p.remainingBalance || 0), 0);

    const totalPayablesSettled = payables
      .reduce((acc, p) => acc + Number(p.paidAmount || 0), 0);

    const totalReceivablesOutstanding = receivables
      .filter((r) => r.status !== "SETTLED" && r.status !== "CANCELLED")
      .reduce((acc, r) => acc + Number(r.remainingBalance || 0), 0);

    const totalReceivablesCollected = receivables
      .reduce((acc, r) => acc + Number(r.receivedAmount || 0), 0);

    const totalLiquidCash = accounts.reduce((acc, a) => acc + Number(a.currentBalance || 0), 0);

    res.json({
      success: true,
      data: {
        payables,
        receivables,
        accounts,
        metrics: {
          totalPayablesOutstanding: Number(totalPayablesOutstanding.toFixed(2)),
          totalPayablesSettled: Number(totalPayablesSettled.toFixed(2)),
          totalReceivablesOutstanding: Number(totalReceivablesOutstanding.toFixed(2)),
          totalReceivablesCollected: Number(totalReceivablesCollected.toFixed(2)),
          totalLiquidCash: Number(totalLiquidCash.toFixed(2)),
          netPayablePressure: Number((totalPayablesOutstanding - totalLiquidCash).toFixed(2)),
          canCoverAllPayablesNow: totalLiquidCash >= totalPayablesOutstanding,
        },
      },
    });
  } catch (error) {
    console.error("Get Payables and Receivables Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const createPayable = async (req, res) => {
  try {
    const { title, payeeName, category, referenceType, referenceId, totalAmount, dueDate, invoiceNumber, priority, notes } = req.body;
    
    if (!title || !payeeName || !totalAmount) {
      return res.json({ success: false, message: "Title, Payee Name, and Amount are required" });
    }

    const amount = Number(totalAmount);
    if (amount <= 0) {
      return res.json({ success: false, message: "Amount must be greater than zero" });
    }

    const payable = await prisma.accountPayable.create({
      data: {
        title: title.trim(),
        payeeName: payeeName.trim(),
        category: category || "OPERATING_EXPENSE",
        referenceType: referenceType || "MANUAL",
        referenceId: referenceId || "",
        totalAmount: amount,
        paidAmount: 0,
        remainingBalance: amount,
        dueDate: dueDate ? new Date(dueDate) : null,
        invoiceNumber: invoiceNumber || "",
        priority: priority || "MEDIUM",
        status: "UNPAID",
        notes: notes || null,
      },
    });

    res.json({ success: true, message: "Payable liability recorded successfully", payable });
  } catch (error) {
    console.error("Create Payable Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const createReceivable = async (req, res) => {
  try {
    const { title, payerName, category, referenceType, referenceId, totalAmount, dueDate, invoiceNumber, notes } = req.body;
    
    if (!title || !payerName || !totalAmount) {
      return res.json({ success: false, message: "Title, Payer Name, and Amount are required" });
    }

    const amount = Number(totalAmount);
    if (amount <= 0) {
      return res.json({ success: false, message: "Amount must be greater than zero" });
    }

    const receivable = await prisma.accountReceivable.create({
      data: {
        title: title.trim(),
        payerName: payerName.trim(),
        category: category || "CUSTOMER_RECEIVABLE",
        referenceType: referenceType || "MANUAL",
        referenceId: referenceId || "",
        totalAmount: amount,
        receivedAmount: 0,
        remainingBalance: amount,
        dueDate: dueDate ? new Date(dueDate) : null,
        invoiceNumber: invoiceNumber || "",
        status: "UNPAID",
        notes: notes || null,
      },
    });

    res.json({ success: true, message: "Receivable asset recorded successfully", receivable });
  } catch (error) {
    console.error("Create Receivable Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const settlePayable = async (req, res) => {
  try {
    const { payableId, amount, fromAccountId, notes } = req.body;
    const settleAmount = Number(amount || 0);

    if (!payableId || settleAmount <= 0 || !fromAccountId) {
      return res.json({ success: false, message: "Payable ID, positive payment amount, and source account are required" });
    }

    const payable = await prisma.accountPayable.findUnique({ where: { id: payableId } });
    if (!payable) {
      return res.json({ success: false, message: "Payable record not found" });
    }

    if (payable.status === "SETTLED") {
      return res.json({ success: false, message: "This payable has already been completely settled" });
    }

    if (settleAmount > payable.remainingBalance) {
      return res.json({
        success: false,
        message: `Settlement amount (Rs ${settleAmount.toLocaleString()}) cannot exceed remaining balance (Rs ${payable.remainingBalance.toLocaleString()})`,
      });
    }

    const fromAccount = await prisma.financialAccount.findUnique({ where: { id: fromAccountId } });
    if (!fromAccount) {
      return res.json({ success: false, message: "Source account not found" });
    }

    // STRICT OVERDRAFT CHECK
    if (fromAccount.currentBalance < settleAmount) {
      return res.json({
        success: false,
        message: `Insufficient liquid cash in ${fromAccount.accountName}. Available balance: Rs ${fromAccount.currentBalance.toLocaleString()}, required: Rs ${settleAmount.toLocaleString()}. Please deposit funds first or settle with a smaller partial payment.`,
      });
    }

    const newPaid = Number(payable.paidAmount) + settleAmount;
    const newRemaining = Math.max(0, Number(payable.totalAmount) - newPaid);
    const newStatus = newRemaining === 0 ? "SETTLED" : "PARTIALLY_PAID";

    let history = [];
    try {
      history = typeof payable.settlementHistory === "string" ? JSON.parse(payable.settlementHistory) : (payable.settlementHistory || []);
    } catch {
      history = [];
    }

    const settlementEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: settleAmount,
      fromAccountId,
      accountName: fromAccount.accountName,
      notes: notes || "Payable settlement",
    };
    history.push(settlementEntry);

    // Determine Cash Transaction Category
    let cashCategory = "EXPENSE";
    if (payable.category === "SUPPLIER_INVOICE") cashCategory = "SUPPLIER_PAYMENT";
    else if (payable.category === "PARTNER_DISTRIBUTION") cashCategory = "DRAWINGS";
    else if (payable.category === "ASSET_PURCHASE") cashCategory = "ASSET_PURCHASE";
    else if (payable.category === "TAX_DUE") cashCategory = "EXPENSE";
    else if (payable.category === "LOAN_NOTE") cashCategory = "LOAN_REPAYMENT";

    await prisma.$transaction([
      prisma.financialAccount.update({
        where: { id: fromAccountId },
        data: { currentBalance: { decrement: settleAmount } },
      }),
      prisma.cashTransaction.create({
        data: {
          amount: settleAmount,
          type: "OUTFLOW",
          fromAccountId,
          category: cashCategory,
          referenceId: payable.id,
          description: `Settlement of ${payable.title} to ${payable.payeeName}`,
        },
      }),
      prisma.accountPayable.update({
        where: { id: payableId },
        data: {
          paidAmount: newPaid,
          remainingBalance: newRemaining,
          status: newStatus,
          settlementHistory: history,
        },
      }),
    ]);

    // If this payable was for a partner distribution, update the partner's total distributions received
    if (payable.category === "PARTNER_DISTRIBUTION" && payable.referenceId) {
      const parts = payable.referenceId.split("#");
      const partnerId = parts[1];
      if (partnerId) {
        await prisma.partnerEquity.updateMany({
          where: { id: partnerId },
          data: { totalDistributionsReceived: { increment: settleAmount } },
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully paid Rs ${settleAmount.toLocaleString()} to ${payable.payeeName}. Remaining balance: Rs ${newRemaining.toLocaleString()}`,
    });
  } catch (error) {
    console.error("Settle Payable Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const collectReceivable = async (req, res) => {
  try {
    const { receivableId, amount, toAccountId, notes } = req.body;
    const collectAmount = Number(amount || 0);

    if (!receivableId || collectAmount <= 0 || !toAccountId) {
      return res.json({ success: false, message: "Receivable ID, positive amount, and deposit account are required" });
    }

    const receivable = await prisma.accountReceivable.findUnique({ where: { id: receivableId } });
    if (!receivable) {
      return res.json({ success: false, message: "Receivable record not found" });
    }

    if (receivable.status === "SETTLED") {
      return res.json({ success: false, message: "This receivable has already been completely collected" });
    }

    if (collectAmount > receivable.remainingBalance) {
      return res.json({
        success: false,
        message: `Collection amount (Rs ${collectAmount.toLocaleString()}) cannot exceed remaining balance (Rs ${receivable.remainingBalance.toLocaleString()})`,
      });
    }

    const toAccount = await prisma.financialAccount.findUnique({ where: { id: toAccountId } });
    if (!toAccount) {
      return res.json({ success: false, message: "Deposit account not found" });
    }

    const newReceived = Number(receivable.receivedAmount) + collectAmount;
    const newRemaining = Math.max(0, Number(receivable.totalAmount) - newReceived);
    const newStatus = newRemaining === 0 ? "SETTLED" : "PARTIALLY_RECEIVED";

    let history = [];
    try {
      history = typeof receivable.collectionHistory === "string" ? JSON.parse(receivable.collectionHistory) : (receivable.collectionHistory || []);
    } catch {
      history = [];
    }

    const collectionEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount: collectAmount,
      toAccountId,
      accountName: toAccount.accountName,
      notes: notes || "Receivable collection",
    };
    history.push(collectionEntry);

    await prisma.$transaction([
      prisma.financialAccount.update({
        where: { id: toAccountId },
        data: { currentBalance: { increment: collectAmount } },
      }),
      prisma.cashTransaction.create({
        data: {
          amount: collectAmount,
          type: "INFLOW",
          toAccountId,
          category: receivable.category === "CUSTOMER_RECEIVABLE" ? "SALES" : "CAPITAL_INJECTION",
          referenceId: receivable.id,
          description: `Collection for ${receivable.title} from ${receivable.payerName}`,
        },
      }),
      prisma.accountReceivable.update({
        where: { id: receivableId },
        data: {
          receivedAmount: newReceived,
          remainingBalance: newRemaining,
          status: newStatus,
          collectionHistory: history,
        },
      }),
    ]);

    res.json({
      success: true,
      message: `Successfully collected Rs ${collectAmount.toLocaleString()} into ${toAccount.accountName}. Remaining: Rs ${newRemaining.toLocaleString()}`,
    });
  } catch (error) {
    console.error("Collect Receivable Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. VAT & LEGAL TAX MINIMIZATION ADVISORY
// ==========================================
export const getVATAndTaxReport = async (req, res) => {
  try {
    const requestedMonth = req.query.month || getCurrentYearMonth();
    const [year, month] = requestedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const startTimestamp = BigInt(startDate.getTime());
    const endTimestamp = BigInt(endDate.getTime());

    const [orders, shipments, customerReturns, supplierReturns, monthlyExpense, fixedAssets, taxPayables] = await Promise.all([
      prisma.order.findMany({
        where: {
          date: { gte: startTimestamp, lte: endTimestamp },
          status: { notIn: ["Cancelled"] },
        },
      }),
      prisma.inboundShipment.findMany({
        where: {
          shipmentDate: { gte: startDate, lte: endDate },
        },
      }),
      prisma.customerReturn.findMany({
        where: {
          returnDate: { gte: startDate, lte: endDate },
          refundStatus: "COMPLETED",
        },
      }),
      prisma.supplierReturn.findMany({
        where: {
          returnDate: { gte: startDate, lte: endDate },
          status: "COMPLETED",
        },
      }),
      prisma.monthlyExpense.findUnique({ where: { yearMonth: requestedMonth } }),
      prisma.fixedAsset.findMany({ where: { status: "ACTIVE" } }),
      prisma.accountPayable.findMany({
        where: { category: "TAX_DUE", status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
      }),
    ]);

    const vatRate = 0.13; // 13% Nepal VAT

    // Output VAT on Gross Sales
    const grossSalesIncVat = orders.reduce((acc, o) => acc + Number(o.amount || 0), 0);
    const customerRefunds = customerReturns.reduce((acc, r) => acc + Number(r.totalRefundAmount || 0), 0);
    const netSalesIncVat = Math.max(0, grossSalesIncVat - customerRefunds);
    const taxableSales = Number((netSalesIncVat / (1 + vatRate)).toFixed(2));
    const outputVat = Number((netSalesIncVat - taxableSales).toFixed(2));

    // Input VAT on Inbound Shipments & Purchases
    let totalPurchasesWithVat = 0;
    shipments.forEach((s) => {
      totalPurchasesWithVat += Number(s.totalFreightCost || 0) + Number(s.customsOrTaxes || 0);
      let items = [];
      try {
        items = typeof s.items === "string" ? JSON.parse(s.items) : (s.items || []);
      } catch {
        items = [];
      }
      items.forEach((item) => {
        totalPurchasesWithVat += Number(item.unitFreightCost || 0) * Number(item.quantity || 1);
      });
    });

    const supplierReturnDebits = supplierReturns.reduce((acc, r) => acc + Number(r.totalDebitAmount || 0), 0);
    const netPurchasesWithVat = Math.max(0, totalPurchasesWithVat - supplierReturnDebits);
    const taxablePurchases = Number((netPurchasesWithVat / (1 + vatRate)).toFixed(2));
    const inputVat = Number((netPurchasesWithVat - taxablePurchases).toFixed(2));

    // Net VAT Payable
    const netVatPayable = Number((outputVat - inputVat).toFixed(2));

    // Corporate Income Tax & Legal Deductions Analysis
    const deductibleRent = monthlyExpense ? Number(monthlyExpense.officeRent || 0) : 0;
    const deductibleSalaries = monthlyExpense ? Number(monthlyExpense.salaries || 0) : 0;
    const deductibleMarketing = monthlyExpense ? Number(monthlyExpense.marketingSpend || 0) : 0;
    const deductibleUtilities = monthlyExpense ? Number(monthlyExpense.utilities || 0) : 0;
    const deductibleSoftware = monthlyExpense ? Number(monthlyExpense.softwareTools || 0) : 0;
    const deductibleMisc = monthlyExpense ? Number(monthlyExpense.miscExpenses || 0) : 0;

    let monthlyTaxDepreciation = 0;
    fixedAssets.forEach((asset) => {
      const annualRate = Number(asset.depreciationRate || 25) / 100;
      const bookVal = Number(asset.currentBookValue || 0);
      monthlyTaxDepreciation += (bookVal * annualRate) / 12;
    });
    monthlyTaxDepreciation = Number(monthlyTaxDepreciation.toFixed(2));

    const totalAllowableDeductions = Number(
      (deductibleRent + deductibleSalaries + deductibleMarketing + deductibleUtilities + deductibleSoftware + deductibleMisc + monthlyTaxDepreciation).toFixed(2)
    );

    const estimatedTaxableIncome = Math.max(0, Number((taxableSales - (taxableSales * 0.5) - totalAllowableDeductions).toFixed(2)));
    const corporateTaxRate = 25; // 25% Nepal Corporate Income Tax Rate
    const estimatedCorporateTax = Number(((estimatedTaxableIncome * corporateTaxRate) / 100).toFixed(2));

    // Tax-Minimization Recommendations Engine
    const taxOptimizationStrategies = [
      {
        title: "Maximize Block B & C Asset Depreciation",
        impact: "HIGH",
        savingsEstimate: `Rs ${(monthlyTaxDepreciation * 0.25).toFixed(0)} / mo`,
        description: "Apply IRD-permitted 25% diminishing balance rate on computers, furniture, and POS hardware to accelerate tax shield deductions legally.",
      },
      {
        title: "Claim 100% Marketing & Ad Spend Deductions",
        impact: "HIGH",
        savingsEstimate: `Rs ${(deductibleMarketing * 0.25).toFixed(0)} / mo`,
        description: "Keep VAT-compliant invoices for all Meta Ads, Google Ads, and local influencer endorsements to offset corporate taxable income directly.",
      },
      {
        title: "Write Off Damaged & Unsaleable Returned Stock",
        impact: "MEDIUM",
        savingsEstimate: "Full Cost Shield",
        description: "Mark damaged customer returns as 'Damaged Write-Off' instead of holding unsaleable inventory to recognize inventory impairment loss before tax.",
      },
      {
        title: "Input VAT Credit Reclaim on Freight & Shipments",
        impact: "MEDIUM",
        savingsEstimate: `Rs ${inputVat.toFixed(0)} VAT Credit`,
        description: "Ensure courier and freight logistics providers issue registered VAT bills (13%) so input tax is fully subtracted from sales VAT.",
      },
    ];

    res.json({
      success: true,
      data: {
        vat: {
          period: requestedMonth,
          taxableSales,
          outputVat,
          taxablePurchases,
          inputVat,
          netVatPayable,
          vatStatus: netVatPayable >= 0 ? "PAYABLE_TO_IRD" : "INPUT_CREDIT_CARRYFORWARD",
        },
        incomeTax: {
          grossTaxableRevenue: taxableSales,
          totalAllowableDeductions,
          depreciationDeduction: monthlyTaxDepreciation,
          estimatedTaxableIncome,
          taxRate: corporateTaxRate,
          estimatedCorporateTax,
        },
        taxPayables,
        taxOptimizationStrategies,
      },
    });
  } catch (error) {
    console.error("VAT and Tax Report Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================================
// 8. COMPREHENSIVE FINANCIAL STATEMENTS
// ==========================================
export const getFinancialStatements = async (req, res) => {
  try {
    const requestedMonth = req.query.month || getCurrentYearMonth();
    const [year, month] = requestedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const startTimestamp = BigInt(startDate.getTime());
    const endTimestamp = BigInt(endDate.getTime());

    const [
      orders,
      products,
      monthlyExpense,
      accounts,
      fixedAssets,
      partners,
      liabilities,
      customerReturns,
      payables,
      receivables,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          date: { gte: startTimestamp, lte: endTimestamp },
          status: { notIn: ["Cancelled"] },
        },
      }),
      prisma.product.findMany(),
      prisma.monthlyExpense.findUnique({ where: { yearMonth: requestedMonth } }),
      prisma.financialAccount.findMany({ where: { status: "ACTIVE" } }),
      prisma.fixedAsset.findMany(),
      prisma.partnerEquity.findMany({ where: { status: "ACTIVE" } }),
      prisma.investorLiability.findMany({ where: { status: "ACTIVE" } }),
      prisma.customerReturn.findMany({
        where: {
          returnDate: { gte: startDate, lte: endDate },
          refundStatus: "COMPLETED",
        },
      }),
      prisma.accountPayable.findMany({
        where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
      }),
      prisma.accountReceivable.findMany({
        where: { status: { in: ["UNPAID", "PARTIALLY_RECEIVED"] } },
      }),
    ]);

    // P&L Calculations
    const grossRevenue = orders.reduce((acc, o) => acc + Number(o.amount || 0), 0);
    const returnsAndAllowances = customerReturns.reduce((acc, r) => acc + Number(r.totalRefundAmount || 0), 0);
    const netRevenue = Math.max(0, grossRevenue - returnsAndAllowances);
    const taxableNetRevenue = Number((netRevenue / 1.13).toFixed(2));

    // COGS
    let cogs = 0;
    const costMap = {};
    products.forEach((p) => { costMap[p.id] = Number(p.costPrice || 0); });
    orders.forEach((ord) => {
      let items = [];
      try { items = typeof ord.items === "string" ? JSON.parse(ord.items) : (ord.items || []); } catch { items = []; }
      items.forEach((item) => {
        const qty = Number(item.quantity || 1);
        const pId = item.productId || item._id || item.id;
        cogs += (costMap[pId] || 0) * qty;
      });
    });

    const grossProfit = Number((taxableNetRevenue - cogs).toFixed(2));

    const marketing = monthlyExpense ? Number(monthlyExpense.marketingSpend || 0) : 0;
    const rent = monthlyExpense ? Number(monthlyExpense.officeRent || 0) : 0;
    const salaries = monthlyExpense ? Number(monthlyExpense.salaries || 0) : 0;
    const utilities = monthlyExpense ? Number(monthlyExpense.utilities || 0) : 0;
    const software = monthlyExpense ? Number(monthlyExpense.softwareTools || 0) : 0;
    const misc = monthlyExpense ? Number(monthlyExpense.miscExpenses || 0) : 0;
    const totalOpex = marketing + rent + salaries + utilities + software + misc;

    let depreciation = 0;
    fixedAssets.forEach((a) => {
      if (a.status === "ACTIVE") {
        depreciation += (Number(a.currentBookValue || 0) * (Number(a.depreciationRate || 25) / 100)) / 12;
      }
    });
    depreciation = Number(depreciation.toFixed(2));

    const netOperatingIncome = Number((grossProfit - totalOpex - depreciation).toFixed(2));
    const incomeTaxEstimate = Math.max(0, Number((netOperatingIncome * 0.25).toFixed(2)));
    const netIncomeAfterTax = Number((netOperatingIncome - incomeTaxEstimate).toFixed(2));

    // Balance Sheet Calculations
    const cashAndEquivalents = accounts.reduce((acc, a) => acc + Number(a.currentBalance || 0), 0);
    const accountsReceivableTotal = receivables.reduce((acc, r) => acc + Number(r.remainingBalance || 0), 0);
    const inventoryValuation = products.reduce((acc, p) => acc + (Number(p.costPrice || 0) * Number(p.stockQuantity || 0)), 0);
    const totalCurrentAssets = Number((cashAndEquivalents + accountsReceivableTotal + inventoryValuation).toFixed(2));

    const fixedAssetsGross = fixedAssets.reduce((acc, a) => acc + Number(a.purchaseCost || 0), 0);
    const accumulatedDep = fixedAssets.reduce((acc, a) => acc + Number(a.accumulatedDepreciation || 0), 0);
    const netFixedAssets = Number((fixedAssetsGross - accumulatedDep).toFixed(2));
    const totalAssets = Number((totalCurrentAssets + netFixedAssets).toFixed(2));

    const accountsPayableTotal = payables.reduce((acc, p) => acc + Number(p.remainingBalance || 0), 0);
    const totalBorrowings = liabilities.reduce((acc, l) => acc + Number(l.outstandingBalance || 0), 0);
    const totalLiabilities = Number((accountsPayableTotal + totalBorrowings).toFixed(2));

    const partnerCapital = partners.reduce((acc, p) => acc + Number(p.currentCapital || 0), 0);
    const retainedEarnings = Number((totalAssets - totalLiabilities - partnerCapital).toFixed(2));
    const totalEquity = Number((partnerCapital + retainedEarnings).toFixed(2));

    res.json({
      success: true,
      data: {
        incomeStatement: {
          period: requestedMonth,
          grossRevenue,
          returnsAndAllowances,
          taxableNetRevenue,
          cogs,
          grossProfit,
          operatingExpenses: {
            marketing,
            rent,
            salaries,
            utilities,
            software,
            misc,
            total: totalOpex,
          },
          depreciation,
          netOperatingIncome,
          incomeTaxEstimate,
          netIncomeAfterTax,
        },
        balanceSheet: {
          assets: {
            currentAssets: {
              cashAndEquivalents,
              accountsReceivable: accountsReceivableTotal,
              inventoryValuation,
              total: totalCurrentAssets,
            },
            fixedAssets: {
              grossCost: fixedAssetsGross,
              accumulatedDepreciation: accumulatedDep,
              netBookValue: netFixedAssets,
            },
            totalAssets,
          },
          liabilities: {
            accountsPayable: accountsPayableTotal,
            loansAndDebt: totalBorrowings,
            totalLiabilities,
          },
          equity: {
            partnerCapital,
            retainedEarnings,
            totalEquity,
          },
          workingCapital: Number((totalCurrentAssets - totalLiabilities).toFixed(2)),
          balanceCheck: totalAssets === Number((totalLiabilities + totalEquity).toFixed(2)),
        },
        cashFlowStatement: {
          operatingActivities: Number((netIncomeAfterTax + depreciation).toFixed(2)),
          investingActivities: -Number(depreciation),
          financingActivities: 0,
          netCashFlow: Number((netIncomeAfterTax + depreciation - depreciation).toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error("Financial Statements Error:", error);
    res.json({ success: false, message: error.message });
  }
};
