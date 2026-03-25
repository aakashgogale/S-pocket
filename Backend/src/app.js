import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import threatRoutes from "./routes/threat.routes.js";
import fileRoutes from "./routes/file.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import activityRoutes from "./routes/activity.routes.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const allowedOrigins = process.env.FRONTEND_URL?.split(",") ?? [
  "http://localhost:5173"
];

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  })
);
app.use(helmet());

// serve uploaded files (for downloads)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);

app.use("/api/threats", threatRoutes);

app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activities", activityRoutes);

export default app;
