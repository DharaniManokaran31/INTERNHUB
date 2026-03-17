const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { recruiterOnly, hrOnly } = require("../middleware/roleMiddleware");  // ✅ ADD role middleware
const {
  createInternship,
  getAllInternships,
  getInternshipById,
  getRecruiterInternships,
  updateInternship,
  deleteInternship,
  closeInternship,
  getDepartmentStats          // ✅ NEW
} = require("../controllers/internshipController");

// ===== PUBLIC ROUTES =====
router.get("/", getAllInternships);
router.get("/departments/stats", getDepartmentStats);  // ✅ NEW - public department stats
router.get("/:id", getInternshipById);

// ===== PROTECTED ROUTES =====
router.use(authMiddleware);

// Recruiter's own internships
router.get("/recruiter/mine", recruiterOnly, getRecruiterInternships);  // ✅ renamed for clarity

// Create internship (recruiters only)
router.post("/", recruiterOnly, createInternship);

// Update/Delete/Close (recruiters only)
router.put("/:id", recruiterOnly, updateInternship);
router.delete("/:id", recruiterOnly, deleteInternship);
router.patch("/:id/close", recruiterOnly, closeInternship);

// HR can view all internships
router.get("/hr/all", hrOnly, getAllInternships);  // ✅ NEW - HR view all

module.exports = router;