import Activity from "../models/activity.model.js";

export const logActivity = async ({ userId, action, type = "info", isThreat = false, meta = {}, io }) => {
  const activity = await Activity.create({
    user: userId,
    action,
    type,
    isThreat,
    meta
  });

  if (io) {
    const payload = {
      id: activity._id,
      user: activity.user,
      action: activity.action,
      type: activity.type,
      isThreat: activity.isThreat,
      meta: activity.meta,
      createdAt: activity.createdAt
    };
    io.to("admin-room").emit("activity", payload);
    io.to(`user-room:${activity.user}`).emit("activity", payload);
    if (activity.isThreat) {
      io.to("admin-room").emit("threatAlert", {
        title: activity.action,
        severity: "critical",
        userId: String(activity.user),
        meta: activity.meta,
        createdAt: activity.createdAt
      });
    }
  }

  return activity;
};
