import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { verifyAdmin } from "../middleware/admin.middleware.js";
import { listUsers, setBlockUser, deleteUser, updateAdminProfile } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/users", protect, verifyAdmin, listUsers);
router.patch("/users/:id/block", protect, verifyAdmin, setBlockUser);
router.delete("/users/:id", protect, verifyAdmin, deleteUser);
router.put("/me", protect, verifyAdmin, updateAdminProfile);

export default router;
