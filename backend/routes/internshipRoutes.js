const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // ✅ ADD THIS
const {
  createInternship,
  getAllInternships,
  getInternshipById,
  updateInternship,    // ✅ NEW
  deleteInternship,    // ✅ NEW
  closeInternship,     // ✅ NEW
} = require("../controllers/internshipController");

// ===== PUBLIC ROUTES (No auth required for viewing) =====

// Route to get all internships (with filters)
router.get("/", getAllInternships);

// Route to get a single internship by ID
router.get("/:id", getInternshipById);


// ===== PROTECTED ROUTES (Require authentication) =====

// Route to create a new internship - Recruiters only
router.post("/", authMiddleware, createInternship);

// Route to update an internship - Recruiters only
router.put("/:id", authMiddleware, updateInternship);

// Route to delete an internship - Recruiters only
router.delete("/:id", authMiddleware, deleteInternship);

// Route to close an internship - Recruiters only
router.patch("/:id/close", authMiddleware, closeInternship);

module.exports = router;