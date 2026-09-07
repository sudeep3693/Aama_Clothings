import { prisma } from "../config/db.js";

// Default fallback configuration
const DEFAULT_CONFIG = {
  id: "default",
  baseCity: "Kathmandu",
  sameCityFee: 50,
  differentCityFee: 120,
  freeShippingMin: 0,
};

// Get current active shipping configuration (Public)
const getShippingConfig = async (req, res) => {
  try {
    let config = await prisma.shippingConfig.findFirst();
    if (!config) {
      config = await prisma.shippingConfig.create({
        data: DEFAULT_CONFIG,
      });
    }
    res.json({ success: true, config });
  } catch (error) {
    console.error("Error fetching shipping config:", error);
    res.json({ success: false, message: error.message, config: DEFAULT_CONFIG });
  }
};

// Update shipping configuration (Admin only)
const updateShippingConfig = async (req, res) => {
  try {
    const { baseCity, sameCityFee, differentCityFee, freeShippingMin } = req.body;

    if (!baseCity || sameCityFee === undefined || differentCityFee === undefined) {
      return res.json({
        success: false,
        message: "Base city, same city delivery fee, and different city fee are required.",
      });
    }

    const updatedData = {
      baseCity: String(baseCity).trim(),
      sameCityFee: Math.max(0, Number(sameCityFee)),
      differentCityFee: Math.max(0, Number(differentCityFee)),
      freeShippingMin: freeShippingMin !== undefined ? Math.max(0, Number(freeShippingMin)) : 0,
    };

    const existing = await prisma.shippingConfig.findFirst();

    let config;
    if (existing) {
      config = await prisma.shippingConfig.update({
        where: { id: existing.id },
        data: updatedData,
      });
    } else {
      config = await prisma.shippingConfig.create({
        data: {
          id: "default",
          ...updatedData,
        },
      });
    }

    res.json({
      success: true,
      message: "Shipping rates and base city updated successfully.",
      config,
    });
  } catch (error) {
    console.error("Error updating shipping config:", error);
    res.json({ success: false, message: error.message });
  }
};

export { getShippingConfig, updateShippingConfig };
