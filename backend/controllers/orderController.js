import { prisma } from "../config/db.js";

// global variables
const currency = "inr";
const deliveryCharge = 50;

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const orderData = {
      userId,
      items,
      amount: Number(amount),
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
    res.json({ success: true, message: "Order Placed" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
  try {
    const rawOrders = await prisma.order.findMany({});
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
    const rawOrders = await prisma.order.findMany({ where: { userId } });
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
