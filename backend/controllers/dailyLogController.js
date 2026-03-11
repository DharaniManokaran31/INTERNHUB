const Notification = require('../models/Notification');
const DailyLog = require('../models/DailyLog');
const Internship = require('../models/Internship');
const Student = require('../models/Student');
const Recruiter = require('../models/Recruiter');

// @desc    Submit new daily log
// @route   POST /api/daily-logs
// @access  Private (Student)
exports.submitDailyLog = async (req, res) => {
    try {
        const {
            internshipId, mentorId, date, tasksCompleted,
            totalHours, learnings, challenges, tomorrowPlan
        } = req.body;

        const studentId = req.user.id || req.user._id;

        // Validate student is accepted in this internship
        const internship = await Internship.findById(internshipId);
        if (!internship) {
            return res.status(404).json({ message: 'Internship not found' });
        }

        // Check if a log already exists for this date
        // Normalize date to start of day
        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(logDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const existingLog = await DailyLog.findOne({
            studentId,
            internshipId,
            date: { $gte: logDate, $lt: nextDay }
        });

        if (existingLog) {
            return res.status(400).json({ message: 'A log has already been submitted for this date' });
        }

        // Determine day number
        const completedDays = await DailyLog.countDocuments({ studentId, internshipId, status: 'approved' });
        const dayNumber = completedDays + 1;

        // Create the log
        const newLog = await DailyLog.create({
            studentId,
            internshipId,
            mentorId,
            date: logDate,
            dayNumber,
            tasksCompleted,
            totalHours,
            learnings,
            challenges,
            tomorrowPlan,
            status: 'pending'
        });

        // Notify mentor
        if (mentorId) {
            const student = await Student.findById(studentId);
            await Notification.create({
                recipient: mentorId,
                recipientModel: 'Recruiter',
                title: 'New Daily Log Submitted',
                message: `${student.fullName} has submitted their daily log for Day ${dayNumber}.`,
                type: 'log_submission',
                relatedId: newLog._id,
                relatedModel: 'DailyLog',
                link: '/recruiter/review-logs'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Daily log submitted successfully',
            log: newLog
        });

    } catch (error) {
        console.error('Error submitting daily log:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get student's logs
// @route   GET /api/daily-logs/my-logs
// @access  Private (Student)
exports.getMyLogs = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const { internshipId } = req.query; // Optional filter

        let filter = { studentId };
        if (internshipId) filter.internshipId = internshipId;

        const logs = await DailyLog.find(filter)
            .populate('internshipId', 'title companyName department mentorId')
            .populate('mentorId', 'fullName email')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        console.error('Error fetching student logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get pending logs for mentor
// @route   GET /api/daily-logs/pending
// @access  Private (Recruiter/Mentor)
exports.getPendingLogs = async (req, res) => {
    try {
        const mentorId = req.user.id || req.user._id;

        const logs = await DailyLog.find({ mentorId, status: 'pending' })
            .populate('studentId', 'fullName email profilePicture')
            .populate('internshipId', 'title department')
            .sort({ date: 1 });

        res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        console.error('Error fetching pending logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get logs for specific intern
// @route   GET /api/daily-logs/intern/:id
// @access  Private (Recruiter/Mentor)
exports.getInternLogs = async (req, res) => {
    try {
        const mentorId = req.user.id || req.user._id;
        const studentId = req.params.id;

        // Security check: Verify mentor is assigned to this intern's internship
        const logs = await DailyLog.find({ mentorId, studentId })
            .populate('internshipId', 'title department')
            .sort({ date: -1 });

        // Also get progress stats
        const totalLogs = logs.length;
        const approvedLogs = logs.filter(log => log.status === 'approved').length;
        const pendingLogs = logs.filter(log => log.status === 'pending').length;

        // Calculate total hours
        const totalHours = logs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

        res.status(200).json({
            success: true,
            stats: {
                totalLogs,
                approvedLogs,
                pendingLogs,
                totalHours
            },
            logs
        });
    } catch (error) {
        console.error('Error fetching intern logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve log
// @route   PUT /api/daily-logs/:id/approve
// @access  Private (Recruiter/Mentor)
exports.approveLog = async (req, res) => {
    try {
        const { feedback, rating } = req.body;
        const logId = req.params.id;

        const log = await DailyLog.findById(logId);
        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        if (log.status === 'approved') {
            return res.status(400).json({ message: 'Log is already approved' });
        }

        log.status = 'approved';
        log.reviewedAt = Date.now();

        if (feedback || rating) {
            log.mentorFeedback = {
                comment: feedback || '',
                rating: rating || 5, // Default to 5 if approved without rating
                submittedAt: Date.now()
            };
        }

        await log.save();

        // Update internship progress (completedDays)
        await Internship.findByIdAndUpdate(
            log.internshipId,
            { $inc: { completedDays: 1 } }
        );

        // Notify student
        await Notification.create({
            recipient: log.studentId,
            recipientModel: 'Student',
            title: 'Daily Log Approved',
            message: `Your daily log for Day ${log.dayNumber} has been approved.`,
            type: 'log_approved',
            relatedId: log._id,
            relatedModel: 'DailyLog',
            link: '/student/my-logs'
        });

        res.status(200).json({
            success: true,
            message: 'Log approved successfully',
            log
        });
    } catch (error) {
        console.error('Error approving log:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reject log with reason
// @route   PUT /api/daily-logs/:id/reject
// @access  Private (Recruiter/Mentor)
exports.rejectLog = async (req, res) => {
    try {
        const { reason } = req.body;
        const logId = req.params.id;

        if (!reason) {
            return res.status(400).json({ message: 'Reason for rejection is required' });
        }

        const log = await DailyLog.findById(logId);
        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        log.status = 'rejected';
        log.reviewedAt = Date.now();
        log.mentorFeedback = {
            comment: reason,
            submittedAt: Date.now()
        };

        await log.save();

        // Notify student
        await Notification.create({
            recipient: log.studentId,
            recipientModel: 'Student',
            title: 'Daily Log Rejected',
            message: `Your daily log for Day ${log.dayNumber} requires revision. Reason: ${reason}`,
            type: 'log_rejected',
            relatedId: log._id,
            relatedModel: 'DailyLog',
            link: `/student/my-logs?id=${log._id}`
        });

        res.status(200).json({
            success: true,
            message: 'Log rejected',
            log
        });
    } catch (error) {
        console.error('Error rejecting log:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add feedback without changing status
// @route   PUT /api/daily-logs/:id/feedback
// @access  Private (Recruiter/Mentor)
exports.addFeedback = async (req, res) => {
    try {
        const { comment, rating, suggestions } = req.body;
        const logId = req.params.id;

        const log = await DailyLog.findById(logId);
        if (!log) {
            return res.status(404).json({ message: 'Log not found' });
        }

        log.mentorFeedback = {
            ...log.mentorFeedback,
            comment: comment || log.mentorFeedback?.comment,
            rating: rating || log.mentorFeedback?.rating,
            suggestions: suggestions || log.mentorFeedback?.suggestions,
            submittedAt: Date.now()
        };

        await log.save();

        // Notify student
        await Notification.create({
            recipient: log.studentId,
            recipientModel: 'Student',
            title: 'New Feedback on Daily Log',
            message: `Your mentor left feedback on your log for Day ${log.dayNumber}.`,
            type: 'log_feedback',
            relatedId: log._id,
            relatedModel: 'DailyLog',
            link: `/student/my-logs?id=${log._id}`
        });

        res.status(200).json({
            success: true,
            message: 'Feedback added successfully',
            log
        });
    } catch (error) {
        console.error('Error adding feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get progress stats (generic)
// @route   GET /api/daily-logs/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        // Determine context (student or mentor)
        const isMentor = req.user.role === 'recruiter' || req.user.role === 'hr';
        const query = {};

        if (isMentor) {
            query.mentorId = req.user.id || req.user._id;
        } else {
            query.studentId = req.user.id || req.user._id;
        }

        const totalLogs = await DailyLog.countDocuments(query);
        const approvedLogs = await DailyLog.countDocuments({ ...query, status: 'approved' });
        const pendingLogs = await DailyLog.countDocuments({ ...query, status: 'pending' });
        const rejectedLogs = await DailyLog.countDocuments({ ...query, status: 'rejected' });

        res.status(200).json({
            success: true,
            stats: {
                totalLogs,
                approvedLogs,
                pendingLogs,
                rejectedLogs
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
