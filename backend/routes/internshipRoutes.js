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
router.get("/", getAllInternships);

// ✅ IMPORTANT: This MUST come BEFORE the /:id route
router.get("/recruiter", authMiddleware, getRecruiterInternships);

// ===== PUBLIC ROUTE WITH PARAM =====
router.get("/:id", getInternshipById);  // This catches ANY /:id, including "recruiter"!

// ===== PROTECTED ROUTES =====
router.post("/", authMiddleware, createInternship);
router.put("/:id", authMiddleware, updateInternship);
router.delete("/:id", authMiddleware, deleteInternship);
router.patch("/:id/close", authMiddleware, closeInternship);

module.exports = router;