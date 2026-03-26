import Activity from "../models/activity.model.js";

export const logActivity = async ({
  userId,
  action,
  status = "success",
  category = "System",
  ipAddress,
  riskLevel = "Low",
  isThreat = false,
  meta = {}
}) => {
  const activity = await Activity.create({
    user: userId,
    action,
    status,
    category,
    ipAddress,
    riskLevel,
    isThreat,
    meta
  });

  return activity;
};
