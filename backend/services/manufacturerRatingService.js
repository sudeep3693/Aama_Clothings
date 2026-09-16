import { prisma } from "../config/db.js";

/**
 * Safely parse JSON or return fallback
 */
const parseJSON = (val, fallback = []) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

/**
 * Recalculates the quality rating of a manufacturer based on actual customer reviews
 * of the products and orders they fulfilled.
 */
export const syncManufacturerRating = async (manufacturerId) => {
  try {
    if (!manufacturerId) return null;

    // 1. Find all order assignments fulfilled/handled by this manufacturer
    const assignments = await prisma.orderAssignment.findMany({
      where: { manufacturerId },
      select: { orderId: true },
    });

    const orderIds = assignments.map((a) => a.orderId).filter(Boolean);

    // Also include direct orders created for this manufacturer
    const directOrders = await prisma.order.findMany({
      where: { manufacturerId },
      select: { id: true },
    });
    directOrders.forEach((o) => {
      if (!orderIds.includes(o.id)) orderIds.push(o.id);
    });

    if (orderIds.length === 0) {
      // No orders fulfilled yet, default rating remains 5.0
      await prisma.manufacturer.update({
        where: { id: manufacturerId },
        data: { qualityRating: 5.0, ratingCount: 0 },
      });
      return { qualityRating: 5.0, ratingCount: 0 };
    }

    // 2. Fetch all matching orders to get userId and productIds
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, userId: true, items: true },
    });

    // 3. Build product-user pairs fulfilled by this manufacturer
    const userProductPairs = [];
    const fulfilledProductIds = new Set();

    for (const order of orders) {
      const items = parseJSON(order.items, []);
      for (const item of items) {
        const pId = item.productId || item._id || item.id;
        if (pId) {
          fulfilledProductIds.add(pId);
          if (order.userId && order.userId !== "GUEST_WALK_IN" && order.userId !== "GUEST_PHONE_ORDER") {
            userProductPairs.push({ userId: order.userId, productId: pId });
          }
        }
      }
    }

    // 4. Query reviews:
    // Primary criteria: Reviews by customers who purchased from this manufacturer
    // Secondary: If no user-specific match, include all reviews on the products fulfilled by this hub
    let matchingReviews = [];

    if (userProductPairs.length > 0) {
      matchingReviews = await prisma.review.findMany({
        where: {
          OR: userProductPairs.map((pair) => ({
            userId: pair.userId,
            productId: pair.productId,
          })),
        },
      });
    }

    // Fallback if sparse: use product reviews for products manufactured by this hub
    if (matchingReviews.length === 0 && fulfilledProductIds.size > 0) {
      matchingReviews = await prisma.review.findMany({
        where: {
          productId: { in: Array.from(fulfilledProductIds) },
        },
      });
    }

    if (matchingReviews.length === 0) {
      await prisma.manufacturer.update({
        where: { id: manufacturerId },
        data: { qualityRating: 5.0, ratingCount: 0 },
      });
      return { qualityRating: 5.0, ratingCount: 0 };
    }

    // 5. Calculate average customer rating
    const totalScore = matchingReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    const ratingCount = matchingReviews.length;
    const rawAverage = totalScore / ratingCount;
    const finalRating = Number(Math.min(5.0, Math.max(1.0, rawAverage)).toFixed(1));

    await prisma.manufacturer.update({
      where: { id: manufacturerId },
      data: {
        qualityRating: finalRating,
        ratingCount,
      },
    });

    return { qualityRating: finalRating, ratingCount };
  } catch (error) {
    console.error(`Error syncing rating for manufacturer ${manufacturerId}:`, error);
    return null;
  }
};

/**
 * Triggers rating recalculation for manufacturers when a review is added/updated/deleted
 */
export const syncManufacturerRatingForProduct = async (productId, userId) => {
  try {
    if (!productId) return;

    // Find all manufacturers who have an assignment for this product + user
    const orders = await prisma.order.findMany({
      where: {
        ...(userId ? { userId } : {}),
      },
      select: { id: true, items: true, assignmentId: true, manufacturerId: true },
    });

    const targetOrderIds = [];
    const targetManufacturerIds = new Set();

    for (const order of orders) {
      const items = parseJSON(order.items, []);
      const hasProduct = items.some(
        (item) => String(item.productId || item._id || item.id) === String(productId)
      );
      if (hasProduct) {
        targetOrderIds.push(order.id);
        if (order.manufacturerId) targetManufacturerIds.add(order.manufacturerId);
      }
    }

    if (targetOrderIds.length > 0) {
      const assignments = await prisma.orderAssignment.findMany({
        where: { orderId: { in: targetOrderIds } },
        select: { manufacturerId: true },
      });
      assignments.forEach((a) => targetManufacturerIds.add(a.manufacturerId));
    }

    // Also check which manufacturers hold inventory for this product
    if (targetManufacturerIds.size === 0) {
      const inventories = await prisma.manufacturerInventory.findMany({
        where: { productId },
        select: { manufacturerId: true },
      });
      inventories.forEach((i) => targetManufacturerIds.add(i.manufacturerId));
    }

    // Recalculate for each identified manufacturer
    for (const mId of targetManufacturerIds) {
      await syncManufacturerRating(mId);
    }
  } catch (error) {
    console.error("Error in syncManufacturerRatingForProduct:", error);
  }
};

/**
 * Recalculate ratings across all manufacturers
 */
export const syncAllManufacturersRatings = async () => {
  try {
    const allManufacturers = await prisma.manufacturer.findMany({
      select: { id: true },
    });
    for (const m of allManufacturers) {
      await syncManufacturerRating(m.id);
    }
  } catch (error) {
    console.error("Error in syncAllManufacturersRatings:", error);
  }
};
