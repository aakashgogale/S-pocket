import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

import "./src/config/env.js";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { initSocket } from "./src/socket/socket.js";
import { createServer } from "http";
import { Server } from "socket.io";
import Activity from "./src/models/activity.model.js";
import mongoose from "mongoose";

if (!process.env.JWT_SECRET) {
  console.error("[server] JWT_SECRET is missing. Auth tokens will fail.");
}

const allowedOrigins = process.env.FRONTEND_URL?.split(",") ?? [
  "http://localhost:5173"
];

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// socket init
initSocket(io);

// inject io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// db connect
connectDB().catch((err) => {
  console.error("[server] DB connection failed:", err);
  process.exit(1);
});

// Watch Activity collection for real-time emits
mongoose.connection.once("open", () => {
  try {
    const changeStream = Activity.watch([], { fullDocument: "updateLookup" });
    changeStream.on("change", (change) => {
      if (change.operationType !== "insert") return;
      const doc = change.fullDocument;
      const payload = {
        id: doc._id,
        user: doc.user,
        action: doc.action,
        status: doc.status,
        category: doc.category,
        riskLevel: doc.riskLevel,
        isThreat: doc.isThreat,
        meta: doc.meta,
        createdAt: doc.createdAt
      };
      io.to("admin-room").emit("activity", payload);
      if (doc.user) {
        io.to(`user-room:${doc.user}`).emit("activity", payload);
      }
      if (doc.isThreat || doc.riskLevel === "Critical") {
        io.to("admin-room").emit("threatAlert", {
          title: doc.action,
          severity: "critical",
          userId: String(doc.user || ""),
          meta: doc.meta,
          createdAt: doc.createdAt
        });
      }
    });
    changeStream.on("error", (err) => {
      console.error("[server] Activity watch error:", err);
    });
  } catch (err) {
    console.error("[server] Activity watch setup error:", err);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("[server] HTTP server error:", err);
});
