import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import { hashPassword } from "../utils/hash.js";
import { generateToken } from "../services/token.service.js";
import { logActivity } from "../services/activity.service.js";

const createJwtToken = (user) => {
  return generateToken(user);
};

const googleClient = new OAuth2Client();

const sanitizeAuthUser = (user) => ({
  id: user._id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  createdAt: user.createdAt,
  role: user.role,
  profilePic: user.profilePic,
  avatar: user.avatar
});

const buildUsername = async (seed) => {
  const safeBase =
    (seed || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24) || "user";

  let candidate = safeBase;
  let counter = 0;
  while (await User.exists({ username: candidate })) {
    counter += 1;
    candidate = `${safeBase}_${counter}`.slice(0, 30);
  }
  return candidate;
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const registerUser = async (req, res) => {
  try {
    const { username, fullName, email, password, createdAt } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      await logActivity({
        action: "register",
        status: "fail",
        category: "Auth",
        riskLevel: "Moderate",
        ipAddress: req.ip,
        meta: { email, reason: "duplicate_user" }
      });
      return res.status(400).json({
        message: "User with the same email or username already exists"
      });
    }

    const hash = await hashPassword(password);
    const user = await User.create({
      username,
      fullName: fullName || username,
      email,
      password: hash,
      createdAt,
      role: "user",
      isVerified: false
    });

    const token = createJwtToken(user);

    res.cookie("token", token, cookieOptions);

    await logActivity({
      userId: user._id,
      action: "register",
      status: "success",
      category: "Auth",
      riskLevel: "Low",
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: sanitizeAuthUser(user),
      token
    });
  } catch (err) {
    console.error("[auth.controller] registerUser error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const user = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (!user) {
      await logActivity({
        action: "login",
        status: "fail",
        category: "Auth",
        riskLevel: "Moderate",
        ipAddress: req.ip,
        meta: { email, username, reason: "user_not_found" }
      });
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      await logActivity({
        userId: user._id,
        action: "login_blocked",
        status: "threat",
        category: "Auth",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true
      });
      return res.status(403).json({ message: "Account is blocked by admin" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logActivity({
        userId: user._id,
        action: "login",
        status: "fail",
        category: "Auth",
        riskLevel: "Moderate",
        ipAddress: req.ip,
        meta: { reason: "invalid_password" }
      });
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    user.lastUserAgent = req.headers["user-agent"] || "";
    await user.save();

    const token = createJwtToken(user);
    res.cookie("token", token, cookieOptions);

    await logActivity({
      userId: user._id,
      action: "login",
      status: "success",
      category: "Auth",
      riskLevel: "Low",
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: "User logged in successfully",
      user: sanitizeAuthUser(user),
      token
    });
  } catch (err) {
    console.error("[auth.controller] loginUser error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const getAuthMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("[auth.controller] getAuthMe error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const user = await User.findOne({
      $and: [
        { role: "admin" },
        { $or: [{ email }, { username }] }
      ]
    });

    if (!user) {
      await logActivity({
        action: "admin_login",
        status: "fail",
        category: "Auth",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true,
        meta: { email, username, reason: "admin_not_found" }
      });
      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logActivity({
        userId: user._id,
        action: "admin_login",
        status: "fail",
        category: "Auth",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true,
        meta: { reason: "invalid_password" }
      });
      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    user.lastLogin = new Date();
    user.lastUserAgent = req.headers["user-agent"] || "";
    await user.save();

    const token = createJwtToken(user);
    res.cookie("token", token, cookieOptions);

    await logActivity({
      userId: user._id,
      action: "admin_login",
      status: "success",
      category: "Auth",
      riskLevel: "Low",
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: "Admin logged in successfully",
      user: sanitizeAuthUser(user),
      token
    });
  } catch (err) {
    console.error("[auth.controller] loginAdmin error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, fullName, email, password, createdAt } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "Admin with the same email or username already exists" });
    }

    const hash = await hashPassword(password);
    const admin = await User.create({
      username,
      fullName: fullName || username,
      email,
      password: hash,
      createdAt,
      role: "admin",
      isVerified: true
    });

    const token = createJwtToken(admin);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "Admin registered successfully",
      user: sanitizeAuthUser(admin),
      token
    });
  } catch (err) {
    console.error("[auth.controller] registerAdmin error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const setupAdmin = async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin account already exists" });
    }

    const { username, fullName, email, password } = req.body;
    const hash = await hashPassword(password);
    const admin = await User.create({
      username,
      fullName: fullName || username,
      email,
      password: hash,
      role: "admin",
      isVerified: true
    });

    const token = createJwtToken(admin);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "Admin setup completed",
      user: sanitizeAuthUser(admin),
      token
    });
  } catch (err) {
    console.error("[auth.controller] setupAdmin error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    admin.password = await hashPassword(password);
    await admin.save();

    return res.status(200).json({ message: "Admin password reset successfully" });
  } catch (err) {
    console.error("[auth.controller] resetAdminPassword error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const forceAdmin = async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ message: "User ID or email is required" });
    }

    const user = await User.findOne({
      ...(userId ? { _id: userId } : {}),
      ...(email ? { email } : {})
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = "admin";
    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: "User promoted to admin successfully" });
  } catch (err) {
    console.error("[auth.controller] forceAdmin error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const current = req.user?.id ? await User.findById(req.user.id) : null;
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    if (current) {
      await logActivity({
        userId: current._id,
        action: "logout",
        status: "success",
        category: "Auth",
        riskLevel: "Low",
        ipAddress: req.ip
      });
    }

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("[auth.controller] logoutUser error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const loginWithGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Google token is required" });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google login is not configured on server" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ message: "Invalid Google identity payload" });
    }
    if (!payload.email_verified) {
      return res.status(403).json({ message: "Google email is not verified" });
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (user?.isBlocked) {
      await logActivity({
        userId: user._id,
        action: "google_login_blocked",
        status: "threat",
        category: "Auth",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true
      });
      return res.status(403).json({ message: "Account is blocked by admin" });
    }

    if (!user) {
      const usernameSeed = payload.name || payload.given_name || email.split("@")[0];
      const username = await buildUsername(usernameSeed);
      const generatedPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await hashPassword(generatedPassword);

      user = await User.create({
        username,
        fullName: payload.name || username,
        email,
        password: hashedPassword,
        role: "user",
        isVerified: true,
        profilePic: payload.picture || "",
        avatar: payload.picture || "",
        authProvider: "google",
        googleId: payload.sub
      });
    } else {
      if (payload.picture) {
        user.profilePic = payload.picture;
        user.avatar = payload.picture;
      }
      if (!user.googleId) user.googleId = payload.sub;
      if (!user.authProvider) user.authProvider = "google";
      user.isVerified = true;
    }

    user.lastLogin = new Date();
    user.lastUserAgent = req.headers["user-agent"] || "";
    await user.save();

    const token = createJwtToken(user);
    res.cookie("token", token, cookieOptions);

    await logActivity({
      userId: user._id,
      action: "google_login",
      status: "success",
      category: "Auth",
      riskLevel: "Low",
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: "Google login successful",
      user: sanitizeAuthUser(user),
      token
    });
  } catch (err) {
    console.error("[auth.controller] loginWithGoogle error:", err);
    return res.status(500).json({ message: err.message || "Google authentication failed" });
  }
};
