import { prisma } from "../config/db.js";

// add products to user cart
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size, color } = req.body;
    const userData = await prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = structuredClone(userData.cartData || {});
    const variantKey = color ? `${size}-${color}` : size;

    if (cartData[itemId]) {
      if (cartData[itemId][variantKey]) {
        cartData[itemId][variantKey] += 1;
      } else {
        cartData[itemId][variantKey] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][variantKey] = 1;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { cartData },
    });
    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update user cart
const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, color, quantity } = req.body;
    const userData = await prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = structuredClone(userData.cartData || {});
    const variantKey = color ? `${size}-${color}` : size;

    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }
    cartData[itemId][variantKey] = quantity;

    await prisma.user.update({
      where: { id: userId },
      data: { cartData },
    });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get user cart data
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }
    let cartData = userData.cartData || {};

    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };
