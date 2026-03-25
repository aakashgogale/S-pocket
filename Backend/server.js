import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

import "./src/config/env.js";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { initSocket } from "./src/socket/socket.js";
import { createServer } from "http";
import { Server } from "socket.io";

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

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("[server] HTTP server error:", err);
});
