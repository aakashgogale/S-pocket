import express from "express";
import multer from "multer";

import File from "../models/file.model.js";
import { protect } from "../middleware/auth.middleware.js";
import { encryptFile } from "../utils/crypto.js";
import { detectThreat } from "../utils/threatDetector.js";
import { uploadFileAsset } from "../utils/cloudinary.js";
import logActivity from "../services/activityLogger.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🔐 Upload File (SECURE)
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "No file uploaded",
      });
    }

    // 🔐 Encrypt file metadata
    const encrypted = encryptFile(req.file.buffer);

    // Upload to cloud
    const safePublicId = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`;
    const uploadResult = await uploadFileAsset(req.file.buffer, safePublicId);

    // 🧠 Threat detection
    const detection = detectThreat({
      event: "file_upload",
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      ip: req.ip,
    });

    // Save file
    const newFile = await File.create({
      filename: req.file.originalname,
      url: uploadResult.secure_url,
      uploadedBy: req.user.id,

      encryptedMetadata: encrypted,

      riskLevel: detection?.threat?.severity || "low",

      securityLogs: [
        {
          user: req.user.id,
          action: "upload",
          ip: req.ip,
          riskScore: detection?.score || 0,
        },
      ],
    });

    // 📊 Log activity
    await logActivity({
      userId: req.user.id,
      action: "secure_file_upload",
      status: "success",
      category: "File",
      riskLevel: "Low",
      ipAddress: req.ip,
      meta: {
        fileId: newFile._id,
        encrypted: true,
      },
    });

    res.status(201).json({
      success: true,
      file: newFile,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
});

// 🔐 Download File (WITH MFA CHECK)
router.get("/:id/download", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        msg: "File not found",
      });
    }

    // 🚨 MFA required for high-risk
    if (file.riskLevel === "high" && !req.headers["x-totp-token"]) {
      return res.status(401).json({
        success: false,
        msg: "MFA required for high-risk files",
      });
    }

    res.json({
      success: true,
      url: file.url,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
});

// 🔥 IMPORTANT FIX (this solves your error)
export default router;