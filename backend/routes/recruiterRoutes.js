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
    getMyDepartmentStats,
    acceptInvitation,          // ✅ ADDED for invite flow
    getStudentById             // ✅ ADDED for viewing student profiles
} = require("../controllers/recruiterController");

// ===== PUBLIC ROUTES =====
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/accept-invite/:token", acceptInvitation);  // ✅ NEW - for invite acceptance

// ===== PROTECTED ROUTES =====
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);

// ===== RECRUITER-SPECIFIC ROUTES =====
router.get("/mentees", authMiddleware, getMyMentees);
router.get("/department-stats", authMiddleware, getMyDepartmentStats);
router.get("/student/:studentId", authMiddleware, getStudentById);  // ✅ NEW - view student profile

module.exports = router;