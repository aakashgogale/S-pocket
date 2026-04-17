import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/auth.middleware.js";
import { getMe, updateProfile } from "../controllers/user.controller.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/me", protect, getMe);

router.patch(
  "/me",
  protect,
  upload.single("profilePic"),
  [
    body("username").optional().notEmpty().withMessage("Username cannot be empty"),
    body("fullName").optional().notEmpty().withMessage("Full name cannot be empty")
  ],
  updateProfile
);

router.put("/profile", protect, upload.single("profilePic"), updateProfile);

export default router;
