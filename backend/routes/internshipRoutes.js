const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createInternship,
  getAllInternships,
  getInternshipById,
  getRecruiterInternships,
  updateInternship,
  deleteInternship,
  closeInternship,
} = require("../controllers/internshipController");

// ===== PUBLIC ROUTES =====
router.get("/", getAllInternships);  // GET all internships (public)

// ===== PROTECTED ROUTES (ALL specific routes FIRST) =====
router.get("/recruiter", authMiddleware, getRecruiterInternships);  // ✅ THIS MUST BE BEFORE /:id
router.post("/", authMiddleware, createInternship);

// ===== PARAMETERIZED ROUTES - MUST BE LAST =====
router.get("/:id", getInternshipById);  // GET single internship by ID
router.put("/:id", authMiddleware, updateInternship);
router.delete("/:id", authMiddleware, deleteInternship);
router.patch("/:id/close", authMiddleware, closeInternship);

module.exports = router;