import { prisma } from "../config/db.js";

// ─── NEPAL CITY PROXIMITY MAP ─────────────────────────────────────────────────
const CITY_PROXIMITY = {
  kathmandu: ["lalitpur", "bhaktapur", "kirtipur", "madhyapur thimi", "budhanilkantha", "banepa", "dhulikhel"],
  lalitpur: ["kathmandu", "bhaktapur", "kirtipur"],
  bhaktapur: ["kathmandu", "lalitpur", "madhyapur thimi"],
  pokhara: ["lekhnath", "prithvichowk", "birauta", "syangja"],
  lekhnath: ["pokhara"],
  biratnagar: ["itahari", "inaruwa", "dharan", "damak"],
  itahari: ["biratnagar", "dharan", "damak"],
  dharan: ["biratnagar", "itahari"],
  butwal: ["bhairahawa", "siddharthanagar", "palpa"],
  bhairahawa: ["butwal", "siddharthanagar"],
  siddharthanagar: ["bhairahawa", "butwal"],
  birgunj: ["parwanipur", "simara", "hetauda"],
  hetauda: ["birgunj", "makwanpur", "chitwan", "bharatpur"],
  chitwan: ["bharatpur", "hetauda", "nawalpur"],
  bharatpur: ["chitwan", "hetauda"],
  nepalgunj: ["kohalpur", "banke"],
  dhangadhi: ["attariya", "tikapur", "mahendranagar"],
  janakpur: ["dhanusa", "bardibas"],
};

const normalize = (city) => (city || "").toLowerCase().trim();

/**
 * Core allocation logic
 */
export const runAllocationEngine = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: "Order not found" };

  if (order.assignmentId) return { success: false, message: "Order already assigned" };

  const address = typeof order.address === "string" ? JSON.parse(order.address) : order.address;
  const customerCity = normalize(address?.city);

  // Parse ordered items
  const orderedItems = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
  const itemRequirements = (orderedItems || []).map((item) => ({
    productId: item.productId || item._id,
    qty: Number(item.quantity || 1),
  }));

  const nearbyCities = CITY_PROXIMITY[customerCity] || [];
  const citySearchOrder = [customerCity, ...nearbyCities];

  let assignedManufacturer = null;

  for (const cityToCheck of citySearchOrder) {
    if (!cityToCheck) continue;
    const candidates = await prisma.manufacturer.findMany({
      where: {
        city: { equals: cityToCheck },
        isActive: true,
        isAvailable: true,
        contractStatus: "ACTIVE",
      },
      include: { inventory: true },
      orderBy: { qualityRating: "desc" },
    });

    for (const manufacturer of candidates) {
      const invMap = {};
      for (const inv of manufacturer.inventory) {
        const available = Math.max(0, inv.quantity - inv.reservedQty);
        invMap[inv.productId] = available;
      }

      // Check if candidate has stock or if no strict inventory initialized yet, allow candidate
      const canFulfill = itemRequirements.every((req) => {
        const available = invMap[req.productId];
        return available === undefined || available >= req.qty;
      });

      if (canFulfill) {
        assignedManufacturer = manufacturer;
        break;
      }
    }
    if (assignedManufacturer) break;
  }

  // Fallback: any active available manufacturer
  if (!assignedManufacturer) {
    assignedManufacturer = await prisma.manufacturer.findFirst({
      where: { isActive: true, isAvailable: true, contractStatus: "ACTIVE" },
      orderBy: { qualityRating: "desc" },
    });
  }

  if (!assignedManufacturer) {
    return { success: false, message: "No eligible manufacturer found for this order" };
  }

  // Reserve inventory if present
  for (const req of itemRequirements) {
    await prisma.manufacturerInventory.updateMany({
      where: { manufacturerId: assignedManufacturer.id, productId: req.productId },
      data: { reservedQty: { increment: req.qty } },
    });
  }

  const assignment = await prisma.orderAssignment.create({
    data: {
      orderId,
      manufacturerId: assignedManufacturer.id,
      status: "assigned",
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      fulfillmentStatus: "assigned",
      assignmentId: assignment.id,
    },
  });

  return { success: true, assignment, manufacturer: assignedManufacturer };
};

// ─── ADMIN / INTERNAL: TRIGGER ASSIGN ────────────────────────────────────────
const assignOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.json({ success: false, message: "orderId required" });

    const result = await runAllocationEngine(orderId);
    if (result.success) {
      res.json({ success: true, message: "Order assigned", assignment: result.assignment });
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
    if (status) where.status = status;

    const assignments = await prisma.orderAssignment.findMany({
      where,
      orderBy: { assignedAt: "desc" },
      include: {
        manufacturer: { select: { id: true, name: true, city: true, phone: true, qualityRating: true } },
        deliveryJob: true,
      },
    });

    const orderIds = assignments.map((a) => a.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });
    const orderMap = {};
    orders.forEach((o) => {
      const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
      const address = typeof o.address === "string" ? JSON.parse(o.address) : o.address;
      orderMap[o.id] = { ...o, items, address };
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

    res.json({ success: true, message: "Order accepted" });
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

    await prisma.orderAssignment.update({
      where: { id: assignmentId },
      data: { status: "rejected", rejectionReason: reason || "No capacity" },
    });

    // Reset order
    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { fulfillmentStatus: "pending_assignment", assignmentId: null },
    });

    res.json({ success: true, message: "Order declined. Will be reallocated." });
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
    const { status, packagingNotes, packageWeight, packageDimensions } = req.body;

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
        deliveryJob: { select: { id: true, status: true, deliveryPartnerId: true } },
      },
    });

    const orderIds = assignments.map((a) => a.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });
    const orderMap = {};
    orders.forEach((o) => {
      const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
      const address = typeof o.address === "string" ? JSON.parse(o.address) : o.address;
      orderMap[o.id] = { ...o, items, address };
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
      data: { fulfillmentStatus: "assigned", assignmentId: assignment.id },
    });

    res.json({ success: true, message: "Order assigned to manufacturer", assignment });
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
