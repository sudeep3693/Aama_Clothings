import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import subCategoryRouter from "./routes/subCategoryRoute.js";
import colorRouter from "./routes/colorRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import shippingRouter from "./routes/shippingRoute.js";
import loyaltyRouter from "./routes/loyaltyRoute.js";
import customerRouter from "./routes/customerRoute.js";

// App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// Middleware
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://forever-fullstack-2-o-frontend.onrender.com', 'https://forever-fullstack-2-o-admin.onrender.com'], // local frontend and admin frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token'],
  credentials: true,
}));

app.options('*', cors());

//  Api Endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/category", categoryRouter);
app.use("/api/subcategory", subCategoryRouter);
app.use("/api/color", colorRouter);
app.use("/api/review", reviewRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/loyalty", loyaltyRouter);
app.use("/api/customer", customerRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => console.log("Server started on PORT : " + port));