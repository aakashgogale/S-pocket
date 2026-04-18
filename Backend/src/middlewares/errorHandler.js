// middlewares/errorHandler.js

import rateLimit from "express-rate-limit";

// 🔥 Error handler (named export now)
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      msg: "Invalid token",
    });
  }

  // Custom errors
  if (err.isCustom) {
    return res.status(err.status || 400).json({
      success: false,
      msg: err.message,
    });
  }

  res.status(500).json({
    success: false,
    msg: "Internal server error",
  });
};

// 🔥 Rate limiting middleware
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: {
    success: false,
    msg: "Too many requests",
  },
  standardHeaders: true,
  legacyHeaders: false,
});