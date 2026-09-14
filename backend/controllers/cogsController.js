import { prisma } from "../config/db.js";

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

// ─── GET FULL COGS & MANUFACTURER PROFIT MARGIN OVERVIEW ────────────────────
const getCOGSOverview = async (req, res) => {
  try {
    const [products, manufacturerInventories, manufacturers] = await Promise.all([
      prisma.product.findMany({
        orderBy: { date: "desc" },
      }),
      prisma.manufacturerInventory.findMany({
        include: {
          manufacturer: {
            select: {
              id: true,
              name: true,
              city: true,
              qualityRating: true,
              isActive: true,
              isAvailable: true,
            },
          },
        },
      }),
      prisma.manufacturer.findMany({
        where: { isActive: true },
        select: { id: true, name: true, city: true, qualityRating: true },
      }),
    ]);

    // Group inventory by Product
    const productMfgMap = {};
    manufacturerInventories.forEach((inv) => {
      if (!productMfgMap[inv.productId]) {
        productMfgMap[inv.productId] = [];
      }
      productMfgMap[inv.productId].push({
        id: inv.id,
        manufacturerId: inv.manufacturerId,
        manufacturerName: inv.manufacturer?.name,
        manufacturerCity: inv.manufacturer?.city,
        qualityRating: inv.manufacturer?.qualityRating || 5.0,
        quantity: inv.quantity,
        reservedQty: inv.reservedQty,
        availableQty: Math.max(0, inv.quantity - inv.reservedQty),
        proposedCostPrice: inv.proposedCostPrice,
        agreedCostPrice: inv.agreedCostPrice,
        priceStatus: inv.priceStatus || "PENDING",
        priceNote: inv.priceNote,
        adminFeedback: inv.adminFeedback,
        variantsStock: typeof inv.variantsStock === "string" ? JSON.parse(inv.variantsStock) : (inv.variantsStock || []),
        lastUpdated: inv.lastUpdated,
      });
    });

    // Build Product Matrix
    let pendingProposalsCount = 0;
    const matrix = products.map((product) => {
      const mfgList = productMfgMap[product.id] || [];
      const sellingPrice = Number(product.price) || 0;

      // Calculate per-manufacturer economics
      const manufacturerPricing = mfgList.map((m) => {
        if (m.priceStatus === "PENDING" && m.proposedCostPrice) {
          pendingProposalsCount++;
        }
        const activeCost = m.agreedCostPrice !== null && m.agreedCostPrice !== undefined
          ? Number(m.agreedCostPrice)
          : (m.proposedCostPrice ? Number(m.proposedCostPrice) : 0);

        const marginAmount = sellingPrice > 0 && activeCost > 0 ? sellingPrice - activeCost : 0;
        const marginPercentage = sellingPrice > 0 && activeCost > 0 ? ((marginAmount / sellingPrice) * 100) : 0;
        const markupMultiple = activeCost > 0 ? (sellingPrice / activeCost) : 0;

        let marginHealth = "UNSET";
        if (activeCost > 0) {
          if (marginPercentage >= 45) marginHealth = "HEALTHY";
          else if (marginPercentage >= 25) marginHealth = "MODERATE";
          else marginHealth = "CRITICAL";
        }

        return {
          ...m,
          activeCostPrice: activeCost,
          marginAmount: Math.round(marginAmount * 100) / 100,
          marginPercentage: Math.round(marginPercentage * 10) / 10,
          markupMultiple: Math.round(markupMultiple * 100) / 100,
          marginHealth,
        };
      });

      // Average agreed cost across manufacturers for this product
      const validAgreedCosts = manufacturerPricing
        .filter((m) => m.agreedCostPrice > 0)
        .map((m) => Number(m.agreedCostPrice));

      const avgAgreedCost = validAgreedCosts.length > 0
        ? validAgreedCosts.reduce((a, b) => a + b, 0) / validAgreedCosts.length
        : 0;

      const minAgreedCost = validAgreedCosts.length > 0 ? Math.min(...validAgreedCosts) : 0;
      const maxAgreedCost = validAgreedCosts.length > 0 ? Math.max(...validAgreedCosts) : 0;

      const avgMarginAmount = sellingPrice > 0 && avgAgreedCost > 0 ? sellingPrice - avgAgreedCost : 0;
      const avgMarginPercentage = sellingPrice > 0 && avgAgreedCost > 0 ? ((avgMarginAmount / sellingPrice) * 100) : 0;

      const totalPhysicalStock = mfgList.reduce((sum, m) => sum + (m.quantity || 0), 0);
      const totalAvailableStock = mfgList.reduce((sum, m) => sum + (m.availableQty || 0), 0);

      return {
        id: product.id,
        name: product.name,
        image: product.image,
        category: parseCategories(product.category),
        subCategory: product.subCategory,
        sellingPrice,
        discount: Number(product.discount) || 0,
        sizes: typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes,
        colors: typeof product.colors === "string" ? JSON.parse(product.colors) : product.colors,
        variants: typeof product.variants === "string" ? JSON.parse(product.variants) : product.variants,
        totalPhysicalStock,
        totalAvailableStock,
        manufacturerPricing,
        hubsCount: manufacturerPricing.length,
        avgAgreedCost: Math.round(avgAgreedCost * 100) / 100,
        minAgreedCost,
        maxAgreedCost,
        avgMarginAmount: Math.round(avgMarginAmount * 100) / 100,
        avgMarginPercentage: Math.round(avgMarginPercentage * 10) / 10,
        published: product.published,
      };
    });

    // Summary KPIs
    const totalProducts = products.length;
    const productsWithAgreedPricing = matrix.filter((p) => p.avgAgreedCost > 0).length;
    const overallAvgMargin = matrix.filter((p) => p.avgMarginPercentage > 0).length > 0
      ? matrix
          .filter((p) => p.avgMarginPercentage > 0)
          .reduce((sum, p) => sum + p.avgMarginPercentage, 0) /
        matrix.filter((p) => p.avgMarginPercentage > 0).length
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          productsWithAgreedPricing,
          pendingProposalsCount,
          overallAvgMargin: Math.round(overallAvgMargin * 10) / 10,
          totalRegisteredManufacturers: manufacturers.length,
        },
        matrix,
        manufacturers,
      },
    });
  } catch (error) {
    console.error("getCOGSOverview error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: ACCEPT MANUFACTURER PROPOSED PRICE ───────────────────────────────
const acceptProposedPrice = async (req, res) => {
  try {
    const { inventoryId, manufacturerId, productId, adminFeedback } = req.body;

    let targetInventory;
    if (inventoryId) {
      targetInventory = await prisma.manufacturerInventory.findUnique({ where: { id: inventoryId } });
    } else if (manufacturerId && productId) {
      targetInventory = await prisma.manufacturerInventory.findUnique({
        where: { manufacturerId_productId: { manufacturerId, productId } },
      });
    }

    if (!targetInventory) {
      return res.json({ success: false, message: "Manufacturer inventory record not found" });
    }

    if (!targetInventory.proposedCostPrice || targetInventory.proposedCostPrice <= 0) {
      return res.json({ success: false, message: "No valid proposed price found to accept" });
    }

    const updated = await prisma.manufacturerInventory.update({
      where: { id: targetInventory.id },
      data: {
        agreedCostPrice: targetInventory.proposedCostPrice,
        priceStatus: "APPROVED",
        adminFeedback: adminFeedback || "Price accepted by Admin",
      },
    });

    // Also update product.costPrice benchmark if unset
    await prisma.product.updateMany({
      where: { id: targetInventory.productId, costPrice: { lte: 0 } },
      data: { costPrice: targetInventory.proposedCostPrice },
    });

    res.json({
      success: true,
      message: `Agreed cost price of Rs ${targetInventory.proposedCostPrice} approved successfully!`,
      inventory: updated,
    });
  } catch (error) {
    console.error("acceptProposedPrice error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: REJECT MANUFACTURER PROPOSED PRICE ───────────────────────────────
const rejectProposedPrice = async (req, res) => {
  try {
    const { inventoryId, manufacturerId, productId, rejectionReason, adminFeedback } = req.body;

    let targetInventory;
    if (inventoryId) {
      targetInventory = await prisma.manufacturerInventory.findUnique({ where: { id: inventoryId } });
    } else if (manufacturerId && productId) {
      targetInventory = await prisma.manufacturerInventory.findUnique({
        where: { manufacturerId_productId: { manufacturerId, productId } },
      });
    }

    if (!targetInventory) {
      return res.json({ success: false, message: "Manufacturer inventory record not found" });
    }

    const feedback = rejectionReason || adminFeedback || "Proposed cost exceeds target margin. Please review.";

    const updated = await prisma.manufacturerInventory.update({
      where: { id: targetInventory.id },
      data: {
        priceStatus: "REJECTED",
        adminFeedback: feedback,
      },
    });

    res.json({
      success: true,
      message: "Proposed price rejected. Manufacturer will be notified to revise quotation.",
      inventory: updated,
    });
  } catch (error) {
    console.error("rejectProposedPrice error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: GET PENDING PRICE PROPOSALS ───────────────────────────────────────
const getPendingProposals = async (req, res) => {
  try {
    const pendingList = await prisma.manufacturerInventory.findMany({
      where: {
        priceStatus: "PENDING",
        proposedCostPrice: { gt: 0 },
      },
      include: {
        manufacturer: {
          select: { id: true, name: true, city: true, qualityRating: true },
        },
      },
      orderBy: { lastUpdated: "desc" },
    });

    // Attach product retail selling prices
    const productIds = pendingList.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, image: true, category: true },
    });
    const prodMap = {};
    products.forEach((p) => {
      prodMap[p.id] = p;
    });

    const enriched = pendingList.map((item) => {
      const prod = prodMap[item.productId];
      const sellingPrice = prod ? Number(prod.price) : 0;
      const proposedCost = Number(item.proposedCostPrice) || 0;
      const currentAgreed = item.agreedCostPrice ? Number(item.agreedCostPrice) : null;
      const projectedMarginAmount = sellingPrice > 0 ? sellingPrice - proposedCost : 0;
      const projectedMarginPct = sellingPrice > 0 ? ((projectedMarginAmount / sellingPrice) * 100) : 0;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName || prod?.name,
        productImage: prod?.image,
        sellingPrice,
        manufacturerId: item.manufacturerId,
        manufacturerName: item.manufacturer?.name,
        manufacturerCity: item.manufacturer?.city,
        qualityRating: item.manufacturer?.qualityRating || 5.0,
        currentAgreedCost: currentAgreed,
        proposedCostPrice: proposedCost,
        priceNote: item.priceNote,
        projectedMarginAmount: Math.round(projectedMarginAmount * 100) / 100,
        projectedMarginPercentage: Math.round(projectedMarginPct * 10) / 10,
        lastUpdated: item.lastUpdated,
      };
    });

    res.json({ success: true, proposals: enriched });
  } catch (error) {
    console.error("getPendingProposals error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getCOGSOverview,
  acceptProposedPrice,
  rejectProposedPrice,
  getPendingProposals,
};
