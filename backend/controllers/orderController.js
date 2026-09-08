import { prisma } from "../config/db.js";
import { calculateUserLoyalty } from "./loyaltyController.js";

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
    
    // Resolve dynamic shipping charge from ShippingConfig
    let expectedFee = deliveryCharge;
    try {
      const shippingCfg = await prisma.shippingConfig.findFirst();
      if (shippingCfg) {
        const destCity = (address?.city || "").trim().toLowerCase();
        const baseCity = (shippingCfg.baseCity || "Kathmandu").trim().toLowerCase();
        const isFree = Number(shippingCfg.freeShippingMin || 0) > 0 && itemsTotal >= Number(shippingCfg.freeShippingMin);

        if (isFree) {
          expectedFee = 0;
        } else if (destCity && destCity === baseCity) {
          expectedFee = Number(shippingCfg.sameCityFee || 50);
        } else {
          expectedFee = Number(shippingCfg.differentCityFee || 120);
        }
      }
    } catch (cfgErr) {
      console.error("Error reading shipping config:", cfgErr);
    }

    // Check user loyalty level and reward eligibility
    let loyaltyDiscount = 0;
    let rewardApplied = null;
    try {
      if (userId) {
        const loyaltyStatus = await calculateUserLoyalty(userId);
        if (loyaltyStatus?.activeReward?.isEligible) {
          const act = loyaltyStatus.activeReward;

          if (act.freeShipping) {
            expectedFee = 0;
          }

          if (act.discountAmount > 0) {
            loyaltyDiscount = Math.min(itemsTotal, Number(act.discountAmount));
          }

          rewardApplied = {
            freeShipping: Boolean(act.freeShipping),
            discountAmount: loyaltyDiscount,
            giftAmount: act.giftAmount || 0,
            giftDescription: act.giftDescription || "",
            letterIncluded: Boolean(act.letterIncluded),
            customPerk: act.customPerk || "",
            levelName: loyaltyStatus.currentLevel.name,
            levelIcon: loyaltyStatus.currentLevel.badgeIcon,
            title: act.title || "VIP Reward",
            usage: `Use ${act.currentUseIndex} of ${act.orderLimit}`,
          };
        }
      }
    } catch (loyErr) {
      console.error("Error applying loyalty reward:", loyErr);
    }

    const resolvedFee = req.body.deliveryFee !== undefined
      ? Math.max(0, Number(req.body.deliveryFee))
      : expectedFee;

    const finalAmount = Math.max(0, itemsTotal + resolvedFee - loyaltyDiscount);

    const orderData = {
      userId,
      items: frozenItemsSnapshot,
      amount: finalAmount,
      paymentMethod: "COD",
      payment: false,
      date: BigInt(Date.now()),
      address,
      loyaltyDiscount,
      rewardApplied: rewardApplied ? JSON.stringify(rewardApplied) : "{}",
    };

    await prisma.order.create({ data: orderData });

    // Update user cart and saved addresses
    try {
      const userRecord = await prisma.user.findUnique({ where: { id: userId } });
      if (userRecord) {
        let addresses = [];
        if (Array.isArray(userRecord.addresses)) addresses = userRecord.addresses;
        else if (typeof userRecord.addresses === "string") {
          try {
            addresses = JSON.parse(userRecord.addresses);
          } catch {
            addresses = [];
          }
        }

        const newAddr = {
          ...address,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };

        const existingIdx = addresses.findIndex(
          (a) =>
            a.city === address.city &&
            a.street === address.street &&
            a.state === address.state
        );

        if (existingIdx !== -1) {
          addresses[existingIdx] = { ...addresses[existingIdx], ...newAddr };
        } else {
          addresses = [newAddr, ...addresses].slice(0, 5);
        }

        await prisma.user.update({
          where: { id: userId },
          data: { cartData: {}, addresses },
        });
      }
    } catch (addrErr) {
      console.error("Error saving address to user profile:", addrErr);
      await prisma.user.update({
        where: { id: userId },
        data: { cartData: {} },
      });
    }

    // Aggregate all requested items by product ID and variant
    const productDeductions = {};
    for (const cartItem of frozenItemsSnapshot) {
      const pId = cartItem.productId || cartItem._id;
      const orderedQty = Number(cartItem.quantity || 1);
      if (!pId) continue;

      if (!productDeductions[pId]) {
        productDeductions[pId] = {
          totalQty: 0,
          variantDeductions: [],
        };
      }
      productDeductions[pId].totalQty += orderedQty;

      if (cartItem.size && cartItem.color) {
        productDeductions[pId].variantDeductions.push({
          size: cartItem.size,
          color: cartItem.color,
          quantity: orderedQty,
        });
      }
    }

    // Safely apply aggregated stock deduction per product in DB
    for (const [pId, deduction] of Object.entries(productDeductions)) {
      const currentProd = await prisma.product.findUnique({ where: { id: pId } });
      if (!currentProd) continue;

      let updateData = {};
      let parsedVariants = typeof currentProd.variants === "string"
        ? JSON.parse(currentProd.variants || "[]")
        : (currentProd.variants || []);

      const hasVariants = Array.isArray(parsedVariants) && parsedVariants.length > 0;

      if (hasVariants && deduction.variantDeductions.length > 0) {
        for (const vd of deduction.variantDeductions) {
          const vIdx = parsedVariants.findIndex(
            (v) => v.size === vd.size && v.color === vd.color
          );
          if (vIdx !== -1) {
            const currentVariantQty = Number(parsedVariants[vIdx].quantity || 0);
            parsedVariants[vIdx].quantity = Math.max(0, currentVariantQty - vd.quantity);
          }
        }
        updateData.variants = parsedVariants;

        // Synchronize stockQuantity to the total remaining across all variants
        const totalVariantStock = parsedVariants.reduce(
          (acc, v) => acc + (Number(v.quantity) || 0),
          0
        );
        updateData.stockQuantity = totalVariantStock;
      } else if (
        currentProd.stockQuantity !== undefined &&
        currentProd.stockQuantity !== null
      ) {
        const newStock = Math.max(0, Number(currentProd.stockQuantity) - deduction.totalQty);
        updateData.stockQuantity = newStock;
      }

      await prisma.product.update({
        where: { id: pId },
        data: updateData,
      });
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

const cashReceived = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    if (order.status !== "Delivered") {
      return res.json({ success: false, message: "Order not delivered yet" });
    }
    await prisma.order.update({
      where: { id: orderId },
      data: { payment: true },
    });
    res.json({ success: true, message: "Cash marked as received" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Admin Create Order for Social Media & Manual Phone Inquiries
const adminCreateOrder = async (req, res) => {
  try {
    const {
      client,
      items,
      discount = 0,
      deliveryFee,
      paymentMethod = "COD",
      payment = false,
      status = "Order Placed",
    } = req.body;

    if (!client || !client.firstName || !client.phone) {
      return res.json({
        success: false,
        message: "Customer first name and contact phone number are required",
      });
    }

    if (!items || items.length === 0) {
      return res.json({
        success: false,
        message: "Please select at least one product for the order",
      });
    }

    // Extract product IDs and query current DB records to freeze price snapshots
    const productIds = items.map((i) => i._id || i.id || i.productId).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Validate stock before proceeding
    for (const cartItem of items) {
      const pId = cartItem._id || cartItem.id || cartItem.productId;
      const matchedProduct = dbProducts.find((p) => p.id === pId);
      if (!matchedProduct) {
        return res.json({
          success: false,
          message: `Product not found: ${cartItem.name || pId}`,
        });
      }

      const orderedQty = Number(cartItem.quantity || 1);
      const parsedVariants =
        typeof matchedProduct.variants === "string"
          ? JSON.parse(matchedProduct.variants)
          : matchedProduct.variants || [];

      if (
        cartItem.size &&
        cartItem.color &&
        Array.isArray(parsedVariants) &&
        parsedVariants.length > 0
      ) {
        const variant = parsedVariants.find(
          (v) => v.size === cartItem.size && v.color === cartItem.color
        );
        if (variant && variant.quantity !== undefined && variant.quantity !== null) {
          if (orderedQty > variant.quantity) {
            return res.json({
              success: false,
              message: `Requested quantity (${orderedQty}) for "${matchedProduct.name}" (${cartItem.size}/${cartItem.color}) exceeds available stock (${variant.quantity}).`,
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

    // Freeze snapshot of items
    const frozenItemsSnapshot = items.map((cartItem) => {
      const pId = cartItem._id || cartItem.id || cartItem.productId;
      const matchedProduct = dbProducts.find((p) => p.id === pId);

      const originalUnitPrice = matchedProduct
        ? matchedProduct.price
        : Number(cartItem.originalUnitPrice || cartItem.price || 0);
      const discountPercentage = matchedProduct
        ? matchedProduct.discount || 0
        : Number(cartItem.discountPercentage || 0);

      const calculatedUnit =
        discountPercentage > 0
          ? Math.round(originalUnitPrice * (1 - discountPercentage / 100))
          : originalUnitPrice;

      const purchasedUnitPrice =
        cartItem.purchasedUnitPrice !== undefined
          ? Number(cartItem.purchasedUnitPrice)
          : cartItem.price !== undefined
          ? Number(cartItem.price)
          : calculatedUnit;

      const qty = Number(cartItem.quantity || 1);

      return {
        ...cartItem,
        _id: pId,
        productId: pId,
        name: matchedProduct ? matchedProduct.name : cartItem.name || "Product",
        image: matchedProduct ? matchedProduct.image : cartItem.image || [],
        category: matchedProduct ? matchedProduct.category : cartItem.category || "",
        subCategory: matchedProduct ? matchedProduct.subCategory : cartItem.subCategory || "",
        size: cartItem.size || "",
        color: cartItem.color || "",
        quantity: qty,
        originalUnitPrice: originalUnitPrice,
        discountPercentage: discountPercentage,
        purchasedUnitPrice: purchasedUnitPrice,
        price: purchasedUnitPrice,
        lineTotal: purchasedUnitPrice * qty,
      };
    });

    const itemsTotal = frozenItemsSnapshot.reduce((acc, item) => acc + item.lineTotal, 0);

    // Dynamic shipping calculation according to shipment rates (ShippingConfig)
    let expectedFee = 50;
    try {
      const shippingCfg = await prisma.shippingConfig.findFirst();
      if (shippingCfg) {
        const destCity = (client.city || "").trim().toLowerCase();
        const baseCity = (shippingCfg.baseCity || "Kathmandu").trim().toLowerCase();
        const isFree =
          Number(shippingCfg.freeShippingMin || 0) > 0 &&
          itemsTotal >= Number(shippingCfg.freeShippingMin);

        if (isFree) {
          expectedFee = 0;
        } else if (destCity && destCity === baseCity) {
          expectedFee = Number(shippingCfg.sameCityFee || 50);
        } else {
          expectedFee = Number(shippingCfg.differentCityFee || 120);
        }
      }
    } catch (cfgErr) {
      console.error("Error reading shipping config:", cfgErr);
    }

    const resolvedFee =
      deliveryFee !== undefined && deliveryFee !== null && deliveryFee !== ""
        ? Math.max(0, Number(deliveryFee))
        : expectedFee;

    const manualDiscount = Math.max(0, Number(discount) || 0);
    const finalAmount = Math.max(0, itemsTotal + resolvedFee - manualDiscount);

    // Associate userId: check if a user with client's email exists
    let orderUserId = "admin_social_client";
    if (client.email && client.email.trim()) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: client.email.trim() },
        });
        if (existingUser) {
          orderUserId = existingUser.id;
        }
      } catch (e) {
        console.error("Error checking user for admin order:", e);
      }
    }

    const addressSnapshot = {
      firstName: client.firstName.trim(),
      lastName: (client.lastName || "").trim(),
      email: (client.email || "").trim(),
      phone: client.phone.trim(),
      street: client.street || "",
      landmark: client.landmark || "",
      city: client.city || "Kathmandu",
      state: client.state || "Bagmati Province",
      zipcode: client.zipcode || "44600",
      country: client.country || "Nepal",
      source: client.source || "Social Media",
      socialUsername: client.socialUsername || "",
      orderNotes: client.orderNotes || "",
    };

    const newOrder = await prisma.order.create({
      data: {
        userId: orderUserId,
        items: frozenItemsSnapshot,
        amount: finalAmount,
        paymentMethod: paymentMethod || "COD",
        payment: Boolean(payment),
        status: status || "Order Placed",
        date: BigInt(Date.now()),
        address: addressSnapshot,
        loyaltyDiscount: manualDiscount,
        rewardApplied: JSON.stringify({
          source: client.source || "Social Media",
          manualDiscount,
          deliveryFee: resolvedFee,
          adminCreated: true,
        }),
      },
    });

    // Deduct stock
    const productDeductions = {};
    for (const cartItem of frozenItemsSnapshot) {
      const pId = cartItem.productId || cartItem._id;
      const orderedQty = Number(cartItem.quantity || 1);
      if (!pId) continue;

      if (!productDeductions[pId]) {
        productDeductions[pId] = {
          totalQty: 0,
          variantDeductions: [],
        };
      }
      productDeductions[pId].totalQty += orderedQty;

      if (cartItem.size && cartItem.color) {
        productDeductions[pId].variantDeductions.push({
          size: cartItem.size,
          color: cartItem.color,
          quantity: orderedQty,
        });
      }
    }

    for (const [pId, deduction] of Object.entries(productDeductions)) {
      const currentProd = await prisma.product.findUnique({ where: { id: pId } });
      if (!currentProd) continue;

      let updateData = {};
      let parsedVariants =
        typeof currentProd.variants === "string"
          ? JSON.parse(currentProd.variants || "[]")
          : currentProd.variants || [];

      const hasVariants = Array.isArray(parsedVariants) && parsedVariants.length > 0;

      if (hasVariants && deduction.variantDeductions.length > 0) {
        for (const vd of deduction.variantDeductions) {
          const vIdx = parsedVariants.findIndex(
            (v) => v.size === vd.size && v.color === vd.color
          );
          if (vIdx !== -1) {
            const currentVariantQty = Number(parsedVariants[vIdx].quantity || 0);
            parsedVariants[vIdx].quantity = Math.max(0, currentVariantQty - vd.quantity);
          }
        }
        updateData.variants = parsedVariants;
        const totalVariantStock = parsedVariants.reduce(
          (acc, v) => acc + (Number(v.quantity) || 0),
          0
        );
        updateData.stockQuantity = totalVariantStock;
      } else if (
        currentProd.stockQuantity !== undefined &&
        currentProd.stockQuantity !== null
      ) {
        const newStock = Math.max(0, Number(currentProd.stockQuantity) - deduction.totalQty);
        updateData.stockQuantity = newStock;
      }

      await prisma.product.update({
        where: { id: pId },
        data: updateData,
      });
    }

    res.json({
      success: true,
      message: "Order created successfully",
      orderId: newOrder.id,
      order: {
        ...newOrder,
        _id: newOrder.id,
        date: Number(newOrder.date),
      },
    });
  } catch (error) {
    console.error("Admin create order error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  allOrders,
  userOrders,
  updateStatus,
  cashReceived,
  adminCreateOrder,
};
