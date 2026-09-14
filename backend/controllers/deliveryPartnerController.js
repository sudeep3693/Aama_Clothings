import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const loginDeliveryPartner = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: "Email and password required" });

    const partner = await prisma.deliveryPartner.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!partner)
      return res.json({ success: false, message: "Invalid credentials" });

    if (!partner.isActive)
      return res.json({ success: false, message: "Account is deactivated. Contact admin." });

    const match = await bcrypt.compare(password, partner.password);
    if (!match)
      return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { deliveryPartnerId: partner.id, role: "delivery_partner" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...safePartner } = partner;
    res.json({ success: true, token, partner: safePartner });
  } catch (error) {
    console.error("loginDeliveryPartner error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── GET PROFILE ─────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const deliveryPartnerId = req.deliveryPartnerId || req.body?.deliveryPartnerId || req.query?.deliveryPartnerId;
    if (!deliveryPartnerId)
      return res.json({ success: false, message: "Partner ID required" });

    const partner = await prisma.deliveryPartner.findUnique({ where: { id: deliveryPartnerId } });
    if (!partner) return res.json({ success: false, message: "Partner not found" });

    const { password: _, ...safe } = partner;
    res.json({ success: true, partner: safe });
  } catch (error) {
    console.error("getProfile error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── TOGGLE AVAILABILITY ─────────────────────────────────────────────────────
const updateAvailability = async (req, res) => {
  try {
    const deliveryPartnerId = req.deliveryPartnerId || req.body?.deliveryPartnerId;
    const isAvailable = req.body?.isAvailable;
    const updated = await prisma.deliveryPartner.update({
      where: { id: deliveryPartnerId },
      data: { isAvailable: Boolean(isAvailable) },
    });
    res.json({ success: true, message: "Availability updated", isAvailable: updated.isAvailable });
  } catch (error) {
    console.error("updateAvailability error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: REGISTER DELIVERY PARTNER ────────────────────────────────────────
const registerDeliveryPartner = async (req, res) => {
  try {
    const { name, email, password, phone, city, vehicleType, licenseNumber } = req.body;

    if (!name || !email || !password || !phone || !city)
      return res.json({ success: false, message: "Name, email, password, phone, and city are required" });

    const existing = await prisma.deliveryPartner.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const partner = await prisma.deliveryPartner.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        phone: phone.trim(),
        city: city.trim(),
        vehicleType: vehicleType || "BIKE",
        licenseNumber: licenseNumber || null,
      },
    });

    const { password: _, ...safe } = partner;
    res.json({ success: true, message: "Delivery partner registered successfully", partner: safe });
  } catch (error) {
    console.error("registerDeliveryPartner error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: LIST ALL DELIVERY PARTNERS ───────────────────────────────────────
const listDeliveryPartners = async (req, res) => {
  try {
    const partners = await prisma.deliveryPartner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { deliveryJobs: true } },
      },
    });
    const safe = partners.map(({ password, ...p }) => ({
      ...p,
      onTimeRate: p.totalDeliveries > 0
        ? ((p.onTimeDeliveries / p.totalDeliveries) * 100).toFixed(1)
        : "0.0",
    }));
    res.json({ success: true, partners: safe });
  } catch (error) {
    console.error("listDeliveryPartners error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── ADMIN: UPDATE DELIVERY PARTNER ──────────────────────────────────────────
const updateDeliveryPartner = async (req, res) => {
  try {
    const partnerId = req.params?.id || req.body?.deliveryPartnerId || req.body?.id;
    const { name, phone, city, vehicleType, licenseNumber, isActive, isAvailable, rating } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (city !== undefined) updateData.city = city;
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
    if (rating !== undefined) updateData.rating = parseFloat(rating);

    const updated = await prisma.deliveryPartner.update({
      where: { id: partnerId },
      data: updateData,
    });
    const { password: _, ...safe } = updated;
    res.json({ success: true, message: "Delivery partner updated", partner: safe });
  } catch (error) {
    console.error("updateDeliveryPartner error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ─── DELIVERY PARTNER: GET OWN STATS ─────────────────────────────────────────
const getPartnerStats = async (req, res) => {
  try {
    const deliveryPartnerId = req.deliveryPartnerId || req.body?.deliveryPartnerId;
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: deliveryPartnerId },
    });
    if (!partner) return res.json({ success: false, message: "Not found" });

    const activeJobs = await prisma.deliveryJob.count({
      where: {
        deliveryPartnerId,
        status: { in: ["ASSIGNED", "ACCEPTED", "AT_PICKUP", "PICKED_UP", "IN_TRANSIT"] },
      },
    });

    const { password: _, ...safe } = partner;
    res.json({
      success: true,
      stats: {
        ...safe,
        activeJobs,
        onTimeRate: safe.totalDeliveries > 0
          ? ((safe.onTimeDeliveries / safe.totalDeliveries) * 100).toFixed(1)
          : "0.0",
      },
    });
  } catch (error) {
    console.error("getPartnerStats error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  loginDeliveryPartner,
  getProfile,
  updateAvailability,
  registerDeliveryPartner,
  listDeliveryPartners,
  updateDeliveryPartner,
  getPartnerStats,
};
