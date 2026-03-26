import User from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "./token.service.js";

/**
 * Register a new user
 */
export const registerUserService = async (username, fullName, email, password) => {
  try {
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      throw new Error("Email already exists");
    }

    const existingByUsername = await User.findOne({ username });
    if (existingByUsername) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      username,
      fullName: fullName || username,
      email,
      password: hashedPassword,
      isVerified: false
    });

    const token = generateToken(user);

    return {
      user,
      token
    };
  } catch (err) {
    console.error("[auth.service] registerUserService error:", err);
    throw err;
  }
};

/**
 * Login user
 */
export const loginUserService = async (email, password, meta = {}) => {
  try {
    const user = await User.findOne({ email });
    console.log("[auth.service] User found:", user ? user.email : null);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (user.isBlocked) {
      const err = new Error("Your account is blocked. Contact admin.");
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await comparePassword(password, user.password);
    console.log("[auth.service] Password Match:", isMatch);
    if (!isMatch) {
      console.log("[auth.service] Password Mismatch");
      throw new Error("Invalid credentials");
    }

    // Email verification bypassed
    user.lastLogin = new Date();
    if (meta.userAgent) {
      user.lastUserAgent = meta.userAgent;
    }
    await user.save();

    const token = generateToken(user);

    return {
      user,
      token
    };
  } catch (err) {
    console.error("[auth.service] loginUserService error:", err);
    throw err;
  }
};
