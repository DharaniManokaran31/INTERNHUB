const express = require('express');
const router = express.Router();

const progressController = require('../controllers/progressController');

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

// Get intern progress
router.get('/intern/:id', protect, progressController.getInternProgress);
router.get('/weekly/:id', protect, progressController.getWeeklyBreakdown);

// Mentor stats
router.get('/mentor/stats', protect, authorizeRole('recruiter', 'hr'), progressController.getMentorStats);

module.exports = router;
