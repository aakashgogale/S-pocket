import jwt from "jsonwebtoken";

let ioInstance;
const onlineCounts = new Map();

export const initSocket = (io) => {
  ioInstance = io;

  // Authentication Middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Authentication error: Invalid token"));
      socket.user = decoded;
      if (decoded.role === "admin") {
        socket.join("admin-room");
      }
      socket.join(`user-room:${decoded.id}`);
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    const userId = String(socket.user.id);
    onlineCounts.set(userId, (onlineCounts.get(userId) || 0) + 1);

    socket.on("disconnect", () => {
      console.log("User disconnected");
      const current = onlineCounts.get(userId) || 0;
      if (current <= 1) {
        onlineCounts.delete(userId);
      } else {
        onlineCounts.set(userId, current - 1);
      }
    });
  });
};

// Emit to a specific user (room) and admin-room
export const sendThreatAlert = (userId, data) => {
  if (!ioInstance) return;
  if (userId) {
    ioInstance.to(`user-room:${userId}`).emit("threatAlert", data);
  }
  ioInstance.to("admin-room").emit("threatAlert", data);
};

export const getOnlineUserIds = () => {
  return new Set(onlineCounts.keys());
};
