import { prisma } from "../config/db.js";
import { syncProductStock } from "../services/stockSyncService.js";

// Helper: Safely parse JSON
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

// ─── NEPAL CITY PROXIMITY MAP ─────────────────────────────────────────────────
const CITY_PROXIMITY = {
  kathmandu: ["lalitpur", "bhaktapur", "kirtipur", "madhyapur thimi", "budhanilkantha", "banepa", "dhulikhel"],
  lalitpur: ["kathmandu", "bhaktapur", "kirtipur", "madhyapur thimi", "godawari"],
  bhaktapur: ["kathmandu", "lalitpur", "madhyapur thimi", "banepa", "dhulikhel"],
  pokhara: ["lekhnath", "prithvichowk", "birauta", "syangja", "damauli", "kaski"],
  lekhnath: ["pokhara", "damauli"],
  biratnagar: ["itahari", "inaruwa", "dharan", "damak", "belbari", "urlabari"],
  itahari: ["biratnagar", "dharan", "damak", "inaruwa"],
  dharan: ["itahari", "biratnagar", "damak"],
  butwal: ["bhairahawa", "siddharthanagar", "palpa", "sunwal", "tilottama"],
  bhairahawa: ["butwal", "siddharthanagar", "sunwal"],
  siddharthanagar: ["bhairahawa", "butwal"],
  birgunj: ["parwanipur", "simara", "hetauda", "kalaiya"],
  hetauda: ["birgunj", "makwanpur", "chitwan", "bharatpur"],
  chitwan: ["bharatpur", "hetauda", "nawalpur", "ratnanagar"],
  bharatpur: ["chitwan", "hetauda", "ratnanagar", "gaindakot"],
  nepalgunj: ["kohalpur", "banke", "surkhet"],
  dhangadhi: ["attariya", "tikapur", "mahendranagar", "kailali"],
  janakpur: ["dhanusa", "bardibas", "jaleshwor", "mahottari"],
};

const normalize = (city) => (city || "").toLowerCase().trim();

/**
 * Multi-Factor Smart Allocation Engine
 * Evaluates all candidate manufacturers based on:
 * 1. Location Proximity (Exact city vs nearby city vs regional)
 * 2. Quality Rating (Customer-driven 1.0 - 5.0 score)
 * 3. Real-time Variant Stock Availability (Size & Color match in hub inventory)
 * 4. Reliability (On-time fulfillment history and defect rates)
 */
