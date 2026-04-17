import Activity from "../models/activity.model.js";
import { logActivity } from "../services/activity.service.js";

export const getActivities = async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { user: req.user.id };
    const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: activities });
  } catch (err) {
    console.error("[activity.controller] getActivities error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createActivity = async (req, res) => {
  try {
    const { action, status, category, riskLevel, isThreat, meta } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, message: "Action is required" });
    }

    const activity = await logActivity({
      userId: req.user.id,
      action,
      status,
      category,
      riskLevel,
      isThreat,
      meta,
      ipAddress: req.ip
    });
    return res.status(201).json({ success: true, data: activity });
  } catch (err) {
    console.error("[activity.controller] createActivity error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
