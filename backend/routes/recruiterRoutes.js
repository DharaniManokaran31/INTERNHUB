const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    login,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    getMyMentees,
    getMyDepartmentStats
} = require("../controllers/recruiterController");

// ===== PUBLIC ROUTES (Both Recruiters & HR) =====
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ===== PROTECTED ROUTES (Both Recruiters & HR) =====
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

// ===== RECRUITER-SPECIFIC ROUTES =====
router.get("/mentees", authMiddleware, getMyMentees);
router.get("/department-stats", authMiddleware, getMyDepartmentStats);

module.exports = router;