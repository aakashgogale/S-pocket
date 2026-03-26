import User from "../models/user.model.js";
import { validationResult } from "express-validator";
import { uploadProfileImage } from "../utils/cloudinary.js";
import { logActivity } from "../services/activity.service.js";

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ success: true, data: user });
};

export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const updates = {};
  const allowedFields = ["fullName", "username", "location", "bio", "avatar", "profilePic"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  try {
    if (req.file) {
      const url = await uploadProfileImage(req.file.buffer, `user_${req.user.id}`);
      updates.profilePic = url;
      updates.avatar = url;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true, select: "-password" }
    );

    await logActivity({
      userId: req.user.id,
      action: "profile_update",
      status: "success",
      category: "System",
      riskLevel: "Low",
      ipAddress: req.ip
    });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("[user.controller] updateProfile error:", err);
    if (err.code === 11000) {
      const dupField = err.keyPattern?.email ? "Email" : "Username";
      return res.status(400).json({ success: false, message: `${dupField} already exists` });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};
