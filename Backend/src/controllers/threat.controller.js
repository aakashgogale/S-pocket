import { createThreatService, getThreatsService } from "../services/threat.service.js";
import { detectThreat } from "../utils/threatDetector.js";
import { sendThreatAlert } from "../socket/socket.js";
import { validationResult } from "express-validator";

/**
 * @desc    Detect and create a threat
 * @route   POST /api/threats
 * @access  Private
 */
export const createThreatController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, msg: errors.array()[0].msg });
  }

  try {
    const detection = detectThreat(req.body);
    const newThreat = await createThreatService(detection.threat, req.user.id);

    if (detection.flagged) {
      sendThreatAlert(req.user.id, newThreat);
    }

    res.status(201).json({
      success: true,
      data: newThreat
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * @desc    Get all threats for a user
 * @route   GET /api/threats
 * @access  Private
 */
export const getThreatsController = async (req, res) => {
  try {
    const threats = await getThreatsService(req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      count: threats.length,
      data: threats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
