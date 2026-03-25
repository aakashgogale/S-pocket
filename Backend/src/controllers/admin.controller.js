import User from "../models/user.model.js";
import { hashPassword } from "../utils/hash.js";

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, data: users });
  } catch (err) {
    console.error("[admin.controller] listUsers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setBlockUser = async (req, res) => {
  try {
    const { blocked } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot block admin" });
    }
    user.isBlocked = Boolean(blocked);
    user.blockedAt = user.isBlocked ? new Date() : null;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("[admin.controller] setBlockUser error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot delete admin" });
    }
    await user.deleteOne();
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("[admin.controller] deleteUser error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["username", "fullName", "email", "profilePic", "avatar", "location", "bio"];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    if (req.body.password) {
      updates.password = await hashPassword(req.body.password);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true, select: "-password" }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("[admin.controller] updateAdminProfile error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