export const runAllocationEngine = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, message: "Order not found" };

    if (order.assignmentId) return { success: false, message: "Order already assigned" };

    const address = parseJSON(order.address, {});
    const customerCity = normalize(address?.city);

    // Parse ordered line items with requested variants
    const rawItems = parseJSON(order.items, []);
    const itemRequirements = rawItems.map((item) => ({
      productId: item.productId || item._id || item.id,
      name: item.name || "Garment",
      size: item.size || "Standard",
      color: item.color || "Standard",
      qty: Math.max(1, Number(item.quantity || 1)),
    }));

    // Fetch all active and available contracted manufacturers
    const candidateManufacturers = await prisma.manufacturer.findMany({
      where: {
        isActive: true,
        isAvailable: true,
        contractStatus: "ACTIVE",
      },
      include: {
        inventory: true,
      },
    });

    if (candidateManufacturers.length === 0) {
      return { success: false, message: "No active manufacturer hubs available in the network." };
    }

    const nearbyCities = CITY_PROXIMITY[customerCity] || [];

    // Evaluate each candidate and calculate comprehensive matching score
    const scoredCandidates = candidateManufacturers.map((mfg) => {
      const hubCity = normalize(mfg.city);
      let locationScore = 15; // default cross-region base
      let locationTier = "National";

      if (hubCity === customerCity && customerCity !== "") {
        locationScore = 100; // Exact same city match
        locationTier = "Same City (Local)";
      } else if (nearbyCities.includes(hubCity)) {
        locationScore = 70; // Adjacent metro hub
        locationTier = "Neighboring City";
      }

      // ─── 2. Evaluate Stock Availability per Ordered Variant ─────────────────
      let totalReqQty = 0;
      let availableReqQty = 0;
      let hasAllItemsInStock = true;

      const inventoryMap = {};
      mfg.inventory.forEach((inv) => {
        inventoryMap[inv.productId] = inv;
      });

      for (const req of itemRequirements) {
        totalReqQty += req.qty;
        const inv = inventoryMap[req.productId];

        if (!inv) {
          hasAllItemsInStock = false;
          continue;
        }

        const variantsStock = parseJSON(inv.variantsStock, []);
        let variantAvailable = 0;

        if (variantsStock.length > 0) {
          const matched = variantsStock.find(
            (v) =>
              (v.size || "Standard") === req.size &&
              (v.color || "Standard") === req.color
          );
          if (matched) {
            variantAvailable = Math.max(
              0,
              (matched.quantity || 0) - (matched.reservedQty || 0)
            );
          }
        } else {
          variantAvailable = Math.max(0, (inv.quantity || 0) - (inv.reservedQty || 0));
        }

        const fulfilledQty = Math.min(req.qty, variantAvailable);
        availableReqQty += fulfilledQty;

        if (variantAvailable < req.qty) {
          hasAllItemsInStock = false;
        }
      }

      const stockFulfillmentRatio = totalReqQty > 0 ? availableReqQty / totalReqQty : 1;
      let stockScore = 0;
      if (hasAllItemsInStock) {
        stockScore = 120; // 100% variant stock ready
      } else if (stockFulfillmentRatio > 0) {
        stockScore = Math.round(stockFulfillmentRatio * 60); // Partial stock
      } else {
        stockScore = 0; // 0 physical units available
      }

      // ─── 3. Customer Quality Rating Score ─────────────────────────────────
      const rawQuality = Number(mfg.qualityRating) || 5.0;
      const normalizedQuality = Math.min(5.0, Math.max(1.0, rawQuality));
      // Quality rating contributes up to 75 points (5.0 rating = 75 pts)
      const ratingScore = Math.round((normalizedQuality / 5.0) * 75);

      // ─── 4. Reliability & On-Time Performance Score ───────────────────────
      let reliabilityScore = 10;
      if (mfg.totalOrdersFulfilled > 0) {
        const onTimeRate = (mfg.onTimeCount || 0) / mfg.totalOrdersFulfilled;
        const defectRate = (mfg.defectCount || 0) / mfg.totalOrdersFulfilled;
        reliabilityScore = Math.round(onTimeRate * 15) - Math.round(defectRate * 10);
      }

      const totalScore = locationScore + stockScore + ratingScore + reliabilityScore;

      return {
        manufacturer: mfg,
        totalScore,
        locationScore,
        locationTier,
        stockScore,
        hasAllItemsInStock,
        stockFulfillmentRatio,
        ratingScore,
        qualityRating: normalizedQuality,
        reliabilityScore,
      };
    });

    // Sort descending by total score
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

    // Pick top scoring candidate (giving strong preference to in-stock hubs)
    let bestCandidate = scoredCandidates.find((c) => c.hasAllItemsInStock);
    if (!bestCandidate) {
      bestCandidate = scoredCandidates[0];
    }

    if (!bestCandidate || !bestCandidate.manufacturer) {
      return { success: false, message: "Could not identify optimal manufacturer hub." };
    }

    const assignedManufacturer = bestCandidate.manufacturer;

    // ─── RESERVE VARIANT INVENTORY IN WINNING HUB ─────────────────────────────
    for (const req of itemRequirements) {
      const inv = await prisma.manufacturerInventory.findUnique({
        where: {
          manufacturerId_productId: {
            manufacturerId: assignedManufacturer.id,
            productId: req.productId,
          },
        },
      });

      if (inv) {
        const variantsStock = parseJSON(inv.variantsStock, []);
        let updatedVariants = [];

        if (variantsStock.length > 0) {
          updatedVariants = variantsStock.map((v) => {
            if (
              (v.size || "Standard") === req.size &&
              (v.color || "Standard") === req.color
            ) {
              return {
                ...v,
                reservedQty: (v.reservedQty || 0) + req.qty,
              };
            }
            return v;
          });
        } else {
          updatedVariants = [
            {
              size: req.size,
              color: req.color,
              quantity: inv.quantity,
              reservedQty: (inv.reservedQty || 0) + req.qty,
            },
          ];
        }

        const newReservedTotal = (inv.reservedQty || 0) + req.qty;

        await prisma.manufacturerInventory.update({
          where: {
            manufacturerId_productId: {
              manufacturerId: assignedManufacturer.id,
              productId: req.productId,
            },
          },
          data: {
            reservedQty: newReservedTotal,
            variantsStock: updatedVariants,
          },
        });

        await syncProductStock(req.productId);
      }
    }

    // Create OrderAssignment record
    const assignmentNote = `Auto-allocated by smart engine: Location [${bestCandidate.locationTier} +${bestCandidate.locationScore}pts], Customer Rating [${bestCandidate.qualityRating}★ +${bestCandidate.ratingScore}pts], Stock Status [${bestCandidate.hasAllItemsInStock ? "100% In Stock" : "Production Required"} +${bestCandidate.stockScore}pts]. Total Score: ${bestCandidate.totalScore}.`;

    const assignment = await prisma.orderAssignment.create({
      data: {
        orderId,
        manufacturerId: assignedManufacturer.id,
        status: "assigned",
        notes: assignmentNote,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: "assigned",
        assignmentId: assignment.id,
        manufacturerId: assignedManufacturer.id,
      },
    });

    return {
      success: true,
      assignment,
      manufacturer: assignedManufacturer,
      scoreDetails: {
        totalScore: bestCandidate.totalScore,
        locationTier: bestCandidate.locationTier,
        qualityRating: bestCandidate.qualityRating,
        hasAllItemsInStock: bestCandidate.hasAllItemsInStock,
      },
    };
  } catch (error) {
    console.error("runAllocationEngine error:", error);
    return { success: false, message: error.message };
  }
};

