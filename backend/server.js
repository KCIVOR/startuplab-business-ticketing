import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import adminEventRoutes from "./routes/adminEventRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { authMiddleware } from "./middleware/auth.js";
import paymentRoutes from "./routes/paymentRoutes.js";


dotenv.config();
const PORT = process.env.BACKEND_PORT
const app = express();


const allowedOrigins = (process.env.ALLOWED_ORIGINS);


app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    const isAllowed = allowedOrigins.includes(normalized);
    return callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(helmet());
app.use(morgan("dev"));

app.use(cookieParser());
app.use(express.json());

app.use("/api/events", eventRoutes);
import ticketRoutes from "./routes/ticketRoutes.js";
import ticketTypeRoutes from "./routes/ticketTypeRoutes.js";
app.use("/api/tickets", ticketRoutes);
app.use("/api/ticket-types", ticketTypeRoutes);
import orderRoutes from "./routes/orderRoutes.js";
app.use("/api", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/invite", inviteRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", userRoutes);
app.use("/api/admin/events", authMiddleware, adminEventRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
