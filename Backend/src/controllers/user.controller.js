import User from "../models/user.model.js";
import { validationResult } from "express-validator";
import { uploadProfileImage } from "../utils/cloudinary.js";
import { logActivity } from "../services/activity.service.js";

const toSafeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete user.password;
  return {
    ...user,
    id: String(user._id || user.id)
  };
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json({ success: true, data: toSafeUser(user) });
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
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.file) {
      const url = await uploadProfileImage(req.file.buffer, `user_${req.user.id}`);
      updates.profilePic = url;
      updates.avatar = url;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    await logActivity({
      userId: req.user.id,
      action: "profile_update",
      status: "success",
      category: "System",
      riskLevel: "Low",
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: toSafeUser(user)
    });
  } catch (err) {
    console.error("[user.controller] updateProfile error:", err);
    if (err.code === 11000) {
      const dupField = err.keyPattern?.email ? "Email" : "Username";
      return res.status(400).json({ success: false, message: `${dupField} already exists` });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};
