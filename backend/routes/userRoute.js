import express from "express";
import {
  loginUser,
  registerUser,
  getUserProfile,
  saveUserAddress,
  deleteUserAddress,
  adminLogin,
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);

// Customer Authenticated Routes
userRouter.get("/profile", authUser, getUserProfile);
userRouter.post("/address/save", authUser, saveUserAddress);
userRouter.post("/address/delete", authUser, deleteUserAddress);

export default userRouter;
