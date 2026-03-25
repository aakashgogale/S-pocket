import jwt from "jsonwebtoken";

let ioInstance;

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

    socket.on("disconnect", () => {
      console.log("User disconnected");
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
