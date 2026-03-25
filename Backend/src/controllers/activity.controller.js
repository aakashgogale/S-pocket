import Activity from "../models/activity.model.js";

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
