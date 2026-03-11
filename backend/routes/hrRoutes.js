const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const hrController = require('../controllers/hrController');

// HR role middleware
const requireHR = (req, res, next) => {
    if (req.user.role !== 'hr') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. HR role required.'
        });
    }
    next();
};

// All HR routes require auth and HR role
router.use(authMiddleware);
router.use(requireHR);

const { inviteLimiter } = require('../middleware/rateLimiter');

// --- DASHBOARD & OVERVIEW ---
router.get('/dashboard', hrController.getCompanyOverview);
router.get('/activity/recent', hrController.getRecentActivity);

// --- RECRUITER MANAGEMENT ---
router.post('/recruiters/invite', inviteLimiter, hrController.inviteRecruiter);
router.get('/recruiters', hrController.getAllRecruiters);
router.get('/recruiters/:id', hrController.getRecruiterById);
router.put('/recruiters/:id', hrController.updateRecruiter);
router.patch('/recruiters/:id/activate', hrController.activateRecruiter);
router.patch('/recruiters/:id/deactivate', hrController.deactivateRecruiter);
router.delete('/recruiters/:id/revoke', hrController.revokeInvitation);

// --- INTERNSHIP & APPLICATION VIEWS ---
router.get('/internships', hrController.getAllInternships);
router.get('/internships/:internshipId', hrController.getInternshipById);
router.get('/internships/:internshipId/applications', hrController.getInternshipApplications);
router.patch('/internships/:internshipId/status', hrController.updateInternshipStatus);

router.get('/applications', hrController.getAllApplications);
router.get('/applications/:applicationId', hrController.getApplicationById);
router.patch('/applications/:applicationId/status', hrController.updateApplicationStatus);
router.post('/applications/:applicationId/schedule-interview', hrController.scheduleInterview);

// --- STUDENT MANAGEMENT ---
router.get('/students', hrController.getAllStudents);
router.get('/students/:studentId', hrController.getStudentById);

// --- CERTIFICATES ---
router.get('/certificates/stats', hrController.getCertificateStats);
router.get('/certificates/eligible', hrController.getEligibleStudents);
router.post('/certificates/issue', hrController.issueCertificate);
router.patch('/certificates/:id/revoke', hrController.revokeCertificate);
router.get('/certificates/verify/:id', hrController.verifyCertificate); // PUBLIC but registered here

// --- INTERN TRACKING ---
router.get('/active-interns', hrController.getActiveInterns);
router.get('/active-interns/stats', hrController.getActiveInternsStats);
router.get('/active-interns/:internRecordId/progress', hrController.getInternProgress);
router.patch('/active-interns/:internRecordId/complete', hrController.markInternComplete);

router.get('/completed-interns', hrController.getCompletedInterns);

// --- REPORTS & TRENDS ---
router.get('/reports/overview', hrController.getReportsStats);
router.get('/reports/departments', hrController.getDepartmentDistribution);
router.get('/reports/trends', hrController.getReportsTrends);
router.get('/reports/conversion', hrController.getReportsConversion);

module.exports = router;