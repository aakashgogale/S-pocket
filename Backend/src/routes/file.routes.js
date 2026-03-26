import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../utils/upload.js";
import File from "../models/file.model.js";
import { detectThreat } from "../utils/threatDetector.js";
import { createThreatService } from "../services/threat.service.js";
import { sendThreatAlert } from "../socket/socket.js";
import { logActivity } from "../services/activity.service.js";
import Activity from "../models/activity.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "..", "uploads");

router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const newFile = await File.create({
      name: req.file.filename,
      originalName: req.file.originalname,
      type: req.file.mimetype.split('/')[1].toUpperCase(),
      size: (req.file.size / 1024 / 1024).toFixed(2) + " MB",
      user: req.user.id
    });

    await logActivity({
      userId: req.user.id,
      action: "file_upload",
      status: "success",
      category: "File",
      riskLevel: "Low",
      ipAddress: req.ip,
      meta: { filename: req.file.originalname }
    });

    // Run threat detection on uploaded file
    const detection = detectThreat({
      event: "file_upload",
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      ip: req.ip
    });

    let threat = null;
    if (detection.flagged) {
      threat = await createThreatService(detection.threat, req.user.id);
      sendThreatAlert(req.user.id, threat);
    }

    res.status(201).json({
      success: true,
      file: newFile,
      threat
    });
  } catch (err) {
    console.error("[file.routes] upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (err) {
    console.error("[file.routes] list error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/rename", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ msg: "Name is required" });

    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: "File not found" });
    if (String(file.user) !== String(req.user.id)) {
      await logActivity({
        userId: req.user.id,
        action: "file_rename_unauthorized",
        status: "threat",
        category: "File",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true,
        meta: { fileId: file._id }
      });
      return res.status(403).json({ msg: "Not allowed" });
    }

    file.originalName = name;
    await file.save();

    await logActivity({
      userId: req.user.id,
      action: "file_rename",
      status: "success",
      category: "File",
      riskLevel: "Low",
      ipAddress: req.ip,
      meta: { fileId: file._id, name }
    });

    res.json({ success: true, file });
  } catch (err) {
    console.error("[file.routes] rename error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/download", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: "File not found" });
    if (String(file.user) !== String(req.user.id)) {
      await logActivity({
        userId: req.user.id,
        action: "file_download_unauthorized",
        status: "threat",
        category: "File",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true,
        meta: { fileId: file._id }
      });
      return res.status(403).json({ msg: "Not allowed" });
    }

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    file.downloadHistory = (file.downloadHistory || []).filter((h) => h.at.getTime() > dayAgo);
    const userDownloads = file.downloadHistory.filter((h) => String(h.user) === String(req.user.id));

    if (userDownloads.length >= 5) {
      await logActivity({
        userId: req.user.id,
        action: "file_download_limit_exceeded",
        status: "threat",
        category: "File",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true,
        meta: { fileId: file._id }
      });
      return res.status(429).json({ msg: "Limit Exceeded" });
    }

    file.downloadHistory.push({ user: req.user.id, at: new Date() });
    file.downloadCount = (file.downloadCount || 0) + 1;
    await file.save();

    await logActivity({
      userId: req.user.id,
      action: "file_download",
      status: "success",
      category: "File",
      riskLevel: "Low",
      ipAddress: req.ip,
      meta: { fileId: file._id }
    });

    const filePath = path.join(uploadDir, file.name);
    return res.download(filePath, file.originalName);
  } catch (err) {
    console.error("[file.routes] download error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: "File not found" });
    if (String(file.user) !== String(req.user.id)) {
      await logActivity({
        userId: req.user.id,
        action: "file_delete_unauthorized",
        status: "threat",
        category: "File",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true,
        meta: { fileId: file._id }
      });
      return res.status(403).json({ msg: "Not allowed" });
    }

    const filePath = path.join(uploadDir, file.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await file.deleteOne();
    await logActivity({
      userId: req.user.id,
      action: "file_delete",
      status: "success",
      category: "File",
      riskLevel: "Moderate",
      ipAddress: req.ip,
      meta: { fileId: file._id }
    });

    const since = new Date(Date.now() - 60 * 1000);
    const deleteCount = await Activity.countDocuments({
      user: req.user.id,
      action: "file_delete",
      createdAt: { $gte: since }
    });
    if (deleteCount > 10) {
      await logActivity({
        userId: req.user.id,
        action: "Excessive file deletion detected",
        status: "threat",
        category: "File",
        riskLevel: "Critical",
        ipAddress: req.ip,
        isThreat: true,
        meta: { deleteCount }
      });
    }
    res.json({ success: true, msg: "File deleted" });
  } catch (err) {
    console.error("[file.routes] delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
