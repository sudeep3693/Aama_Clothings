import jwt from "jsonwebtoken";

// Middleware for authenticated manufacturers
const authManufacturer = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized. Manufacturer login required." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "manufacturer") {
      return res.json({ success: false, message: "Access denied. Manufacturer only." });
    }
    if (!req.body) req.body = {};
    req.body.manufacturerId = decoded.manufacturerId;
    req.manufacturerId = decoded.manufacturerId;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authManufacturer;
