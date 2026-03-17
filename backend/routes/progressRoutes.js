const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { studentOnly, recruiterOnly, hrOnly } = require('../middleware/roleMiddleware');  // ✅ ADD role middleware
const progressController = require('../controllers/progressController');

// All routes require auth
router.use(authMiddleware);

// ===== STUDENT ROUTES =====
// Get student's own progress
router.get('/student', studentOnly, progressController.getStudentProgress);  // ✅ NEW

// Get internship milestones
router.get('/milestones/:internshipId', studentOnly, progressController.getMilestones);  // ✅ NEW

// Update milestone status
router.put('/milestones/:internshipId/:milestoneId', studentOnly, progressController.updateMilestone);  // ✅ NEW

// ===== MENTOR/RECRUITER ROUTES =====
// Get progress for specific intern
router.get('/intern/:studentId', recruiterOnly, progressController.getStudentProgress);

// Get mentor dashboard stats
router.get('/mentor/dashboard', recruiterOnly, progressController.getMentorDashboard);  // ✅ NEW

// Get weekly breakdown for intern
router.get('/intern/:studentId/weekly', recruiterOnly, progressController.getWeeklyBreakdown);

// ===== HR ROUTES =====
// Get overall progress overview
router.get('/hr/overview', hrOnly, progressController.getHRProgressOverview);  // ✅ NEW

module.exports = router;