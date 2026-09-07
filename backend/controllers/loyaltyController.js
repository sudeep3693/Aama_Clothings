import { prisma } from "../config/db.js";

// Default initial loyalty tiers with customizable combination perks
const DEFAULT_LEVELS = [
  {
    levelNumber: 1,
    name: "Bronze Explorer",
    badgeIcon: "🥉",
    color: "#CD7F32",
    minSpend: 0,
    minOrders: 0,
    rewardType: "NONE",
    rewardValue: 0,
    rewardTitle: "Entry Level (No Perks)",
    rewardDescription: "Welcome to Aama Clothings! Place orders to level up and unlock exclusive discounts.",
    rewardOrderLimit: 1,
    freeShipping: false,
    discountAmount: 0,
    giftAmount: 0,
    giftDescription: "",
    letterIncluded: false,
    customPerk: "",
  },
  {
    levelNumber: 2,
    name: "Silver VIP",
    badgeIcon: "🥈",
    color: "#94A3B8",
    minSpend: 3000,
    minOrders: 2,
    rewardType: "COMBO",
    rewardValue: 100,
    rewardTitle: "Rs. 100 Off + Handwritten Letter",
    rewardDescription: "Rs. 100 flat discount on next 3 orders + Personalized handwritten thank-you note.",
    rewardOrderLimit: 3,
    freeShipping: false,
    discountAmount: 100,
    giftAmount: 0,
    giftDescription: "",
    letterIncluded: true,
    customPerk: "",
  },
  {
    levelNumber: 3,
    name: "Gold Champion",
    badgeIcon: "🥇",
    color: "#F59E0B",
    minSpend: 8000,
    minOrders: 4,
    rewardType: "COMBO",
    rewardValue: 150,
    rewardTitle: "Free Delivery + Rs. 150 Off",
    rewardDescription: "Free delivery & Rs. 150 off on next 3 orders + handwritten letter.",
    rewardOrderLimit: 3,
    freeShipping: true,
    discountAmount: 150,
    giftAmount: 0,
    giftDescription: "",
    letterIncluded: true,
    customPerk: "VIP priority dispatch",
  },
  {
    levelNumber: 4,
    name: "Diamond Legend",
    badgeIcon: "💎",
    color: "#3B82F6",
    minSpend: 18000,
    minOrders: 8,
    rewardType: "COMBO",
    rewardValue: 250,
    rewardTitle: "Free Delivery + Rs. 250 Off + Rs. 500 Gift Card",
    rewardDescription: "Free shipping, Rs. 250 discount on next 3 orders, plus Rs. 500 gift voucher & luxury packaging.",
    rewardOrderLimit: 3,
    freeShipping: true,
    discountAmount: 250,
    giftAmount: 500,
    giftDescription: "Exclusive Rs. 500 Gift Voucher",
    letterIncluded: true,
    customPerk: "Exclusive VIP Luxury Packaging",
  },
];

// Helper to ensure default levels are seeded
const ensureSeedLevels = async () => {
  const count = await prisma.customerLevel.count();
  if (count === 0) {
    for (const lvl of DEFAULT_LEVELS) {
      await prisma.customerLevel.create({ data: lvl });
    }
  }
};

