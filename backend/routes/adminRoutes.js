const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");  // ✅ ADD role middleware
const adminController = require("../controllers/adminController");

// ===== PUBLIC ROUTES =====
// REMOVED /register - admins are created via script only!
router.post("/login", adminController.loginAdmin);
router.post("/forgot-password", adminController.forgotPassword);
router.post("/reset-password/:token", adminController.resetPassword);

// ===== PROTECTED ROUTES =====
router.use(authMiddleware);
router.use(adminOnly);  // ✅ Ensure only admins can access these routes

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

// Company management
router.get("/company", adminController.getCompanyInfo);        // ✅ NEW
router.put("/company", adminController.updateCompanyInfo);     // ✅ NEW

// Reports routes
router.get("/reports/timeline", adminController.getTimelineData);
router.get("/reports/trends", adminController.getTrendsData);

module.exports = router;