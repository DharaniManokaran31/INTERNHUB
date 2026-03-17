const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { studentOnly, recruiterOnly, hrOnly } = require('../middleware/roleMiddleware');  // ✅ ADD role middleware
const {
    submitDailyLog,
    getMyLogs,
    getLogById,              // ✅ NEW
    updateLog,                // ✅ NEW
    getPendingLogs,
    getInternLogs,
    approveLog,
    rejectLog,
    addFeedback,
    getStudentStats,          // ✅ NEW
    getMentorStats            // ✅ NEW
} = require('../controllers/dailyLogController');

// All routes require auth
router.use(authMiddleware);

// ===== STUDENT ROUTES =====
router.post('/', studentOnly, submitDailyLog);
router.get('/my-logs', studentOnly, getMyLogs);
router.get('/my-stats', studentOnly, getStudentStats);  // ✅ NEW
router.get('/:logId', getLogById);  // Role check inside controller
router.put('/:logId', studentOnly, updateLog);  // ✅ NEW

// ===== MENTOR/RECRUITER ROUTES =====
router.get('/pending', recruiterOnly, getPendingLogs);
router.get('/intern/:studentId', recruiterOnly, getInternLogs);
router.put('/:logId/approve', recruiterOnly, approveLog);
router.put('/:logId/reject', recruiterOnly, rejectLog);
router.put('/:logId/feedback', recruiterOnly, addFeedback);
router.get('/mentor/stats', recruiterOnly, getMentorStats);  // ✅ NEW

// ===== HR ROUTES =====
router.get('/hr/all', hrOnly, getInternLogs);  // ✅ NEW - HR view all logs

module.exports = router;