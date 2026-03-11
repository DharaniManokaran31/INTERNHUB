const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  applyToInternship,
  getStudentApplications,
  getMyApplications,
  // NEW RECRUITER FUNCTIONS
  getRecruiterApplicationStats,
  getRecruiterRecentApplications,
  getInternshipApplications,
  updateApplicationStatus,
  getApplicationById,
  addApplicationNote,
  getInternshipFunnelStats,
  recommendCertificate
} = require("../controllers/applicationController");

// ===== STUDENT ROUTES =====
// Apply to internship
router.post("/", applyToInternship);

// Get MY applications (protected - from token)
router.get("/me", authMiddleware, getMyApplications);

// Get applications by student ID (params) - keep for backward compatibility
router.get("/:studentId", getStudentApplications);

// ===== RECRUITER ROUTES =====
// Get recruiter's application stats (for dashboard)
router.get("/recruiter/stats", authMiddleware, getRecruiterApplicationStats);

// Get recent applications for recruiter (for dashboard)
router.get("/recruiter/recent", authMiddleware, getRecruiterRecentApplications);

// Get all applications for a specific internship (with auth check)
router.get("/internship/:internshipId", authMiddleware, getInternshipApplications);

// Update application status (shortlist/reject/accept)
router.patch("/:applicationId/status", authMiddleware, updateApplicationStatus);

// Get application by ID (with full details)
router.get("/:applicationId/detail", authMiddleware, getApplicationById);

// Add note to application
router.post("/:applicationId/notes", authMiddleware, addApplicationNote);

// Get funnel stats for an internship
router.get("/internship/:internshipId/funnel", authMiddleware, getInternshipFunnelStats);

// Recommend for certificate
router.post("/:applicationId/recommend-certificate", authMiddleware, recommendCertificate);

module.exports = router;