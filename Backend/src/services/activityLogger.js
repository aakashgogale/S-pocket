// services/activityLogger.js

import mongoose from "mongoose";

// Optional: simple schema (only if you want DB logging)
const activitySchema = new mongoose.Schema({
  userId: String,
  action: String,
  status: String,
  category: String,
  riskLevel: String,
  ipAddress: String,
  meta: Object,
  timestamp: { type: Date, default: Date.now },
});

// Avoid redefining model (important)
const Activity =
  mongoose.models.Activity ||
  mongoose.model("Activity", activitySchema);

// 🔥 Main logger function
const logActivity = async (data) => {
  try {
    await Activity.create(data);
    console.log("📊 Activity logged:", data.action);
  } catch (err) {
    console.error("❌ Activity log error:", err.message);
  }
};

export default logActivity;