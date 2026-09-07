import { prisma } from "../config/db.js";

// Add SubCategory / Type
const addSubCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.json({ success: false, message: "Type/SubCategory name is required" });
    }

    const trimmedName = name.trim();
    const exists = await prisma.subCategory.findFirst({
      where: { name: trimmedName },
    });

    if (exists) {
      return res.json({ success: false, message: "Type/SubCategory already exists" });
    }

    const subCategory = await prisma.subCategory.create({
      data: { name: trimmedName },
    });

    res.json({ success: true, message: "Type/SubCategory Added", subCategory });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// List SubCategories / Types (Seed defaults if empty)
const listSubCategories = async (req, res) => {
  try {
    let subCategories = await prisma.subCategory.findMany({});

    // Seed defaults if empty so initial app state is populated
    if (subCategories.length === 0) {
      const defaults = ["Topwear", "Bottomwear", "Winterwear"];
      for (const def of defaults) {
        await prisma.subCategory.create({ data: { name: def } }).catch(() => { });
      }
      subCategories = await prisma.subCategory.findMany({});
    }

    res.json({ success: true, subCategories });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Remove SubCategory / Type
const removeSubCategory = async (req, res) => {
  try {
    const { id } = req.body;
    await prisma.subCategory.delete({
      where: { id },
    });
    res.json({ success: true, message: "Type/SubCategory Removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addSubCategory, listSubCategories, removeSubCategory };
