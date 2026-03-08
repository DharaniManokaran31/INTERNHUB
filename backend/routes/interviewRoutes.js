// backend/routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
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
  getInterviewStats
} = require('../controllers/interviewController');

// ===== PUBLIC ROUTES (None - all require auth) =====

// ===== PROTECTED ROUTES =====
router.use(authMiddleware);

// ===== RECRUITER ROUTES =====

// Start interview process for shortlisted candidate
router.post('/application/:applicationId', createInterview);

// Get all interviews for recruiter (with filters)
router.get('/recruiter', getRecruiterInterviews);

// Get interview statistics for recruiter
router.get('/recruiter/stats', getInterviewStats);

// Schedule a specific round
router.put('/:interviewId/schedule', scheduleRound);

// Submit result and feedback for a round
router.put('/:interviewId/result', submitRoundResult);

// ===== STUDENT ROUTES =====

// Get all interviews for logged in student
router.get('/student', getStudentInterviews);

// Submit assignment for a round
router.post('/:interviewId/submit', submitAssignment);

// ===== COMMON ROUTES (Both Recruiter & Student) =====

// Get interview by ID
router.get('/:interviewId', getInterviewById);

// Get interview by application ID
router.get('/application/:applicationId', getInterviewByApplication);

// Reschedule a round
router.put('/:interviewId/reschedule', rescheduleRound);

module.exports = router;