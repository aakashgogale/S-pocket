import { registerUserService, loginUserService } from "../services/auth.service.js";
import { validationResult } from "express-validator";
import { logActivity } from "../services/activity.service.js";
import User from "../models/user.model.js";
import { hashPassword } from "../utils/hash.js";

export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array()[0].msg;
    return res.status(400).json({ success: false, message: msg, msg });
  }

  try {
    const { username, fullName, email, password } = req.body;
    const finalUsername = username || fullName;
    if (!finalUsername) {
      return res.status(400).json({ success: false, message: "Name is required", msg: "Name is required" });
    }

    const { user, token } = await registerUserService(finalUsername, fullName, email, password);
    await logActivity({
      userId: user._id,
      action: "User registered",
      type: "info",
      io: req.io
    });
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.username || user.fullName,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profilePic: user.profilePic,
        location: user.location,
        bio: user.bio,
        isVerified: user.isVerified
      },
      token
    });
  } catch (err) {
    console.error("[auth.controller] registerUser error:", err);
    if (err.code === 11000) {
      const dupField = err.keyPattern?.email ? "Email" : "Username";
      const msg = `${dupField} already exists`;
      return res.status(400).json({ success: false, message: msg, msg });
    }
    const status = err.statusCode ?? 400;
    res.status(status).json({ success: false, message: err.message, msg: err.message });
  }
};

export const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array()[0].msg;
    return res.status(400).json({ success: false, message: msg, msg });
  }

  try {
    const { email, password } = req.body;
    const result = await loginUserService(email, password);
    await logActivity({
      userId: result.user._id,
      action: "User logged in",
      type: "success",
      io: req.io
    });
    res.status(200).json({
      success: true,
      user: {
        id: result.user._id,
        name: result.user.username || result.user.fullName,
        username: result.user.username,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
        avatar: result.user.avatar,
        profilePic: result.user.profilePic,
        location: result.user.location,
        bio: result.user.bio,
        isVerified: result.user.isVerified
      },
      token: result.token
    });
  } catch (err) {
    console.error("[auth.controller] loginUser error:", err);
    if (err.message === "Invalid credentials") {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const status = err.statusCode ?? 400;
    res.status(status).json({ success: false, message: err.message, msg: err.message });
  }
};

export const loginAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array()[0].msg;
    return res.status(400).json({ success: false, message: msg, msg });
  }

  try {
    const { email, password } = req.body;
    const result = await loginUserService(email, password);
    if (result.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }
    res.status(200).json({
      success: true,
      user: {
        id: result.user._id,
        name: result.user.username || result.user.fullName,
        username: result.user.username,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
        avatar: result.user.avatar,
        profilePic: result.user.profilePic,
        location: result.user.location,
        bio: result.user.bio,
        isVerified: result.user.isVerified
      },
      token: result.token
    });
  } catch (err) {
    console.error("[auth.controller] loginAdmin error:", err);
    const status = err.statusCode ?? 400;
    res.status(status).json({ success: false, message: err.message, msg: err.message });
  }
};

export const registerAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array()[0].msg;
    return res.status(400).json({ success: false, message: msg, msg });
  }

  const secret = req.headers["x-admin-secret"] || req.body.adminSecret;
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Invalid admin secret" });
  }

  try {
    const { username, fullName, email, password } = req.body;
    const finalUsername = username || fullName;
    if (!finalUsername) {
      return res.status(400).json({ success: false, message: "Name is required", msg: "Name is required" });
    }

    const { user, token } = await registerUserService(finalUsername, fullName, email, password);
    user.role = "admin";
    await user.save();

    await logActivity({
      userId: user._id,
      action: "Admin registered",
      type: "info",
      io: req.io
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.username || user.fullName,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profilePic: user.profilePic,
        location: user.location,
        bio: user.bio,
        isVerified: user.isVerified
      },
      token
    });
  } catch (err) {
    console.error("[auth.controller] registerAdmin error:", err);
    const status = err.statusCode ?? 400;
    res.status(status).json({ success: false, message: err.message, msg: err.message });
  }
};

export const setupAdmin = async (req, res) => {
  const secret = req.headers["x-admin-secret"] || req.body.adminSecret;
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Invalid admin secret" });
  }

  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(409).json({ success: false, message: "Admin already exists" });
    }

    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "username, email, and password are required" });
    }

    const hashedPassword = await hashPassword(password);
    const admin = await User.create({
      username,
      fullName: fullName || username,
      email,
      password: hashedPassword,
      role: "admin",
      isVerified: true
    });

    await logActivity({
      userId: admin._id,
      action: "Admin setup created",
      type: "info",
      io: req.io
    });

    return res.status(201).json({
      success: true,
      user: {
        id: admin._id,
        name: admin.username || admin.fullName,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("[auth.controller] setupAdmin error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const resetAdminPassword = async (req, res) => {
  const secret = req.headers["x-admin-secret"] || req.body.adminSecret;
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Invalid admin secret" });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.role = "admin";
    user.isVerified = true;
    await user.save();

    return res.json({ success: true, message: "Admin password reset" });
  } catch (err) {
    console.error("[auth.controller] resetAdminPassword error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAuthMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("[auth.controller] getAuthMe error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
