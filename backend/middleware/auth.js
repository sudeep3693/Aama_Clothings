import jwt from "jsonwebtoken";

// Middleware for authenticated customers
const authUser = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized Login Again" });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!req.body) req.body = {};
    req.body.userId = token_decode.id;
    req.userId = token_decode.id;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Middleware for authenticated admins
const authAdmin = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized. Admin login required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.json({ success: false, message: "Access denied. Admin only." });
    }
    if (!req.body) req.body = {};
    req.body.adminId = decoded.adminId;
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { authAdmin };
export default authUser;
