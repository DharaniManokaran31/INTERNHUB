const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly, hrOnly } = require('../middleware/roleMiddleware');  // ✅ ADD role middleware
const companyController = require('../controllers/companyController');

// ===== PUBLIC ROUTES =====
// Get public company profile (no auth needed)
router.get('/profile', companyController.getCompanyProfile);

// ===== PROTECTED ROUTES =====
router.use(authMiddleware);

// Get full company details (HR/Admin only)
router.get('/details', hrOnly, companyController.getCompanyDetails);  // ✅ NEW

// Update company details (Admin only)
router.put('/update', adminOnly, companyController.updateCompany);  // ✅ UPDATED

// Department management (HR/Admin only)
router.get('/departments', hrOnly, companyController.getDepartments);  // ✅ NEW
router.post('/departments', adminOnly, companyController.addDepartment);  // ✅ NEW
router.put('/departments/:departmentName', adminOnly, companyController.updateDepartment);  // ✅ NEW

// Document management (Admin only)
router.post('/documents/upload', adminOnly, companyController.uploadDocument);  // ✅ NEW
router.patch('/documents/:documentId/verify', adminOnly, companyController.verifyDocument);  // ✅ NEW

// Company stats (HR/Admin only)
router.get('/stats', hrOnly, companyController.getCompanyStats);  // ✅ NEW
router.get('/growth', hrOnly, companyController.getGrowthData);  // ✅ NEW

// ===== LEGACY/REMOVED ROUTES =====
// The following routes are now handled in hrController:
// - /recruiters (moved to hrRoutes)
// - /invite (moved to hrRoutes)
// - /accept-invitation (moved to recruiterRoutes)

module.exports = router;