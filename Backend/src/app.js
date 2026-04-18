import { setupMFA } from "./middleware/auth.middleware.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import threatRoutes from "./routes/threat.routes.js";
import fileRoutes from "./routes/file.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import { protect } from "./middleware/auth.middleware.js";
import { verifyAdmin } from "./middleware/admin.middleware.js";
import { rateLimitMiddleware, errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};

// SECURITY MIDDLEWARE FIRST
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"]
    }
  }
}));
app.use(cors(corsOptions));
app.use(rateLimitMiddleware); // Rate limiting

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// PROTECTED ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/setup-mfa", protect, setupMFA);
app.use("/api/threats", protect, threatRoutes);
app.use("/api/files", protect, fileRoutes);
app.use("/api/admin", protect, verifyAdmin, adminRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/activities", protect, activityRoutes);

// ERROR HANDLER LAST
app.use(errorHandler);

export default app;