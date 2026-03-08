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
  resetPassword,
  getMyMentees // ✅ ADD THIS
} = require("../controllers/recruiterController");

// Public routes
router.post("/register", registerRecruiter);
router.post("/login", loginRecruiter);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.get("/profile", authMiddleware, getRecruiterProfile);
router.put("/profile", authMiddleware, updateRecruiterProfile);
router.put("/change-password", authMiddleware, changePassword);
router.get("/mentees", authMiddleware, getMyMentees); // ✅ ADD THIS

module.exports = router;