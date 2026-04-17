import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { verifyAdmin } from "../middleware/admin.middleware.js";
import { listUsers, setBlockUser, deleteUser, updateAdminProfile, getAdminStats, getAdminHealth, getAdminLogs, verifyUser, getUserStats, listAllFiles, setUserRole } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/users", protect, verifyAdmin, listUsers);
router.patch("/users/:id/block", protect, verifyAdmin, setBlockUser);
router.patch("/users/:id/role", protect, verifyAdmin, setUserRole);
router.patch("/users/:id/verify", protect, verifyAdmin, verifyUser);
router.delete("/users/:id", protect, verifyAdmin, deleteUser);
router.put("/me", protect, verifyAdmin, updateAdminProfile);
router.get("/stats", protect, verifyAdmin, getAdminStats);
router.get("/user-stats", protect, verifyAdmin, getUserStats);
router.get("/health", protect, verifyAdmin, getAdminHealth);
router.get("/logs", protect, verifyAdmin, getAdminLogs);
router.get("/files", protect, verifyAdmin, listAllFiles);

export default router;
