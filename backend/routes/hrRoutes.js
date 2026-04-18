const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { hrOnly, recruiterOrHrOnly } = require('../middleware/roleMiddleware');  // ✅ ADD role middleware
const hrController = require('../controllers/hrController');
const { inviteLimiter } = require('../middleware/rateLimiter');

// All HR routes require auth at first
router.use(authMiddleware);

// --- STUDENT MANAGEMENT (Accessed by both HR and Recruiter) ---
router.get('/students/:studentId', recruiterOrHrOnly, hrController.getStudentById);
router.get('/students/:studentId/applications', recruiterOrHrOnly, hrController.getStudentApplications);

// All other HR routes require HR role
router.use(hrOnly);

// --- RECRUITER INVITATION MANAGEMENT (NEW FLOW) ---
router.get('/recruiters/available', hrController.getAvailableRecruiters);      // ✅ NEW - get pre-loaded recruiters
router.post('/recruiters/:recruiterId/invite', inviteLimiter, hrController.inviteRecruiter);  // ✅ NEW - invite specific recruiter
router.get('/recruiters/invitations/pending', hrController.getPendingInvitations);  // ✅ NEW
router.post('/recruiters/:recruiterId/resend', hrController.resendInvitation);      // ✅ UPDATED
router.delete('/recruiters/:recruiterId/revoke', hrController.revokeInvitation);    // ✅ UPDATED

// --- RECRUITER MANAGEMENT ---
router.get('/recruiters', hrController.getAllRecruiters);
router.get('/recruiters/:id', hrController.getRecruiterById);
router.put('/recruiters/:id', hrController.updateRecruiter);
router.patch('/recruiters/:id/activate', hrController.activateRecruiter);
router.patch('/recruiters/:id/deactivate', hrController.deactivateRecruiter);

// --- DASHBOARD & STATS ---
router.get('/dashboard', hrController.getDashboardStats);
router.get('/activity/recent', hrController.getRecentActivity);
router.get('/departments/distribution', hrController.getDepartmentDistribution);

// --- INTERNSHIP VIEWS ---
router.get('/internships', hrController.getAllInternships);
router.get('/internships/:internshipId', hrController.getInternshipById);
router.get('/internships/:internshipId/applications', hrController.getInternshipApplications);
router.patch('/internships/:internshipId/status', hrController.updateInternshipStatus);

// --- APPLICATION VIEWS ---
router.get('/applications', hrController.getAllApplications);
router.get('/applications/:applicationId', hrController.getApplicationById);
router.patch('/applications/:applicationId/status', hrController.updateApplicationStatus);

// --- STUDENT LIST ---
router.get('/students', hrController.getAllStudents);

// --- INTERN TRACKING ---
router.get('/active-interns', hrController.getActiveInterns);
router.get('/active-interns/stats', hrController.getActiveInternsStats);
router.get('/active-interns/:studentId/progress', hrController.getInternProgress);
router.post('/active-interns/:internId/complete', hrController.markInternComplete);
router.get('/completed-interns', hrController.getCompletedInterns);

// --- CERTIFICATES ---
router.get('/certificates/stats', hrController.getCertificateStats);
router.get('/certificates/eligible', hrController.getEligibleStudents);
router.post('/certificates/issue', hrController.issueCertificate);
router.patch('/certificates/:id/revoke', hrController.revokeCertificate);

// --- REPORTS ---
router.get('/reports/overview', hrController.getReportsStats);
router.get('/reports/trends', hrController.getReportsTrends);
router.get('/reports/conversion', hrController.getReportsConversion);

// Public certificate verification (no auth)
router.get('/certificates/verify/:id', hrController.verifyCertificate);

module.exports = router;