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
import offerRouter from "./routes/offerRoute.js";
import cogsRouter from "./routes/cogsRoute.js";
import financialRouter from "./routes/financialRoute.js";
import returnsRouter from "./routes/returnsRoute.js";
import accountingRouter from "./routes/accountingRoute.js";
import { ensureStandardChartOfAccounts } from "./services/accountingPostingEngine.js";

// App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();
ensureStandardChartOfAccounts();

// Middleware
app.use(express.json());

// Build allowed origins from env vars (supports local dev + deployed Netlify URLs)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean); // removes undefined/null if env vars not set

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
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
app.use("/api/offer", offerRouter);
app.use("/api/cogs", cogsRouter);
app.use("/api/finance", financialRouter);
app.use("/api/returns", returnsRouter);
app.use("/api/accounting", accountingRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => console.log("Server started on PORT : " + port));