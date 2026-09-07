import { prisma } from "../config/db.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Route for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ success: false, message: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user.id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for user register
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, name, email, phone, password, agreeTerms } = req.body;

    // Validate name fields
    let fName = (firstName || "").trim();
    let lName = (lastName || "").trim();
    let fullName = "";

    if (fName && lName) {
      fullName = fName.concat(" ").concat(lName);
    } else if (fName) {
      fullName = fName;
    } else if (name) {
      fullName = name.trim();
      const parts = fullName.split(" ");
      fName = parts[0] || "";
      lName = parts.slice(1).join(" ") || "";
    } else {
      return res.json({
        success: false,
        message: "Please enter your first and last name",
      });
    }

    if (!fName) {
      return res.json({ success: false, message: "Please enter your first name" });
    }
    if (!lName) {
      return res.json({ success: false, message: "Please enter your last name" });
    }

    // Checking user already exists or not
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.json({ success: false, message: "User already exists with this email" });
    }

    // Validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Validating phone number if provided
    if (phone && phone.trim().length < 7) {
      return res.json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    // Validating strong password
    if (!password || password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password (minimum 8 characters)",
      });
    }

    // Hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        firstName: fName,
        lastName: lName,
        phone: phone ? phone.trim() : "",
        name: fName.concat(" ").concat(lName),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        cartData: {},
      },
    });

    const token = createToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, adminLogin };
