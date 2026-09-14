import { prisma } from "../config/db.js";
import { v2 as cloudinary } from "cloudinary";

// ─── AUTO-ASSIGN DELIVERY JOB ─────────────────────────────────────────────────
export const assignDeliveryJob = async (assignmentId) => {
  const assignment = await prisma.orderAssignment.findUnique({
    where: { id: assignmentId },
    include: { manufacturer: true },
  });
  if (!assignment) return { success: false, message: "Assignment not found" };

  const order = await prisma.order.findUnique({ where: { id: assignment.orderId } });
  if (!order) return { success: false, message: "Order not found" };

  const address = typeof order.address === "string" ? JSON.parse(order.address) : order.address;
  const dropoffCity = (address?.city || "").trim();

  // Find available delivery partner in manufacturer's city
  let partner = await prisma.deliveryPartner.findFirst({
    where: {
      city: { equals: assignment.manufacturer.city },
      isActive: true,
      isAvailable: true,
    },
    orderBy: { rating: "desc" },
  });

  // Fallback: any available partner
  if (!partner) {
    partner = await prisma.deliveryPartner.findFirst({
      where: { isActive: true, isAvailable: true },
      orderBy: { rating: "desc" },
    });
  }

  if (!partner) {
    return { success: false, message: "No delivery partner available. Manual assignment required." };
  }

  const job = await prisma.deliveryJob.create({
    data: {
      assignmentId,
      deliveryPartnerId: partner.id,
      orderId: assignment.orderId,
      pickupCity: assignment.manufacturer.city,
      pickupAddress: assignment.manufacturer.address || assignment.manufacturer.city,
      dropoffCity,
      dropoffAddress: address,
      codAmount: order.paymentMethod === "COD" || !order.payment ? order.amount : 0,
      status: "assigned",
    },
  });

  await prisma.order.update({
    where: { id: assignment.orderId },
    data: { fulfillmentStatus: "ready_for_pickup", deliveryJobId: job.id },
  });

  return { success: true, job };
};

