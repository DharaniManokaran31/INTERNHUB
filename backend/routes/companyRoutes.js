const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const companyController = require('../controllers/companyController');

// Get company profile
router.get('/profile', authMiddleware, companyController.getCompanyProfile);

// Get all recruiters
router.get('/recruiters', authMiddleware, companyController.getAllRecruiters);

// Invite recruiter
router.post('/invite', authMiddleware, companyController.inviteRecruiter);

// Resend invitation
router.post('/recruiters/:recruiterId/resend', authMiddleware, companyController.resendInvitation);

// Accept invitation (public route - no auth needed)
router.post('/accept-invitation/:token', companyController.acceptInvitation);

module.exports = router;