// ─── ADMIN / INTERNAL: TRIGGER ASSIGN ────────────────────────────────────────
const assignOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.json({ success: false, message: "orderId required" });

    const result = await runAllocationEngine(orderId);
    if (result.success) {
      res.json({
        success: true,
        message: "Order successfully auto-allocated based on location, rating & stock!",
        assignment: result.assignment,
        manufacturer: result.manufacturer?.name,
        scoreDetails: result.scoreDetails,
      });
    } else {
      res.json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("assignOrder error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── MANUFACTURER: GET MY ASSIGNMENTS ────────────────────────────────────────
const getMyAssignments = async (req, res) => {
  try {
    const manufacturerId = req.manufacturerId || req.body?.manufacturerId;
    const { status } = req.query;

    const where = { manufacturerId };
    if (status && status !== "all") where.status = status;

    const assignments = await prisma.orderAssignment.findMany({
      where,
      orderBy: { assignedAt: "desc" },
      include: {
        manufacturer: {
          select: { id: true, name: true, city: true, phone: true, qualityRating: true },
        },
      },
    });

    const orderIds = assignments.map((a) => a.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });
    const orderMap = {};
    orders.forEach((o) => {
      const items = parseJSON(o.items, []);
      const address = parseJSON(o.address, {});
      orderMap[o.id] = { ...o, items, address, date: Number(o.date) };
    });

    const enriched = assignments.map((a) => ({
      ...a,
      manufacturer: {
        ...a.manufacturer,
        businessName: a.manufacturer.name,
      },
      order: orderMap[a.orderId] || null,
      createdAt: a.assignedAt,
    }));

    res.json({ success: true, assignments: enriched });
  } catch (error) {
    console.error("getMyAssignments error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── MANUFACTURER: ACCEPT ORDER ───────────────────────────────────────────────
const acceptOrder = async (req, res) => {
  try {
    const manufacturerId = req.manufacturerId || req.body?.manufacturerId;
    const assignmentId = req.params?.id || req.body?.assignmentId || req.body?.id;

    const assignment = await prisma.orderAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.manufacturerId !== manufacturerId)
      return res.json({ success: false, message: "Assignment not found" });

    await prisma.orderAssignment.update({
      where: { id: assignmentId },
      data: { status: "accepted", acceptedAt: new Date() },
    });

    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { fulfillmentStatus: "accepted", status: "In Production" },
    });

    res.json({ success: true, message: "Order accepted for production!" });
  } catch (error) {
    console.error("acceptOrder error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── MANUFACTURER: REJECT ORDER ───────────────────────────────────────────────
const rejectOrder = async (req, res) => {
  try {
    const manufacturerId = req.manufacturerId || req.body?.manufacturerId;
    const assignmentId = req.params?.id || req.body?.assignmentId || req.body?.id;
    const reason = req.body?.reason || req.body?.rejectionReason;

    const assignment = await prisma.orderAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.manufacturerId !== manufacturerId)
      return res.json({ success: false, message: "Assignment not found" });

    // Track rejection counter on manufacturer
    await prisma.manufacturer.update({
      where: { id: manufacturerId },
      data: { rejectionCount: { increment: 1 } },
    });

    await prisma.orderAssignment.update({
      where: { id: assignmentId },
      data: { status: "rejected", rejectionReason: reason || "No capacity" },
    });

    // Reset order and trigger smart reallocation to next optimal hub
    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { fulfillmentStatus: "pending_assignment", assignmentId: null, manufacturerId: null },
    });

    // Reallocate automatically
    runAllocationEngine(assignment.orderId).catch((reallocErr) => {
      console.error("Reallocation error on reject:", reallocErr);
    });

    res.json({ success: true, message: "Order declined. Automatic reallocation initiated to next optimal hub." });
  } catch (error) {
    console.error("rejectOrder error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── MANUFACTURER: UPDATE ASSIGNMENT STATUS ───────────────────────────────────
const updateAssignmentStatus = async (req, res) => {
  try {
    const manufacturerId = req.manufacturerId || req.body?.manufacturerId;
    const assignmentId = req.params?.id || req.body?.assignmentId || req.body?.id;
    const { status, packagingNotes } = req.body;

    const assignment = await prisma.orderAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.manufacturerId !== manufacturerId)
      return res.json({ success: false, message: "Assignment not found" });

    const updateData = { status: status.toLowerCase() };
    if (packagingNotes !== undefined) updateData.notes = packagingNotes;

    await prisma.orderAssignment.update({ where: { id: assignmentId }, data: updateData });
    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { fulfillmentStatus: status.toLowerCase() },
    });

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    console.error("updateAssignmentStatus error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: GET ALL ASSIGNMENTS ───────────────────────────────────────────────
const getAllAssignments = async (req, res) => {
  try {
    const { status, manufacturerId } = req.query;
    const where = {};
    if (status && status !== "all") where.status = status;
    if (manufacturerId) where.manufacturerId = manufacturerId;

    const assignments = await prisma.orderAssignment.findMany({
      where,
      orderBy: { assignedAt: "desc" },
      include: {
        manufacturer: { select: { id: true, name: true, city: true, qualityRating: true } },
      },
    });

    const orderIds = assignments.map((a) => a.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });
    const orderMap = {};
    orders.forEach((o) => {
      const items = parseJSON(o.items, []);
      const address = parseJSON(o.address, {});
      orderMap[o.id] = { ...o, items, address, date: Number(o.date) };
    });

    const enriched = assignments.map((a) => ({
      ...a,
      manufacturer: {
        ...a.manufacturer,
        businessName: a.manufacturer.name,
      },
      order: orderMap[a.orderId] || null,
      createdAt: a.assignedAt,
    }));

    res.json({ success: true, assignments: enriched });
  } catch (error) {
    console.error("getAllAssignments error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: MANUAL OVERRIDE ASSIGN ───────────────────────────────────────────
const manualAssign = async (req, res) => {
  try {
    const { orderId, manufacturerId, reason } = req.body;
    if (!orderId || !manufacturerId)
      return res.json({ success: false, message: "orderId and manufacturerId required" });

    const manufacturer = await prisma.manufacturer.findUnique({ where: { id: manufacturerId } });
    if (!manufacturer) return res.json({ success: false, message: "Manufacturer not found" });

    const existing = await prisma.orderAssignment.findUnique({ where: { orderId } });
    let assignment;
    if (existing) {
      assignment = await prisma.orderAssignment.update({
        where: { orderId },
        data: {
          manufacturerId,
          status: "assigned",
          notes: reason ? `Manual override: ${reason}` : "Manual admin assignment",
        },
      });
    } else {
      assignment = await prisma.orderAssignment.create({
        data: {
          orderId,
          manufacturerId,
          status: "assigned",
          notes: reason ? `Manual override: ${reason}` : "Manual admin assignment",
        },
      });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: "assigned",
        assignmentId: assignment.id,
        manufacturerId,
      },
    });

    res.json({ success: true, message: "Order manually assigned to manufacturer", assignment });
  } catch (error) {
    console.error("manualAssign error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  assignOrder,
  getMyAssignments,
  acceptOrder,
  rejectOrder,
  updateAssignmentStatus,
  getAllAssignments,
  manualAssign,
};
