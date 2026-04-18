import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import User from "../models/user.model.js";

const JWT_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.get?.("Authorization");
    const authHeaderToken = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : undefined;

    const cookieToken = req.cookies?.token;
    const fallbackToken = req.headers["x-access-token"];
    const token = authHeaderToken || cookieToken || fallbackToken;

    if (!token) {
      return res.status(401).json({ success: false, msg: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 IMPORTANT: fetch real user from DB
    const user = await User.findById(decoded.id).select("+mfaSecret");

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    req.user = user; // now full mongoose document

    // 🔐 MFA Logic
    const sensitivePaths = ['/files/', '/share/', '/admin/'];
    const needsMFA =
      sensitivePaths.some(path => req.path.startsWith(path)) &&
      user.role !== "superadmin";

    if (needsMFA && user.mfaSecret && !req.headers["x-totp-token"]) {
      return res.status(401).json({ success: false, msg: "MFA required for this action" });
    }

    if (needsMFA && user.mfaSecret) {
      const totpValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: req.headers["x-totp-token"],
        window: 1
      });

      if (!totpValid) {
        return res.status(401).json({ success: false, msg: "Invalid MFA token" });
      }
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ success: false, msg: "Invalid/expired token" });
  }
};

// 🔐 MFA Setup
export const setupMFA = async (req, res) => {
  try {
    const user = req.user; // now real DB object

    const secret = speakeasy.generateSecret({
      name: `SecurePlatform (${user.email})`,
      issuer: "SecureDataPlatform",
      length: 20
    });

    user.mfaSecret = secret.base32;
    await user.save(); // ✅ now works

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: secret.otpauth_url
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};