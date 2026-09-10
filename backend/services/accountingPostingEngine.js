import { prisma } from "../config/db.js";

// ==========================================
// 1. STANDARD CHART OF ACCOUNTS DEFINITION
// ==========================================
export const STANDARD_CHART_OF_ACCOUNTS = [
  // ASSETS (1000 - 1999)
  { accountCode: "1000", accountName: "Assets", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: null },
  { accountCode: "1100", accountName: "Current Assets", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1000" },
  { accountCode: "1110", accountName: "Cash on Hand", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1100" },
  { accountCode: "1120", accountName: "Bank Accounts", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1100" },
  { accountCode: "1130", accountName: "Accounts Receivable (Control)", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1100" },
  { accountCode: "1140", accountName: "Merchandise Inventory", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1100" },
  { accountCode: "1150", accountName: "Input VAT Receivable (13%)", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1100" },
  { accountCode: "1160", accountName: "Supplier Advances & Prepaid Expenses", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1100" },
  { accountCode: "1500", accountName: "Non-Current & Fixed Assets", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1000" },
  { accountCode: "1510", accountName: "Computers & IT Equipment", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1500" },
  { accountCode: "1520", accountName: "Furniture & Store Fixtures", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1500" },
  { accountCode: "1530", accountName: "Vehicles & Delivery Fleet", accountType: "ASSET", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "1500" },
  { accountCode: "1590", accountName: "Accumulated Depreciation", accountType: "ASSET", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "1500" },

  // LIABILITIES (2000 - 2999)
  { accountCode: "2000", accountName: "Liabilities", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: null },
  { accountCode: "2100", accountName: "Current Liabilities", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "2000" },
  { accountCode: "2110", accountName: "Accounts Payable (Control)", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "2100" },
  { accountCode: "2120", accountName: "Output VAT Payable (13%)", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "2100" },
  { accountCode: "2130", accountName: "Corporate Income Tax / TDS Payable", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "2100" },
  { accountCode: "2140", accountName: "Customer Refunds & Advances Payable", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "2100" },
  { accountCode: "2150", accountName: "Partner Profit Distributions Payable", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "2100" },
  { accountCode: "2500", accountName: "Non-Current Liabilities & Debt", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "2000" },
  { accountCode: "2510", accountName: "Bank Term Loans & Credit Facilities", accountType: "LIABILITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "2500" },

  // EQUITY (3000 - 3999)
  { accountCode: "3000", accountName: "Equity", accountType: "EQUITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: null },
  { accountCode: "3100", accountName: "Share Capital", accountType: "EQUITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "3000" },
  { accountCode: "3200", accountName: "Share Premium / Additional Paid-in Capital", accountType: "EQUITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "3000" },
  { accountCode: "3300", accountName: "Retained Earnings", accountType: "EQUITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "3000" },
  { accountCode: "3400", accountName: "Current Year Profit / Loss", accountType: "EQUITY", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "3000" },
  { accountCode: "3500", accountName: "Partner Drawings", accountType: "EQUITY", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "3000" },

  // REVENUE (4000 - 4999)
  { accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", normalBalance: "CREDIT", isSystemAccount: true, parentCode: null },
  { accountCode: "4100", accountName: "Gross Sales Revenue", accountType: "REVENUE", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "4000" },
  { accountCode: "4200", accountName: "Delivery & Shipping Revenue", accountType: "REVENUE", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "4000" },
  { accountCode: "4500", accountName: "Sales Returns & Allowances", accountType: "REVENUE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "4000" },
  { accountCode: "4600", accountName: "Customer Discounts & Loyalty Rewards", accountType: "REVENUE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "4000" },

  // COST OF GOODS SOLD (5000 - 5999)
  { accountCode: "5000", accountName: "Cost of Sales", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: null },
  { accountCode: "5100", accountName: "Cost of Goods Sold (COGS)", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "5000" },
  { accountCode: "5200", accountName: "Inbound Freight & Customs Duties", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "5000" },
  { accountCode: "5300", accountName: "Packaging & Fulfillment Materials", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "5000" },
  { accountCode: "5400", accountName: "Purchase Returns & Supplier Credits", accountType: "EXPENSE", normalBalance: "CREDIT", isSystemAccount: true, parentCode: "5000" },
  { accountCode: "5500", accountName: "Inventory Damaged & Scrap Loss", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "5000" },

  // OPERATING EXPENSES (6000 - 6999)
  { accountCode: "6000", accountName: "Operating Expenses", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: null },
  { accountCode: "6100", accountName: "Salaries & Wages Expense", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "6000" },
  { accountCode: "6200", accountName: "Office & Store Rent Expense", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "6000" },
  { accountCode: "6300", accountName: "Utilities Expense (Electricity/Internet)", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "6000" },
  { accountCode: "6400", accountName: "Marketing & Advertising Expense", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "6000" },
  { accountCode: "6500", accountName: "Software & Technology Tools", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "6000" },
  { accountCode: "6600", accountName: "Fixed Asset Depreciation Expense", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "6000" },
  { accountCode: "6700", accountName: "Miscellaneous Operating Expenses", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "6000" },

  // FINANCE & OTHER (7000 - 8999)
  { accountCode: "7000", accountName: "Finance Costs & Other", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: null },
  { accountCode: "7100", accountName: "Loan Interest & Financing Cost", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "7000" },
  { accountCode: "7200", accountName: "Bank Fees & Gateway Commissions", accountType: "EXPENSE", normalBalance: "DEBIT", isSystemAccount: true, parentCode: "7000" },
  { accountCode: "8100", accountName: "Other Income / Asset Disposal Gains", accountType: "REVENUE", normalBalance: "CREDIT", isSystemAccount: true, parentCode: null },
];

// Seed Chart of Accounts if empty
export const ensureStandardChartOfAccounts = async () => {
  try {
    const count = await prisma.account.count();
    if (count > 0) {
      // Already seeded - return all accounts
      return await prisma.account.findMany({ orderBy: { accountCode: "asc" } });
    }

    console.log("Seeding Standard Chart of Accounts (COA)...");

    // 1. Create parent accounts first
    const codeToIdMap = {};
    for (const item of STANDARD_CHART_OF_ACCOUNTS.filter((a) => !a.parentCode)) {
      const created = await prisma.account.create({
        data: {
          accountCode: item.accountCode,
          accountName: item.accountName,
          accountType: item.accountType,
          normalBalance: item.normalBalance,
          isSystemAccount: item.isSystemAccount,
          isActive: true,
          currentBalance: 0,
        },
      });
      codeToIdMap[item.accountCode] = created.id;
    }

    // 2. Create child accounts linked to parents
    for (const item of STANDARD_CHART_OF_ACCOUNTS.filter((a) => a.parentCode)) {
      const parentId = codeToIdMap[item.parentCode] || null;
      const created = await prisma.account.create({
        data: {
          accountCode: item.accountCode,
          accountName: item.accountName,
          accountType: item.accountType,
          normalBalance: item.normalBalance,
          parentAccountId: parentId,
          isSystemAccount: item.isSystemAccount,
          isActive: true,
          currentBalance: 0,
        },
      });
      codeToIdMap[item.accountCode] = created.id;
    }

    console.log("Chart of Accounts successfully seeded with standard GAAP accounts.");
    return await prisma.account.findMany({ orderBy: { accountCode: "asc" } });
  } catch (error) {
    console.error("Error seeding Chart of Accounts:", error);
    return [];
  }
};

// Ensure active Fiscal Year & Accounting Period
export const ensureFiscalYearAndPeriod = async (txDate = new Date()) => {
  const d = new Date(txDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const periodName = `${year}-${month}`;
  const fyName = `${year}/${year + 1}`;

  let fiscalYear = await prisma.fiscalYear.findUnique({ where: { name: fyName } });
  if (!fiscalYear) {
    fiscalYear = await prisma.fiscalYear.create({
      data: {
        name: fyName,
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59, 999),
        status: "OPEN",
      },
    });
  }

  let period = await prisma.accountingPeriod.findUnique({
    where: {
      fiscalYearId_periodName: {
        fiscalYearId: fiscalYear.id,
        periodName,
      },
    },
  });

  if (!period) {
    const pStart = new Date(year, d.getMonth(), 1);
    const pEnd = new Date(year, d.getMonth() + 1, 0, 23, 59, 59, 999);
    period = await prisma.accountingPeriod.create({
      data: {
        fiscalYearId: fiscalYear.id,
        periodName,
        startDate: pStart,
        endDate: pEnd,
        status: "OPEN",
      },
    });
  }

  return { fiscalYear, period };
};

// Account Lookup helper
export const getAccountByCode = async (accountCode) => {
  const account = await prisma.account.findUnique({ where: { accountCode } });
  if (!account) {
    throw new Error(`GL Account code ${accountCode} not found in Chart of Accounts.`);
  }
  return account;
};

// ==========================================
// 2. CORE DOUBLE-ENTRY POSTING ENGINE
// ==========================================

/**
 * Atomic Journal Entry Poster
 * Enforces:
 * 1. Total Debits == Total Credits (Zero Imbalance)
 * 2. At least 2 lines
 * 3. Line cannot have both DR and CR
 * 4. Period is OPEN
 * 5. Idempotency (Cannot double post the same operational event)
 */
export const postJournalEntry = async ({
  transactionDate = new Date(),
  sourceType,
  sourceId,
  idempotencyKey,
  referenceNumber = "",
  description,
  lines = [],
  createdBy = "system",
  allowClosedPeriod = false,
}) => {
  if (!lines || lines.length < 2) {
    throw new Error("Double-entry journal must contain at least 2 lines.");
  }

  const cleanDate = transactionDate ? new Date(transactionDate) : new Date();
  const idempKey = idempotencyKey || (sourceType && sourceId ? `${sourceType}:${sourceId}` : null);

  // 1. Idempotency Check
  if (idempKey) {
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { idempotencyKey: idempKey },
      include: { lines: { include: { account: true } } },
    });
    if (existingEntry && existingEntry.status === "POSTED") {
      return existingEntry;
    }
  }

  // 2. Resolve & Validate Fiscal Year and Period
  const { fiscalYear, period } = await ensureFiscalYearAndPeriod(cleanDate);
  if (!allowClosedPeriod && (fiscalYear.status === "CLOSED" || period.status === "CLOSED")) {
    throw new Error(`Cannot post accounting transaction to closed period ${period.periodName} (${fiscalYear.name}).`);
  }

  // 3. Mathematical Double-Entry Balancing Check
  let totalDebit = 0;
  let totalCredit = 0;
  const processedLines = [];

  for (const line of lines) {
    let accountId = line.accountId;
    if (!accountId && line.accountCode) {
      const acc = await getAccountByCode(line.accountCode);
      accountId = acc.id;
    }

    if (!accountId) {
      throw new Error(`Journal line is missing account ID/code.`);
    }

    const debit = Number(Math.max(0, Number(line.debit || 0)).toFixed(2));
    const credit = Number(Math.max(0, Number(line.credit || 0)).toFixed(2));

    if (debit > 0 && credit > 0) {
      throw new Error(`Journal line cannot contain both debit and credit amounts.`);
    }
    if (debit === 0 && credit === 0) {
      continue; // Skip zero balance line
    }

    totalDebit += debit;
    totalCredit += credit;

    processedLines.push({
      accountId,
      debit,
      credit,
      description: line.description || description || "",
      customerId: line.customerId || null,
      customerName: line.customerName || "",
      supplierId: line.supplierId || null,
      supplierName: line.supplierName || "",
      productId: line.productId || null,
      assetId: line.assetId || null,
      costCenter: line.costCenter || "",
    });
  }

  totalDebit = Number(totalDebit.toFixed(2));
  totalCredit = Number(totalCredit.toFixed(2));

  if (processedLines.length < 2) {
    throw new Error("Journal entry must have at least 2 non-zero lines.");
  }

  const imbalance = Math.abs(Number((totalDebit - totalCredit).toFixed(2)));
  if (imbalance > 0.005) {
    throw new Error(`Unbalanced Journal Entry: Total Debits (Rs ${totalDebit}) does not equal Total Credits (Rs ${totalCredit}). Imbalance: Rs ${imbalance}.`);
  }

  // 4. Generate Sequential Journal Number
  const count = await prisma.journalEntry.count();
  const yearStr = cleanDate.getFullYear();
  const journalNumber = `JE-${yearStr}-${String(count + 1).padStart(5, "0")}`;

  // 5. Atomic Prisma Transaction Execution
  const result = await prisma.$transaction(async (tx) => {
    const journalEntry = await tx.journalEntry.create({
      data: {
        journalNumber,
        transactionDate: cleanDate,
        fiscalYearId: fiscalYear.id,
        accountingPeriodId: period.id,
        sourceType: sourceType || "MANUAL_JOURNAL",
        sourceId: sourceId || null,
        idempotencyKey: idempKey,
        referenceNumber: referenceNumber || "",
        description: description || `Journal entry ${journalNumber}`,
        status: "POSTED",
        totalDebit,
        totalCredit,
        createdBy,
        postedAt: new Date(),
        lines: {
          create: processedLines,
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    });

    // Atomically update cached account balances
    for (const line of processedLines) {
      const account = await tx.account.findUnique({ where: { id: line.accountId } });
      if (account) {
        let delta = 0;
        if (account.normalBalance === "DEBIT") {
          delta = line.debit - line.credit;
        } else {
          delta = line.credit - line.debit;
        }
        await tx.account.update({
          where: { id: line.accountId },
          data: {
            currentBalance: { increment: delta },
          },
        });
      }
    }

    return journalEntry;
  });

  return result;
};

// ==========================================
// 3. OPERATIONAL BUSINESS TRANSACTION POSTERS
// ==========================================

/**
 * 1. Sales Invoice & Order Accounting
 * DR Accounts Receivable / Cash: Total MRP Amount
 * CR Sales Revenue: Taxable Base Amount (Ex-13% VAT)
 * CR Output VAT: 13% Embedded VAT
 * DR Cost of Goods Sold (COGS): Direct Product Cost
 * CR Merchandise Inventory: Direct Product Cost
 */
export const postSalesOrderAccounting = async (order) => {
  try {
    if (!order || !order.id) return null;
    const grossAmount = Number(order.amount || 0);
    if (grossAmount <= 0) return null;

    const vatRate = 0.13;
    const taxableRevenue = Number((grossAmount / (1 + vatRate)).toFixed(2));
    const outputVat = Number((grossAmount - taxableRevenue).toFixed(2));

    // Calculate Direct Product COGS from order items
    let items = [];
    try {
      items = typeof order.items === "string" ? JSON.parse(order.items) : (order.items || []);
    } catch {
      items = [];
    }

    let totalCOGS = 0;
    for (const item of items) {
      const pId = item.productId || item._id || item.id;
      const qty = Number(item.quantity || 1);
      if (pId) {
        const product = await prisma.product.findUnique({ where: { id: pId }, select: { costPrice: true } });
        const unitCost = product ? Number(product.costPrice || 0) : 0;
        totalCOGS += unitCost * qty;
      }
    }
    totalCOGS = Number(totalCOGS.toFixed(2));

    const isPrepaid = order.payment === true || order.paymentMethod !== "COD";
    const arOrCashAccount = isPrepaid ? "1120" : "1130"; // 1120 Bank if online, 1130 AR if COD

    const lines = [
      // Revenue Leg
      {
        accountCode: arOrCashAccount,
        debit: grossAmount,
        credit: 0,
        description: `Receivable/Payment for Order #${order.id.slice(-6)}`,
        customerId: order.userId,
      },
      {
        accountCode: "4100",
        debit: 0,
        credit: taxableRevenue,
        description: `Taxable Sales Revenue for Order #${order.id.slice(-6)}`,
        customerId: order.userId,
      },
      {
        accountCode: "2120",
        debit: 0,
        credit: outputVat,
        description: `13% Output VAT Collected for Order #${order.id.slice(-6)}`,
      },
    ];

    // Inventory Perpetual Leg
    if (totalCOGS > 0) {
      lines.push(
        {
          accountCode: "5100",
          debit: totalCOGS,
          credit: 0,
          description: `COGS for Order #${order.id.slice(-6)}`,
        },
        {
          accountCode: "1140",
          debit: 0,
          credit: totalCOGS,
          description: `Inventory reduction for Order #${order.id.slice(-6)}`,
        }
      );
    }

    const dateVal = order.date ? new Date(Number(order.date)) : new Date();

    return await postJournalEntry({
      transactionDate: dateVal,
      sourceType: "SALES_INVOICE",
      sourceId: order.id,
      idempotencyKey: `SALES_INVOICE:${order.id}`,
      referenceNumber: `ORD-${order.id.slice(-6)}`,
      description: `Sales Revenue & COGS recognition for Order #${order.id.slice(-6)} (${order.paymentMethod})`,
      lines,
    });
  } catch (error) {
    console.error("Error in postSalesOrderAccounting:", error);
    throw error;
  }
};

/**
 * 2. Customer Payment Received (Clearing Accounts Receivable)
 * DR Cash/Bank (1110/1120)
 * CR Accounts Receivable (1130)
 */
export const postCustomerPaymentAccounting = async (paramsOrOrder) => {
  try {
    const orderId = paramsOrOrder.orderId || paramsOrOrder.id;
    const customerName = paramsOrOrder.customerName || (paramsOrOrder.userId ? `Customer (${paramsOrOrder.userId.slice(-6)})` : "Customer");
    const amt = Number(paramsOrOrder.amount || 0);
    const depositAccountType = paramsOrOrder.depositAccountType || "BANK";
    const referenceNumber = paramsOrOrder.referenceNumber;

    if (amt <= 0) return null;

    const bankOrCashCode = depositAccountType === "CASH" ? "1110" : "1120";

    return await postJournalEntry({
      transactionDate: new Date(),
      sourceType: "CUSTOMER_PAYMENT",
      sourceId: orderId,
      idempotencyKey: `CUSTOMER_PAYMENT:${orderId}:${amt}`,
      referenceNumber: referenceNumber || `PAY-${orderId ? orderId.slice(-6) : Date.now()}`,
      description: `Customer payment received from ${customerName || "Customer"}`,
      lines: [
        {
          accountCode: bankOrCashCode,
          debit: amt,
          credit: 0,
          description: `Cash/Bank receipt for Order #${orderId ? orderId.slice(-6) : ""}`,
        },
        {
          accountCode: "1130",
          debit: 0,
          credit: amt,
          description: `Clear Accounts Receivable for Order #${orderId ? orderId.slice(-6) : ""}`,
          customerName,
        },
      ],
    });
  } catch (error) {
    console.error("Error in postCustomerPaymentAccounting:", error);
    throw error;
  }
};

/**
 * 3. Inbound Supplier Shipment / Inventory Purchase
 * DR Merchandise Inventory (1140): Ex-VAT Base Cost
 * DR Input VAT Receivable (1150): 13% Tax
 * CR Bank (1120) [paidAmount] and/or CR Accounts Payable (2110) [payableAmount]
 */
export const postInboundShipmentAccounting = async (shipmentOrParams, opts = {}) => {
  try {
    const shipmentId = shipmentOrParams.shipmentId || shipmentOrParams.id;
    const batchNumber = shipmentOrParams.batchNumber || `BATCH-${Date.now().toString().slice(-4)}`;
    const carrier = shipmentOrParams.carrier || "Freight Carrier";
    const supplierName = shipmentOrParams.supplierName || opts.supplierName || "Supplier";
    const freight = Number(shipmentOrParams.totalFreightCost || 0);
    const taxes = Number(shipmentOrParams.customsOrTaxes || 0);
    const itemsCost = Number(shipmentOrParams.totalItemsCost || shipmentOrParams.itemsTotalCost || 0);
    const totalBatchCost = Number((freight + taxes + itemsCost).toFixed(2));

    if (totalBatchCost <= 0) return null;

    let paidAmount = Number(shipmentOrParams.paidAmount || opts.paidAmount || 0);
    let payableAmount = Number(shipmentOrParams.payableAmount || opts.payableAmount || 0);

    // If neither explicitly provided, infer from paidFromAccountId or isCredit
    if (paidAmount === 0 && payableAmount === 0) {
      if (shipmentOrParams.paidFromAccountId && (shipmentOrParams.isCredit === false || opts.recordAsPayable === false)) {
        paidAmount = totalBatchCost;
      } else {
        payableAmount = totalBatchCost;
      }
    }

    const lines = [
      {
        accountCode: "1140",
        debit: Number((freight + itemsCost).toFixed(2)),
        credit: 0,
        description: `Inventory & Freight landed cost for Batch ${batchNumber} (${supplierName})`,
        supplierName,
      },
    ];

    if (taxes > 0) {
      lines.push({
        accountCode: "1150",
        debit: taxes,
        credit: 0,
        description: `Input VAT / Customs Duty for Batch ${batchNumber}`,
      });
    }

    // Split credits between Bank (paidAmount) and Accounts Payable (payableAmount)
    if (paidAmount > 0) {
      lines.push({
        accountCode: "1120",
        debit: 0,
        credit: paidAmount,
        description: `Upfront payment to ${supplierName} / ${carrier} for Batch ${batchNumber}`,
        supplierName,
      });
    }

    if (payableAmount > 0) {
      lines.push({
        accountCode: "2110",
        debit: 0,
        credit: payableAmount,
        description: `Accounts Payable liability owed to ${supplierName} for Batch ${batchNumber}`,
        supplierName,
      });
    }

    return await postJournalEntry({
      transactionDate: shipmentOrParams.shipmentDate ? new Date(shipmentOrParams.shipmentDate) : new Date(),
      sourceType: "PURCHASE_BILL",
      sourceId: shipmentId || batchNumber,
      idempotencyKey: `PURCHASE_BILL:${shipmentId || batchNumber}`,
      referenceNumber: batchNumber,
      description: `Inbound inventory purchase & freight landed cost for ${batchNumber} (${supplierName})`,
      lines,
    });
  } catch (error) {
    console.error("Error in postInboundShipmentAccounting:", error);
    throw error;
  }
};

/**
 * 4. Supplier Payable Settlement
 * DR Accounts Payable (2110)
 * CR Bank Accounts (1120) / Cash (1110)
 */
export const postSupplierPaymentAccounting = async ({
  payableId,
  payeeName,
  amount,
  fromAccountType = "BANK",
  referenceNumber,
}) => {
  try {
    const amt = Number(amount || 0);
    if (amt <= 0) return null;

    const cashBankCode = fromAccountType === "CASH" ? "1110" : "1120";

    return await postJournalEntry({
      transactionDate: new Date(),
      sourceType: "SUPPLIER_PAYMENT",
      sourceId: payableId,
      idempotencyKey: `SUPPLIER_PAYMENT:${payableId}:${Date.now()}`,
      referenceNumber: referenceNumber || `SETTLE-${payableId ? payableId.slice(-6) : ""}`,
      description: `Payable settlement paid to ${payeeName}`,
      lines: [
        {
          accountCode: "2110",
          debit: amt,
          credit: 0,
          description: `Settle Accounts Payable for ${payeeName}`,
          supplierName: payeeName,
        },
        {
          accountCode: cashBankCode,
          debit: 0,
          credit: amt,
          description: `Disbursed from liquid account to ${payeeName}`,
        },
      ],
    });
  } catch (error) {
    console.error("Error in postSupplierPaymentAccounting:", error);
    throw error;
  }
};

/**
 * 5. Customer Return (RMA) & Sales Reversal
 * DR Sales Returns (4500): Ex-VAT Base
 * DR Output VAT Adjustment (2120): 13% VAT
 * CR Cash/Bank (1110/1120) or Customer Refund Payable (2140) / AP (2110)
 * (If restocked): DR Merchandise Inventory (1140), CR COGS (5100)
 */
export const postCustomerReturnAccounting = async (returnOrParams, opts = {}) => {
  try {
    const returnId = returnOrParams.returnId || returnOrParams.id;
    const customerName = returnOrParams.customerName || "Customer";
    const totalRefund = Number(returnOrParams.totalRefundAmount || returnOrParams.refundAmount || 0);
    if (totalRefund <= 0) return null;

    const vat = Number(returnOrParams.vatRefunded || (totalRefund - totalRefund / 1.13).toFixed(2));
    const netReturn = Number((totalRefund - vat).toFixed(2));
    const isPayable = opts.recordAsPayable !== undefined ? opts.recordAsPayable : returnOrParams.refundMethod === "PAYABLE";
    const refundMethod = returnOrParams.refundMethod || (isPayable ? "PAYABLE" : "CASH");
    const creditAccount = isPayable ? "2110" : refundMethod === "BANK_TRANSFER" ? "1120" : refundMethod === "CASH" ? "1110" : "2140";

    const lines = [
      {
        accountCode: "4500",
        debit: netReturn,
        credit: 0,
        description: `Sales Return ex-VAT for RMA #${returnId ? returnId.slice(-6) : ""}`,
        customerName,
      },
      {
        accountCode: "2120",
        debit: vat,
        credit: 0,
        description: `Output VAT adjustment for RMA #${returnId ? returnId.slice(-6) : ""}`,
      },
      {
        accountCode: creditAccount,
        debit: 0,
        credit: totalRefund,
        description: `Refund payout/credit to ${customerName}`,
        customerName,
      },
    ];

    const restockCost = Number(returnOrParams.restockedInventoryCost || 0);
    if (restockCost > 0) {
      lines.push(
        {
          accountCode: "1140",
          debit: restockCost,
          credit: 0,
          description: `Restock inventory for RMA #${returnId ? returnId.slice(-6) : ""}`,
        },
        {
          accountCode: "5100",
          debit: 0,
          credit: restockCost,
          description: `Reverse COGS for restocked item in RMA #${returnId ? returnId.slice(-6) : ""}`,
        }
      );
    }

    return await postJournalEntry({
      transactionDate: returnOrParams.returnDate ? new Date(returnOrParams.returnDate) : new Date(),
      sourceType: "SALES_RETURN",
      sourceId: returnId,
      idempotencyKey: `SALES_RETURN:${returnId}`,
      referenceNumber: `RMA-${returnId ? returnId.slice(-6) : ""}`,
      description: `Customer Return RMA refund and revenue reversal for ${customerName}`,
      lines,
    });
  } catch (error) {
    console.error("Error in postCustomerReturnAccounting:", error);
    throw error;
  }
};

/**
 * Direct expense posting (flexible signature accepting entity object or named params)
 * DR Relevant Operating Expense (6100-6700)
 * CR Bank/Cash (1120/1110) or Accounts Payable (2110)
 */
export const postDirectExpenseAccounting = async (params) => {
  return postExpenseAccounting({
    expenseId: params.expenseId || `EXP-${Date.now()}`,
    category: params.category || "EXPENSE",
    title: params.description || params.title || "Operating Expense",
    amount: params.amount,
    paidFromAccountType: params.fromAccountId ? "BANK" : "BANK",
    isPayable: false,
    payeeName: params.payeeName || "Vendor",
  });
};

/**
 * 6. Operating / Monthly Expenses
 * DR Relevant Operating Expense (6100 - 6700)
 * CR Bank/Cash (1120/1110) or Accounts Payable (2110)
 */
export const postExpenseAccounting = async ({
  expenseId,
  category,
  title,
  amount,
  paidFromAccountType = "BANK",
  isPayable = false,
  payeeName,
}) => {
  try {
    const amt = Number(amount || 0);
    if (amt <= 0) return;

    let expenseCode = "6700"; // Miscellaneous
    const cat = (category || "").toUpperCase();
    if (cat.includes("SALAR")) expenseCode = "6100";
    else if (cat.includes("RENT")) expenseCode = "6200";
    else if (cat.includes("UTILIT")) expenseCode = "6300";
    else if (cat.includes("MARKET") || cat.includes("ADS")) expenseCode = "6400";
    else if (cat.includes("SOFTWARE") || cat.includes("TOOL")) expenseCode = "6500";

    const creditCode = isPayable ? "2110" : paidFromAccountType === "CASH" ? "1110" : "1120";

    await postJournalEntry({
      transactionDate: new Date(),
      sourceType: "EXPENSE_PAYMENT",
      sourceId: expenseId,
      idempotencyKey: `EXPENSE:${expenseId}:${amt}`,
      referenceNumber: `EXP-${expenseId ? expenseId.slice(-6) : Date.now()}`,
      description: title || `Operating expense: ${category}`,
      lines: [
        {
          accountCode: expenseCode,
          debit: amt,
          credit: 0,
          description: title || `Expense: ${category}`,
        },
        {
          accountCode: creditCode,
          debit: 0,
          credit: amt,
          description: isPayable ? `Recorded as liability to ${payeeName || "Vendor"}` : `Paid from liquid treasury`,
          supplierName: payeeName,
        },
      ],
    });
  } catch (error) {
    console.error("Error in postExpenseAccounting:", error);
  }
};

/**
 * 7. Fixed Asset Purchase - flexible for direct entity arg or named params with partial payment split
 */
export const postFixedAssetPurchaseAccounting = async (assetOrParams, opts = {}) => {
  const asset = assetOrParams;
  const vendorName = asset.vendorName || opts.vendorName || "Asset Vendor";
  try {
    const cost = Number(asset.purchaseCost || asset.cost || 0);
    if (cost <= 0) return null;

    let assetCode = "1510";
    if (asset.category === "FURNITURE_FIXTURES") assetCode = "1520";
    else if (asset.category === "VEHICLES") assetCode = "1530";

    let paidAmount = Number(asset.paidAmount || opts.paidAmount || 0);
    let payableAmount = Number(asset.payableAmount || opts.payableAmount || 0);

    if (paidAmount === 0 && payableAmount === 0) {
      if (asset.paidFromAccountId && !opts.recordAsPayable && !asset.isPayable) {
        paidAmount = cost;
      } else {
        payableAmount = cost;
      }
    }

    const lines = [
      {
        accountCode: assetCode,
        debit: cost,
        credit: 0,
        description: `Capitalized Asset: ${asset.assetName} (${vendorName})`,
        assetId: asset.id,
        supplierName: vendorName,
      },
    ];

    if (paidAmount > 0) {
      lines.push({
        accountCode: "1120",
        debit: 0,
        credit: paidAmount,
        description: `Paid from liquid bank account for ${asset.assetName}`,
        supplierName: vendorName,
      });
    }

    if (payableAmount > 0) {
      lines.push({
        accountCode: "2110",
        debit: 0,
        credit: payableAmount,
        description: `Asset liability payable to ${vendorName}`,
        supplierName: vendorName,
      });
    }

    const result = await postJournalEntry({
      transactionDate: asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(),
      sourceType: "ASSET_PURCHASE",
      sourceId: asset.id,
      idempotencyKey: `ASSET_PURCHASE:${asset.id}`,
      referenceNumber: asset.assetTag || asset.id,
      description: `Fixed Asset Acquisition: ${asset.assetName} (${asset.assetTag || asset.id}) from ${vendorName}`,
      lines,
    });
    return result;
  } catch (error) {
    console.error("Error in postFixedAssetPurchaseAccounting:", error);
    throw error;
  }
};

/**
 * 8. Fixed Asset Depreciation Run - accepts { totalDepreciation, count, date } or { periodName, totalDepreciation }
 * DR Depreciation Expense (6600)
 * CR Accumulated Depreciation (1590)
 */
export const postDepreciationAccounting = async (params) => {
  try {
    const depAmt = Number(params.totalDepreciation || 0);
    if (depAmt <= 0) return;

    const periodName = params.periodName ||
      (params.date ? `${new Date(params.date).getFullYear()}-${String(new Date(params.date).getMonth() + 1).padStart(2, '0')}` : `BATCH-${Date.now()}`);

    const result = await postJournalEntry({
      transactionDate: params.date ? new Date(params.date) : new Date(),
      sourceType: "ASSET_DEPRECIATION",
      sourceId: `DEP-${periodName}`,
      idempotencyKey: `ASSET_DEPRECIATION:${periodName}:${depAmt}`,
      referenceNumber: `DEP-${periodName}`,
      description: `Fixed Asset Depreciation batch for period ${periodName} (${params.count || 1} assets)`,
      lines: [
        {
          accountCode: "6600",
          debit: depAmt,
          credit: 0,
          description: `Depreciation expense for ${periodName}`,
        },
        {
          accountCode: "1590",
          debit: 0,
          credit: depAmt,
          description: `Accumulated depreciation for ${periodName}`,
        },
      ],
    });
    return result;
  } catch (error) {
    console.error("Error in postDepreciationAccounting:", error);
  }
};

/**
 * 9. Loan Disbursement - flexible: accepts full entity or named params
 * DR Bank Accounts (1120)
 * CR Bank Term Loans & Borrowings (2510)
 */
export const postLoanDisbursementAccounting = async (loanOrParams) => {
  try {
    const principal = Number(loanOrParams.principalAmount || loanOrParams.principal || 0);
    const lenderName = loanOrParams.investorName || loanOrParams.lenderName || "Lender";
    const loanId = loanOrParams.id || loanOrParams.loanId || `LOAN-${Date.now()}`;
    if (principal <= 0) return;

    const result = await postJournalEntry({
      transactionDate: loanOrParams.startDate ? new Date(loanOrParams.startDate) : new Date(),
      sourceType: "LOAN_DISBURSEMENT",
      sourceId: loanId,
      idempotencyKey: `LOAN_DISBURSEMENT:${loanId}`,
      referenceNumber: `LOAN-${loanId.slice(-6)}`,
      description: `Loan facility disbursement from ${lenderName} (Rs ${principal.toLocaleString()} at ${loanOrParams.interestRate || 0}% APR)`,
      lines: [
        {
          accountCode: "1120",
          debit: principal,
          credit: 0,
          description: `Loan funds received into bank from ${lenderName}`,
        },
        {
          accountCode: "2510",
          debit: 0,
          credit: principal,
          description: `Borrowing liability created to ${lenderName}`,
        },
      ],
    });
    return result;
  } catch (error) {
    console.error("Error in postLoanDisbursementAccounting:", error);
  }
};

/**
 * 10. Loan Repayment (Principal + Interest Split) - flexible signature
 * DR Bank Term Loans (2510): Principal Portion
 * DR Loan Interest Expense (7100): Interest Expense Portion  
 * CR Bank Accounts (1120): Total Repayment
 */
export const postLoanRepaymentAccounting = async (params) => {
  try {
    // Support both: ({ liability, amount, principalPortion, interestPortion }) and ({ liabilityId, lenderName, totalAmount, principalPortion, interestPortion })
    const liability = params.liability || {};
    const total = Number(params.amount || params.totalAmount || 0);
    const p = Number(params.principalPortion || total);
    const i = Number(params.interestPortion || 0);
    const lenderName = liability.investorName || params.lenderName || "Lender";
    const liabilityId = liability.id || params.liabilityId || `REPAY-${Date.now()}`;

    if (total <= 0) return;

    const lines = [
      {
        accountCode: "2510",
        debit: p,
        credit: 0,
        description: `Principal reduction on loan to ${lenderName}`,
      },
    ];

    if (i > 0) {
      lines.push({
        accountCode: "7100",
        debit: i,
        credit: 0,
        description: `Finance interest expense on loan to ${lenderName}`,
      });
    }

    lines.push({
      accountCode: "1120",
      debit: 0,
      credit: total,
      description: `EMI payment disbursed from bank to ${lenderName}`,
    });

    const result = await postJournalEntry({
      transactionDate: new Date(),
      sourceType: "LOAN_REPAYMENT",
      sourceId: liabilityId,
      idempotencyKey: `LOAN_REPAYMENT:${liabilityId}:${total}:${Date.now()}`,
      referenceNumber: `EMI-${liabilityId.slice(-6)}`,
      description: `Loan EMI repayment to ${lenderName} (Principal: Rs ${p}, Interest: Rs ${i})`,
      lines,
    });
    return result;
  } catch (error) {
    console.error("Error in postLoanRepaymentAccounting:", error);
  }
};

/**
 * 11. Primary Share Issuance (Equity Capital Injection) - flexible signature
 * DR Bank Accounts (1120): Investment Inflow
 * CR Share Capital (3100): Share Capital Issued
 */
export const postShareIssuanceAccounting = async (params) => {
  try {
    // Support: ({ investorPartner, valuationRecord, invAmt, depositAccountId }) and ({ investorName, investmentAmount, roundName })
    const investorName = params.investorName ||
      (params.investorPartner ? params.investorPartner.partnerName : "Investor");
    const amount = Number(params.invAmt || params.investmentAmount || 0);
    const roundName = params.roundName ||
      (params.valuationRecord ? params.valuationRecord.id : "EQUITY-ROUND");
    const sourceId = (params.valuationRecord ? params.valuationRecord.id : null) ||
      params.sourceId || `EQ-${Date.now()}`;
    if (amount <= 0) return;

    const result = await postJournalEntry({
      transactionDate: new Date(),
      sourceType: "CAPITAL_INJECTION",
      sourceId,
      idempotencyKey: `CAPITAL_INJECTION:${sourceId}`,
      referenceNumber: roundName || "EQUITY-ROUND",
      description: `Primary Share Issuance: ${investorName} invested Rs ${amount.toLocaleString()}`,
      lines: [
        {
          accountCode: "1120",
          debit: amount,
          credit: 0,
          description: `Capital inflow from ${investorName}`,
        },
        {
          accountCode: "3100",
          debit: 0,
          credit: amount,
          description: `Share Capital equity issued in ${roundName}`,
        },
      ],
    });
    return result;
  } catch (error) {
    console.error("Error in postShareIssuanceAccounting:", error);
  }
};

/**
 * 11b. Share Buyback (Company Repurchases Shares)
 * DR Share Capital (3100): Face Value Retired
 * CR Bank Accounts (1120): Buyback Payout
 */
export const postShareBuybackAccounting = async (params) => {
  try {
    const total = Number(params.totalTransactionValue || params.totalAmount || 0);
    if (total <= 0) return;
    const sellerName = params.seller ? params.seller.partnerName : (params.sellerName || "Shareholder");
    const sourceId = `BUYBACK-${params.seller ? params.seller.id : Date.now()}`;

    const result = await postJournalEntry({
      transactionDate: new Date(),
      sourceType: "SHARE_BUYBACK",
      sourceId,
      idempotencyKey: `SHARE_BUYBACK:${sourceId}`,
      referenceNumber: sourceId,
      description: `Company Share Buyback: Repurchased from ${sellerName}`,
      lines: [
        {
          accountCode: "3100",
          debit: total,
          credit: 0,
          description: `Share capital retired - bought back from ${sellerName}`,
        },
        {
          accountCode: "1120",
          debit: 0,
          credit: total,
          description: `Buyback payout to ${sellerName}`,
        },
      ],
    });
    return result;
  } catch (error) {
    console.error("Error in postShareBuybackAccounting:", error);
  }
};

/**
 * 12. Reversal Engine
 * Reverses a posted journal entry atomically with reciprocal DR/CR.
 */
export const reverseJournalEntryById = async ({ journalEntryId, reversalReason, reversedBy = "admin" }) => {
  const original = await prisma.journalEntry.findUnique({
    where: { id: journalEntryId },
    include: { lines: true },
  });

  if (!original) {
    throw new Error("Journal entry not found.");
  }
  if (original.status === "REVERSED") {
    throw new Error("Journal entry is already reversed.");
  }

  // Create reciprocal reversed lines (DR becomes CR, CR becomes DR)
  const reversedLines = original.lines.map((l) => ({
    accountId: l.accountId,
    debit: l.credit,
    credit: l.debit,
    description: `Reversal of ${original.journalNumber}: ${l.description || ""}`,
    customerId: l.customerId,
    customerName: l.customerName,
    supplierId: l.supplierId,
    supplierName: l.supplierName,
    productId: l.productId,
    assetId: l.assetId,
  }));

  const reversalResult = await postJournalEntry({
    transactionDate: new Date(),
    sourceType: "REVERSAL",
    sourceId: `REV-${original.id}`,
    idempotencyKey: `REVERSAL:${original.id}`,
    referenceNumber: `REV-${original.journalNumber}`,
    description: `Reversal of ${original.journalNumber}. Reason: ${reversalReason || "User Requested Reversal"}`,
    lines: reversedLines,
    createdBy: reversedBy,
    allowClosedPeriod: true,
  });

  // Mark original as REVERSED
  await prisma.journalEntry.update({
    where: { id: original.id },
    data: {
      status: "REVERSED",
      reversedEntryId: reversalResult.id,
      reversalReason: reversalReason || "Reversed by user",
    },
  });

  return reversalResult;
};

/**
 * reverseJournalEntry - convenience alias accepting (journalEntryId, reason) args
 */
export const reverseJournalEntry = async (journalEntryId, reversalReason = "Reversal") => {
  return reverseJournalEntryById({ journalEntryId, reversalReason });
};

/**
 * postSupplierPaymentAccounting - flexible signature
 * Accepts (payable, { amount, fromAccountId }) from financialController
 */
export const postSupplierPaymentAccountingFromPayable = async (payable, opts = {}) => {
  return postSupplierPaymentAccounting({
    payableId: payable.id,
    payeeName: payable.payeeName,
    amount: opts.amount,
  });
};
