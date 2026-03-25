import Threat from "../models/threat.model.js";

/**
 * Handle threat creation and queuing
 */
export const createThreatService = async (threatData, userId) => {
  const newThreat = await Threat.create({
    ...threatData,
    user: userId
  });

  return newThreat;
};

/**
 * Get threats for a user
 */
export const getThreatsService = async (userId) => {
  return await Threat.find({ user: userId }).sort({ createdAt: -1 });
};
