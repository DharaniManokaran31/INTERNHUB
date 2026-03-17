const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { studentOnly, recruiterOnly, hrOnly } = require("../middleware/roleMiddleware");  // ✅ ADD role middleware
const {
  applyToInternship,
  getMyApplications,
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
router.post("/", authMiddleware, studentOnly, applyToInternship);

// Get MY applications
router.get("/me", authMiddleware, getMyApplications);

// ===== RECRUITER ROUTES =====
// Get recruiter's application stats
router.get("/recruiter/stats", authMiddleware, recruiterOnly, getRecruiterApplicationStats);

// Get recent applications for recruiter
router.get("/recruiter/recent", authMiddleware, recruiterOnly, getRecruiterRecentApplications);

// Get all applications for a specific internship
router.get("/internship/:internshipId", authMiddleware, getInternshipApplications);  // Role check inside controller

// Update application status
router.patch("/:applicationId/status", authMiddleware, updateApplicationStatus);  // Role check inside

// Get application by ID
router.get("/:applicationId", authMiddleware, getApplicationById);  // Role check inside

// Add note to application
router.post("/:applicationId/notes", authMiddleware, addApplicationNote);  // Role check inside

// Get funnel stats for an internship
router.get("/internship/:internshipId/funnel", authMiddleware, getInternshipFunnelStats);  // Role check inside

// Recommend for certificate
router.post("/:applicationId/recommend-certificate", authMiddleware, recommendCertificate);  // Role check inside

// ===== HR ROUTES =====
// HR can view all applications across company
router.get("/hr/all", authMiddleware, hrOnly, getInternshipApplications);  // ✅ NEW - HR view all

module.exports = router;