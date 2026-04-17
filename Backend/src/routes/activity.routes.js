import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getActivities, createActivity } from "../controllers/activity.controller.js";

const router = express.Router();

router.get("/", protect, getActivities);
router.post("/", protect, createActivity);

export default router;
