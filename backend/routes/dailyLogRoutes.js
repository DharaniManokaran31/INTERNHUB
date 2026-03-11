const express = require('express');
const router = express.Router();

const {
    submitDailyLog,
    getMyLogs,
    getPendingLogs,
    getInternLogs,
    approveLog,
    rejectLog,
    addFeedback,
    getStats
} = require('../controllers/dailyLogController');

// Using your authentication middleware
const protect = require('../middleware/authMiddleware');

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`
            });
        }
        next();
    };
};

// Student Routes
router.post('/', protect, authorizeRole('student'), submitDailyLog);
router.get('/my-logs', protect, authorizeRole('student'), getMyLogs);

// Mentor/Recruiter Routes
router.get('/pending', protect, authorizeRole('recruiter', 'hr'), getPendingLogs);
router.get('/intern/:id', protect, authorizeRole('recruiter', 'hr'), getInternLogs);
router.put('/:id/approve', protect, authorizeRole('recruiter', 'hr'), approveLog);
router.put('/:id/reject', protect, authorizeRole('recruiter', 'hr'), rejectLog);
router.put('/:id/feedback', protect, authorizeRole('recruiter', 'hr'), addFeedback);

// Shared Route (internally checks role)
router.get('/stats', protect, getStats);

module.exports = router;
