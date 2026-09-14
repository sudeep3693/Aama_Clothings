import jwt from "jsonwebtoken";

// Middleware for authenticated delivery partners
const authDelivery = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized. Delivery partner login required." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "delivery_partner") {
      return res.json({ success: false, message: "Access denied. Delivery partner only." });
    }
    if (!req.body) req.body = {};
    req.body.deliveryPartnerId = decoded.deliveryPartnerId;
    req.deliveryPartnerId = decoded.deliveryPartnerId;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authDelivery;
