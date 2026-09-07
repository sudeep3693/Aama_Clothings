import { prisma } from "../config/db.js";

// global variables
const deliveryCharge = 50;

// Placing orders using COD Method with Immutable Price Snapshot
const placeOrder = async (req, res) => {
  try {
    const { userId, items, address } = req.body;

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "No items in order" });
    }

    // Extract product IDs and query current DB records to freeze price snapshots
    const productIds = items.map((i) => i._id || i.id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Validate stock before proceeding
    for (const cartItem of items) {
      const pId = cartItem._id || cartItem.id;
      const matchedProduct = dbProducts.find((p) => p.id === pId);
      if (!matchedProduct) {
        return res.json({ success: false, message: `Product not found: ${cartItem.name || pId}` });
      }

      const orderedQty = Number(cartItem.quantity || 1);
      const parsedVariants = typeof matchedProduct.variants === 'string'
        ? JSON.parse(matchedProduct.variants)
        : (matchedProduct.variants || []);

      if (cartItem.size && cartItem.color && Array.isArray(parsedVariants) && parsedVariants.length > 0) {
        const variant = parsedVariants.find(v => v.size === cartItem.size && v.color === cartItem.color);
        if (variant && variant.quantity !== undefined && variant.quantity !== null) {
          if (orderedQty > variant.quantity) {
            return res.json({
              success: false,
              message: `Requested quantity for "${matchedProduct.name}" (${cartItem.size}/${cartItem.color}) exceeds available stock (${variant.quantity}).`,
            });
          }
        }
      }

      if (matchedProduct.stockQuantity > 0 && orderedQty > matchedProduct.stockQuantity) {
        return res.json({
          success: false,
          message: `Requested quantity for "${matchedProduct.name}" exceeds available stock (${matchedProduct.stockQuantity}).`,
        });
      }
    }

    const frozenItemsSnapshot = items.map((cartItem) => {
      const pId = cartItem._id || cartItem.id;
      const matchedProduct = dbProducts.find((p) => p.id === pId);

      const originalUnitPrice = matchedProduct ? matchedProduct.price : Number(cartItem.price || 0);
      const discountPercentage = matchedProduct ? (matchedProduct.discount || 0) : Number(cartItem.discount || 0);

      const purchasedUnitPrice = discountPercentage > 0
        ? Math.round(originalUnitPrice * (1 - discountPercentage / 100))
        : originalUnitPrice;

      const qty = Number(cartItem.quantity || 1);

      return {
        ...cartItem,
        _id: pId,
        productId: pId,
        name: matchedProduct ? matchedProduct.name : (cartItem.name || "Product"),
        image: matchedProduct ? matchedProduct.image : (cartItem.image || []),
        category: matchedProduct ? matchedProduct.category : (cartItem.category || ""),
        subCategory: matchedProduct ? matchedProduct.subCategory : (cartItem.subCategory || ""),
        size: cartItem.size,
        quantity: qty,
        originalUnitPrice: originalUnitPrice,
        discountPercentage: discountPercentage,
        purchasedUnitPrice: purchasedUnitPrice, // Price snapshot frozen at purchase time
        price: purchasedUnitPrice, // Standardized unit price snapshot
        lineTotal: purchasedUnitPrice * qty,
      };
    });

    const itemsTotal = frozenItemsSnapshot.reduce((acc, item) => acc + item.lineTotal, 0);
    const finalAmount = itemsTotal + deliveryCharge;

    const orderData = {
      userId,
      items: frozenItemsSnapshot,
      amount: finalAmount,
      paymentMethod: "COD",
      payment: false,
      date: BigInt(Date.now()),
      address,
    };

    await prisma.order.create({ data: orderData });

    await prisma.user.update({
      where: { id: userId },
      data: { cartData: {} },
    });

    // Decrement stockQuantity for each ordered product and auto-mark OUT_OF_STOCK if depleted
    for (const cartItem of frozenItemsSnapshot) {
      const pId = cartItem.productId || cartItem._id;
      const orderedQty = Number(cartItem.quantity || 1);
      if (!pId) continue;

      const prod = dbProducts.find((p) => p.id === pId);
      if (!prod) continue;

      // Only track quantity if it was explicitly set (> 0 means tracking is enabled)
      let updateData = {};
      let needsUpdate = false;

      if (prod.stockQuantity > 0) {
        const newQty = Math.max(0, prod.stockQuantity - orderedQty);
        updateData.stockQuantity = newQty;
        needsUpdate = true;
      }

      const sizeStr = cartItem.size;
      const colorStr = cartItem.color;

      // Decrement specific size-color variant quantity
      const parsedVariants = typeof prod.variants === 'string' ? JSON.parse(prod.variants) : (prod.variants || []);
      if (sizeStr && colorStr && parsedVariants.length > 0) {
        const variantIndex = parsedVariants.findIndex(v => v.size === sizeStr && v.color === colorStr);
        if (variantIndex !== -1 && parsedVariants[variantIndex].quantity > 0) {
          parsedVariants[variantIndex].quantity = Math.max(0, parsedVariants[variantIndex].quantity - orderedQty);
          updateData.variants = parsedVariants;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.product.update({
          where: { id: pId },
          data: updateData,
        });
      }
    }

    res.json({ success: true, message: "Order Placed Successfully" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
  try {
    const rawOrders = await prisma.order.findMany({
      orderBy: { date: "desc" },
    });
    const orders = rawOrders.map((item) => ({
      ...item,
      _id: item.id,
      date: Number(item.date),
    }));
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// User Order Data For Frontend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const rawOrders = await prisma.order.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    const orders = rawOrders.map((item) => ({
      ...item,
      _id: item.id,
      date: Number(item.date),
    }));
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update order status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  allOrders,
  userOrders,
  updateStatus,
};
