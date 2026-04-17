import User from "../models/user.model.js";
import Activity from "../models/activity.model.js";
import File from "../models/file.model.js";
import { hashPassword } from "../utils/hash.js";
import { destroyAsset } from "../utils/cloudinary.js";
import { getOnlineUserIds } from "../socket/socket.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const onlineIds = getOnlineUserIds();
    const enriched = users.map((u) => ({
      ...u.toObject(),
      isOnline: onlineIds.has(String(u._id))
    }));
    res.json({ success: true, data: enriched });
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
    if (user.isBlocked && req.io) {
      req.io.to(`user-room:${user._id}`).emit("forceLogout", { reason: "blocked" });
    }
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
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const uploadDir = path.join(__dirname, "..", "..", "uploads");

    const files = await File.find({ user: user._id });
    for (const file of files) {
      if (file.cloudinaryPublicId) {
        try {
          await destroyAsset(file.cloudinaryPublicId, file.cloudinaryResourceType || "raw");
        } catch (cloudErr) {
          console.warn("[admin.controller] cloudinary delete warning:", cloudErr.message);
        }
      } else {
        const filePath = path.join(uploadDir, file.name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    await File.deleteMany({ user: user._id });
    await user.deleteOne();
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("[admin.controller] deleteUser error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listAllFiles = async (req, res) => {
  try {
    const files = await File.find().populate("user", "username email fullName role").sort({ createdAt: -1 });
    res.json({ success: true, data: files });
  } catch (err) {
    console.error("[admin.controller] listAllFiles error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be user or admin" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.role = role;
    await user.save();

    const safeUser = await User.findById(user._id).select("-password");
    return res.json({ success: true, data: safeUser });
  } catch (err) {
    console.error("[admin.controller] setUserRole error:", err);
    return res.status(500).json({ success: false, message: err.message });
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

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeThreats = await Activity.countDocuments({ riskLevel: "Critical" });
    const failedLogins = await Activity.countDocuments({ action: "login", status: "fail" });
    res.json({ success: true, data: { totalUsers, activeThreats, failedLogins } });
  } catch (err) {
    console.error("[admin.controller] getAdminStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminHealth = async (req, res) => {
  try {
    res.json({ success: true, data: { db: "ok", api: "ok" } });
  } catch (err) {
    console.error("[admin.controller] getAdminHealth error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminLogs = async (req, res) => {
  try {
    const { riskLevel, category, userId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (riskLevel) query.riskLevel = riskLevel;
    if (category) query.category = category;
    if (userId) query.user = userId;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Activity.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Activity.countDocuments(query)
    ]);

    res.json({ success: true, data: items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("[admin.controller] getAdminLogs error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isVerified = true;
    await user.save();
    const safeUser = await User.findById(req.params.id).select("-password");
    res.json({ success: true, data: safeUser });
  } catch (err) {
    console.error("[admin.controller] verifyUser error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const results = await User.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          active24h: [{ $match: { lastLogin: { $gte: last24h } } }, { $count: "count" }],
          inactive7d: [{
            $match: {
              $or: [
                { lastLogin: { $lte: last7d } },
                { lastLogin: { $exists: false } },
                { lastLogin: null }
              ]
            }
          }, { $count: "count" }],
          verified: [{ $match: { isVerified: true } }, { $count: "count" }],
          pending: [{
            $match: {
              $or: [
                { isVerified: false },
                { isVerified: { $exists: false } }
              ]
            }
          }, { $count: "count" }]
        }
      }
    ]);

    const facet = results[0] || {};
    const getCount = (arr) => (arr && arr.length ? arr[0].count : 0);
    res.json({
      success: true,
      data: {
        totalUsers: getCount(facet.total),
        activeUsers: getCount(facet.active24h),
        inactiveUsers: getCount(facet.inactive7d),
        verifiedUsers: getCount(facet.verified),
        pendingUsers: getCount(facet.pending)
      }
    });
  } catch (err) {
    console.error("[admin.controller] getUserStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
