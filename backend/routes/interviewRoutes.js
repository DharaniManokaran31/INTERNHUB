const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { recruiterOnly, studentOnly, hrOnly } = require('../middleware/roleMiddleware');  // ✅ ADD role middleware
const {
  createInterview,
  getInterviewById,
  getInterviewByApplication,
  getRecruiterInterviews,
  getStudentInterviews,
  scheduleRound,
  submitRoundResult,
  submitAssignment,
  rescheduleRound,
  getInterviewStats,
  respondToInterview,
  cancelRound            // ✅ NEW
} = require('../controllers/interviewController');

// All routes require auth
router.use(authMiddleware);

// ===== RECRUITER ROUTES =====
// Start interview process for shortlisted candidate
router.post('/application/:applicationId', recruiterOnly, createInterview);

// Get all interviews for recruiter
router.get('/recruiter', recruiterOnly, getRecruiterInterviews);

// Get interview statistics for recruiter
router.get('/recruiter/stats', recruiterOnly, getInterviewStats);

// Schedule a specific round
router.put('/:interviewId/schedule', recruiterOnly, scheduleRound);

// Submit result and feedback for a round
router.put('/:interviewId/result', recruiterOnly, submitRoundResult);

// Cancel a round
router.put('/:interviewId/cancel', recruiterOnly, cancelRound);  // ✅ NEW

// ===== STUDENT ROUTES =====
// Get all interviews for logged in student
router.get('/student', studentOnly, getStudentInterviews);

// Submit assignment for a round
router.post('/:interviewId/submit', studentOnly, submitAssignment);

// Respond to interview invite (accept/decline)
router.put('/:interviewId/respond', studentOnly, respondToInterview);

// ===== COMMON ROUTES =====
// Get interview by ID (role check in controller)
router.get('/:interviewId', getInterviewById);

// Get interview by application ID
router.get('/application/:applicationId', getInterviewByApplication);

// Reschedule a round (role check in controller)
router.put('/:interviewId/reschedule', rescheduleRound);

// ===== HR ROUTES =====
// HR can view all interviews
router.get('/hr/all', hrOnly, getRecruiterInterviews);  // ✅ NEW

module.exports = router;