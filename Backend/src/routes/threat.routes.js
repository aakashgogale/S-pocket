import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createThreatController, getThreatsController } from "../controllers/threat.controller.js";

const router = express.Router();

router.post("/", protect, createThreatController);
router.get("/", protect, getThreatsController);

export default router;