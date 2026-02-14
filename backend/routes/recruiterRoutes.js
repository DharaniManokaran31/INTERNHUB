const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  registerRecruiter,
  loginRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
  changePassword,
  forgotPassword,
  resetPassword    
} = require("../controllers/recruiterController");

// Register route
router.post("/register", registerRecruiter);

// Login route
router.post("/login", loginRecruiter);

// Forgot password route (public)
router.post("/forgot-password", forgotPassword);

// Reset password route (public)
router.post("/reset-password/:token", resetPassword);

// Profile route (protected)
router.get("/profile", authMiddleware, getRecruiterProfile);

// Update profile (protected)
router.put("/profile", authMiddleware, updateRecruiterProfile);

// Change password (protected)
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;