// Helper to calculate a user's loyalty status based on their orders and configured levels
export const calculateUserLoyalty = async (userId) => {
  await ensureSeedLevels();

  const [levels, orders] = await Promise.all([
    prisma.customerLevel.findMany({ orderBy: { levelNumber: "asc" } }),
    prisma.order.findMany({
      where: {
        userId,
        status: { notIn: ["Cancelled"] },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const totalOrders = orders.length;
  const totalSpend = orders.reduce((acc, o) => acc + Number(o.amount || 0), 0);

  // Determine highest tier achieved where user meets BOTH minSpend AND minOrders
  let currentLevel = levels[0] || DEFAULT_LEVELS[0];
  let nextLevel = null;

  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    if (totalSpend >= Number(lvl.minSpend) && totalOrders >= Number(lvl.minOrders)) {
      currentLevel = lvl;
      nextLevel = levels[i + 1] || null;
    }
  }

  if (!nextLevel && levels.length > 0) {
    const firstUnmet = levels.find(
      (l) => totalSpend < Number(l.minSpend) || totalOrders < Number(l.minOrders)
    );
    if (firstUnmet && firstUnmet.levelNumber > currentLevel.levelNumber) {
      nextLevel = firstUnmet;
    }
  }

  // Calculate progress percentage to next level
  let progressPercentage = 100;
  let remainingSpend = 0;
  let remainingOrders = 0;

  if (nextLevel) {
    const spendGap = Math.max(0, Number(nextLevel.minSpend) - Number(currentLevel.minSpend));
    const userSpendProgress = Math.max(0, totalSpend - Number(currentLevel.minSpend));
    const spendRatio = spendGap > 0 ? Math.min(1, userSpendProgress / spendGap) : 1;

    const ordersGap = Math.max(0, Number(nextLevel.minOrders) - Number(currentLevel.minOrders));
    const userOrdersProgress = Math.max(0, totalOrders - Number(currentLevel.minOrders));
    const ordersRatio = ordersGap > 0 ? Math.min(1, userOrdersProgress / ordersGap) : 1;

    progressPercentage = Math.round(((spendRatio + ordersRatio) / 2) * 100);
    remainingSpend = Math.max(0, Number(nextLevel.minSpend) - totalSpend);
    remainingOrders = Math.max(0, Number(nextLevel.minOrders) - totalOrders);
  }

  // Resolve modular combination perks
  const isFreeShipping = Boolean(
    currentLevel.freeShipping ||
    currentLevel.rewardType === "FREE_SHIPPING" ||
    currentLevel.rewardType === "FREE_SHIPPING_AND_DISCOUNT"
  );

  const discountAmount = Number(
    currentLevel.discountAmount !== undefined && currentLevel.discountAmount !== null
      ? currentLevel.discountAmount
      : (currentLevel.rewardType === "DISCOUNT_AMOUNT" || currentLevel.rewardType === "FREE_SHIPPING_AND_DISCOUNT"
          ? currentLevel.rewardValue
          : 0)
  ) || 0;

  const giftAmount = Number(currentLevel.giftAmount || 0);
  const giftDescription = (currentLevel.giftDescription || "").trim();
  const letterIncluded = Boolean(currentLevel.letterIncluded || currentLevel.rewardType === "HANDWRITTEN_LETTER");
  const customPerk = (currentLevel.customPerk || "").trim();

  // Has any active perk configured?
  const hasPerks = isFreeShipping || discountAmount > 0 || giftAmount > 0 || giftDescription || letterIncluded || customPerk;

  const rewardOrderLimit = Number(currentLevel.rewardOrderLimit || 3);
  const ordersSinceQualifying = Math.max(0, totalOrders - Number(currentLevel.minOrders));
  const remainingRewardUses = Math.max(0, rewardOrderLimit - ordersSinceQualifying);
  const currentUseIndex = Math.min(rewardOrderLimit, ordersSinceQualifying + 1);
  const isRewardEligible = hasPerks && remainingRewardUses > 0;

  // Build list of perk tags for display
  const perkTags = [];
  if (isFreeShipping) perkTags.push("Free Delivery");
  if (discountAmount > 0) perkTags.push(`Rs. ${discountAmount} Off`);
  if (giftAmount > 0 || giftDescription) perkTags.push(giftDescription || `Rs. ${giftAmount} Gift Voucher`);
  if (letterIncluded) perkTags.push("Handwritten Letter");
  if (customPerk) perkTags.push(customPerk);

  const activeReward = {
    freeShipping: isFreeShipping,
    discountAmount: discountAmount,
    giftAmount: giftAmount,
    giftDescription: giftDescription,
    letterIncluded: letterIncluded,
    customPerk: customPerk,
    perkTags: perkTags,
    title: currentLevel.rewardTitle,
    description: currentLevel.rewardDescription,
    orderLimit: rewardOrderLimit,
    remainingUses: remainingRewardUses,
    currentUseIndex: currentUseIndex,
    isEligible: isRewardEligible,
    usageBadge: isRewardEligible
      ? `${currentLevel.rewardTitle} (Use ${currentUseIndex} of ${rewardOrderLimit})`
      : (hasPerks ? `Reward Completed (${rewardOrderLimit}/${rewardOrderLimit} used)` : "No Perks"),
  };

  return {
    totalSpend,
    totalOrders,
    currentLevel,
    nextLevel,
    progressPercentage,
    remainingSpend,
    remainingOrders,
    activeReward,
    allLevels: levels,
  };
};

// GET /api/loyalty/levels (Public / Admin)
export const getAllLevels = async (req, res) => {
  try {
    await ensureSeedLevels();
    const levels = await prisma.customerLevel.findMany({
      orderBy: { levelNumber: "asc" },
    });
    res.json({ success: true, levels });
  } catch (error) {
    console.error("Error fetching loyalty levels:", error);
    res.json({ success: false, message: error.message });
  }
};

// POST /api/loyalty/level (Admin only) - Create or Update Level with Modular Perks
export const createOrUpdateLevel = async (req, res) => {
  try {
    const {
      id,
      levelNumber,
      name,
      badgeIcon,
      color,
      minSpend,
      minOrders,
      rewardType,
      rewardValue,
      rewardTitle,
      rewardDescription,
      rewardOrderLimit,
      freeShipping,
      discountAmount,
      giftAmount,
      giftDescription,
      letterIncluded,
      customPerk,
    } = req.body;

    if (!name) {
      return res.json({ success: false, message: "Level Name is required" });
    }

    const isFreeShipping = Boolean(freeShipping);
    const discAmt = Math.max(0, Number(discountAmount !== undefined ? discountAmount : (rewardValue || 0)));
    const giftAmt = Math.max(0, Number(giftAmount || 0));
    const giftDesc = (giftDescription || "").trim();
    const isLetter = Boolean(letterIncluded);
    const cPerk = (customPerk || "").trim();

    // Auto-generate title if not explicitly provided
    let title = (rewardTitle || "").trim();
    if (!title) {
      const parts = [];
      if (isFreeShipping) parts.push("Free Delivery");
      if (discAmt > 0) parts.push(`Rs. ${discAmt} Off`);
      if (giftAmt > 0 || giftDesc) parts.push(giftDesc || `Rs. ${giftAmt} Gift Voucher`);
      if (isLetter) parts.push("Handwritten Letter");
      if (cPerk) parts.push(cPerk);
      title = parts.length > 0 ? parts.join(" + ") : "Entry Level";
    }

    const data = {
      levelNumber: Number(levelNumber || 1),
      name: name.trim(),
      badgeIcon: badgeIcon || "⭐",
      color: color || "#3B82F6",
      minSpend: Math.max(0, Number(minSpend || 0)),
      minOrders: Math.max(0, Number(minOrders || 0)),
      rewardType: rewardType || "COMBO",
      rewardValue: discAmt,
      rewardTitle: title,
      rewardDescription: (rewardDescription || "").trim(),
      rewardOrderLimit: Math.max(1, Number(rewardOrderLimit || 3)),
      freeShipping: isFreeShipping,
      discountAmount: discAmt,
      giftAmount: giftAmt,
      giftDescription: giftDesc,
      letterIncluded: isLetter,
      customPerk: cPerk,
    };

    let level;
    if (id) {
      level = await prisma.customerLevel.update({
        where: { id },
        data,
      });
    } else {
      level = await prisma.customerLevel.create({ data });
    }

    res.json({ success: true, message: "Loyalty Level saved successfully", level });
  } catch (error) {
    console.error("Error saving loyalty level:", error);
    res.json({ success: false, message: error.message });
  }
};

// DELETE /api/loyalty/level/:id (Admin only)
export const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customerLevel.delete({ where: { id } });
    res.json({ success: true, message: "Loyalty level removed" });
  } catch (error) {
    console.error("Error deleting loyalty level:", error);
    res.json({ success: false, message: error.message });
  }
};

// GET /api/loyalty/my-status (Authenticated User)
export const getUserLoyaltyStatus = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) {
      return res.json({ success: false, message: "User ID required" });
    }

    const loyaltyData = await calculateUserLoyalty(userId);
    res.json({ success: true, loyalty: loyaltyData });
  } catch (error) {
    console.error("Error fetching user loyalty status:", error);
    res.json({ success: false, message: error.message });
  }
};
