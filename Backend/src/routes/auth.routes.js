import express from "express";
import { registerUser, loginUser, getAuthMe, loginAdmin, registerAdmin, setupAdmin, resetAdminPassword, forceAdmin } from "../controllers/auth.controller.js";
import { body } from "express-validator";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("username").optional().notEmpty().withMessage("Username is required"),
    body("fullName").optional().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
  ],
  registerUser
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  loginUser
);

router.post(
  "/admin/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  loginAdmin
);

router.post(
  "/admin/register",
  [
    body("username").optional().notEmpty().withMessage("Username is required"),
    body("fullName").optional().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
  ],
  registerAdmin
);

router.post("/setup-admin", setupAdmin);
router.post("/reset-admin-password", resetAdminPassword);
router.post("/force-admin", forceAdmin);

router.get("/me", protect, getAuthMe);

export default router;
