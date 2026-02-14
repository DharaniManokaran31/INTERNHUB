const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // ✅ ADD THIS
const {
  applyToInternship,
  getStudentApplications,
  getMyApplications, // ✅ ADD THIS
} = require("../controllers/applicationController");

// Apply to internship
router.post("/", applyToInternship);

// Get MY applications (protected - from token) - ✅ USE THIS FOR DASHBOARD
router.get("/me", authMiddleware, getMyApplications);

// Get applications by student ID (params) - keep for backward compatibility
router.get("/:studentId", getStudentApplications);

module.exports = router;