// ─── MANUFACTURER: MARK READY FOR PICKUP ─────────────────────────────────────
const markReadyForPickup = async (req, res) => {
  try {
    const manufacturerId = req.manufacturerId || req.body?.manufacturerId;
    const assignmentId = req.params?.assignmentId || req.body?.assignmentId || req.body?.id;

    const assignment = await prisma.orderAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.manufacturerId !== manufacturerId)
      return res.json({ success: false, message: "Assignment not found" });

    await prisma.orderAssignment.update({
      where: { id: assignmentId },
      data: { status: "ready_for_pickup", readyAt: new Date() },
    });

    const result = await assignDeliveryJob(assignmentId);
    if (!result.success) {
      return res.json({
        success: true,
        message: "Marked ready for pickup. " + result.message,
      });
    }

    res.json({ success: true, message: "Marked ready. Delivery partner notified.", job: result.job });
  } catch (error) {
    console.error("markReadyForPickup error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── DELIVERY PARTNER: GET MY JOBS ───────────────────────────────────────────
const getMyJobs = async (req, res) => {
  try {
    const deliveryPartnerId = req.deliveryPartnerId || req.body?.deliveryPartnerId;
    const { status } = req.query;

    const where = { deliveryPartnerId };
    if (status) where.status = status;

    const jobs = await prisma.deliveryJob.findMany({
      where,
      orderBy: { assignedAt: "desc" },
      include: {
        assignment: {
          include: {
            manufacturer: { select: { id: true, name: true, phone: true, address: true, city: true } },
          },
        },
      },
    });

    const orderIds = jobs.map((j) => j.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });
    const orderMap = {};
    orders.forEach((o) => {
      const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
      const address = typeof o.address === "string" ? JSON.parse(o.address) : o.address;
      orderMap[o.id] = { ...o, items, address };
    });

    const enriched = jobs.map((j) => {
      const order = orderMap[j.orderId] || null;
      const mfg = j.assignment?.manufacturer;
      return {
        ...j,
        createdAt: j.assignedAt,
        isCodCollected: j.codCollected,
        orderAssignment: {
          ...j.assignment,
          manufacturer: mfg ? { ...mfg, businessName: mfg.name } : null,
          order,
        },
      };
    });

    res.json({ success: true, jobs: enriched });
  } catch (error) {
    console.error("getMyJobs error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── DELIVERY PARTNER: ACCEPT JOB ─────────────────────────────────────────────
const acceptJob = async (req, res) => {
  try {
    const deliveryPartnerId = req.deliveryPartnerId || req.body?.deliveryPartnerId;
    const jobId = req.params?.jobId || req.body?.jobId || req.body?.id;

    const job = await prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job || job.deliveryPartnerId !== deliveryPartnerId)
      return res.json({ success: false, message: "Delivery job not found" });

    await prisma.deliveryJob.update({
      where: { id: jobId },
      data: { status: "accepted", acceptedAt: new Date() },
    });

    res.json({ success: true, message: "Delivery job accepted" });
  } catch (error) {
    console.error("acceptJob error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── DELIVERY PARTNER: UPDATE STATUS ──────────────────────────────────────────
const updateJobStatus = async (req, res) => {
  try {
    const deliveryPartnerId = req.deliveryPartnerId || req.body?.deliveryPartnerId;
    const jobId = req.params?.jobId || req.body?.jobId || req.body?.id;
    const { status } = req.body;

    const job = await prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job || job.deliveryPartnerId !== deliveryPartnerId)
      return res.json({ success: false, message: "Delivery job not found" });

    const normStatus = (status || "").toLowerCase();
    const updateData = { status: normStatus };
    if (normStatus === "picked_up") updateData.pickedUpAt = new Date();
    if (normStatus === "in_transit") updateData.inTransitAt = new Date();

    await prisma.deliveryJob.update({ where: { id: jobId }, data: updateData });

    // Update assignment and order status
    await prisma.orderAssignment.update({
      where: { id: job.assignmentId },
      data: { status: normStatus },
    });

    await prisma.order.update({
      where: { id: job.orderId },
      data: { fulfillmentStatus: normStatus },
    });

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    console.error("updateJobStatus error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── DELIVERY PARTNER: MARK DELIVERED + COD ──────────────────────────────────
const markDelivered = async (req, res) => {
  try {
    const deliveryPartnerId = req.deliveryPartnerId || req.body?.deliveryPartnerId;
    const jobId = req.params?.jobId || req.body?.jobId || req.body?.id;
    const { isCodCollected, codCollected, recipientName, deliveryNotes } = req.body;

    const job = await prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job || job.deliveryPartnerId !== deliveryPartnerId)
      return res.json({ success: false, message: "Delivery job not found" });

    let proofOfDelivery = null;
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "delivery_proofs",
      });
      proofOfDelivery = uploaded.secure_url;
    }

    const collectedFlag = Boolean(isCodCollected === "true" || isCodCollected === true || codCollected === true);

    await prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        status: "delivered",
        deliveredAt: new Date(),
        codCollected: collectedFlag,
        proofOfDelivery: proofOfDelivery || job.proofOfDelivery,
      },
    });

    // Increment partner completed deliveries
    await prisma.deliveryPartner.update({
      where: { id: deliveryPartnerId },
      data: { totalDeliveries: { increment: 1 } },
    });

    // Mark order fulfilled and paid if COD
    await prisma.order.update({
      where: { id: job.orderId },
      data: {
        fulfillmentStatus: "delivered",
        status: "Delivered",
        payment: collectedFlag ? true : undefined,
      },
    });

    await prisma.orderAssignment.update({
      where: { id: job.assignmentId },
      data: { status: "delivered" },
    });

    res.json({ success: true, message: "Delivered successfully" });
  } catch (error) {
    console.error("markDelivered error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── DELIVERY PARTNER: FAIL DELIVERY ──────────────────────────────────────────
const failDelivery = async (req, res) => {
  try {
    const deliveryPartnerId = req.deliveryPartnerId || req.body?.deliveryPartnerId;
    const jobId = req.params?.jobId || req.body?.jobId || req.body?.id;
    const { failureReason } = req.body;

    const job = await prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job || job.deliveryPartnerId !== deliveryPartnerId)
      return res.json({ success: false, message: "Delivery job not found" });

    await prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        failureReason: failureReason || "Delivery attempt failed",
      },
    });

    await prisma.deliveryPartner.update({
      where: { id: deliveryPartnerId },
      data: { failedDeliveries: { increment: 1 } },
    });

    res.json({ success: true, message: "Delivery recorded as failed" });
  } catch (error) {
    console.error("failDelivery error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: GET ALL JOBS ──────────────────────────────────────────────────────
const getAllJobs = async (req, res) => {
  try {
    const jobs = await prisma.deliveryJob.findMany({
      orderBy: { assignedAt: "desc" },
      include: {
        deliveryPartner: { select: { id: true, name: true, phone: true, city: true, vehicleType: true } },
        assignment: {
          include: {
            manufacturer: { select: { id: true, name: true, phone: true, city: true } },
          },
        },
      },
    });

    res.json({ success: true, jobs });
  } catch (error) {
    console.error("getAllJobs error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  markReadyForPickup,
  getMyJobs,
  acceptJob,
  updateJobStatus,
  markDelivered,
  failDelivery,
  getAllJobs,
};
