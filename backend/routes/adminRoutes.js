const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// ===== PUBLIC ROUTES =====
router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);
router.post("/forgot-password", adminController.forgotPassword);
router.post("/reset-password/:token", adminController.resetPassword);

// ===== PROTECTED ROUTES (require authentication) =====
router.use(authMiddleware);

// Profile routes
router.get("/profile", adminController.getAdminProfile);
router.put("/profile", adminController.updateAdminProfile);
router.put("/change-password", adminController.changePassword);

// Dashboard stats
router.get("/dashboard/stats", adminController.getDashboardStats);

// User management
router.get("/students", adminController.getAllStudents);
router.get("/recruiters", adminController.getAllRecruiters);
router.delete("/user/:userType/:userId", adminController.deleteUser);

// Internship management
router.get("/internships", adminController.getAllInternshipsAdmin);
router.delete("/internships/:id", adminController.deleteInternshipAdmin);

// Reports routes
router.get("/reports/timeline", adminController.getTimelineData);
router.get("/reports/trends", adminController.getTrendsData);

module.exports = router;