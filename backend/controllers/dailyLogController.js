const DailyLog = require('../models/DailyLog');
const Internship = require('../models/Internship');
const Student = require('../models/Student');
const Recruiter = require('../models/Recruiter');
const Notification = require('../models/Notification');

// ============================================
// STUDENT FUNCTIONS
// ============================================

// Submit Daily Log
exports.submitDailyLog = async (req, res) => {
    try {
        const studentId = req.user.id;
        const {
            internshipId,
            date,
            tasksCompleted,
            totalHours,
            learnings,
            challenges,
            tomorrowPlan,
            mood
        } = req.body;

        // Validation
        if (!internshipId || !date || !tasksCompleted || !totalHours) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all required fields'
            });
        }

        // Check if student has active internship
        const internship = await Internship.findById(internshipId);
        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        // Check if student is accepted in this internship
        const isAccepted = await require('../models/Application').exists({
            studentId,
            internshipId,
            status: 'accepted'
        });

        if (!isAccepted && req.user.role !== 'hr') {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this internship'
            });
        }

        // Check for duplicate log on same date
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
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a log for this date'
            });
        }

        // Calculate day number
        const completedDays = await DailyLog.countDocuments({
            studentId,
            internshipId,
            status: 'approved'
        });
        const dayNumber = completedDays + 1;

        // Create log
        const newLog = new DailyLog({
            studentId,
            internshipId,
            mentorId: internship.mentorId,
            date: logDate,
            dayNumber,
            tasksCompleted: tasksCompleted.map(task => ({
                ...task,
                status: task.status || 'completed'
            })),
            totalHours,
            learnings: learnings || '',
            challenges: challenges || '',
            tomorrowPlan: tomorrowPlan || '',
            mood: mood || '🙂 Good',
            status: 'pending',
            submittedAt: new Date()
        });

        await newLog.save();

        // Notify mentor
        if (internship.mentorId) {
            const student = await Student.findById(studentId);
            await Notification.create({
                recipientId: internship.mentorId,
                recipientModel: 'Recruiter',
                type: 'new_progress_log',
                title: 'New Daily Log Submitted',
                message: `${student.fullName} submitted their daily log for Day ${dayNumber}`,
                data: {
                    logId: newLog._id,
                    studentId,
                    studentName: student.fullName,
                    internshipId,
                    internshipTitle: internship.title,
                    dayNumber
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Daily log submitted successfully',
            data: { log: newLog }
        });
    } catch (error) {
        console.error('Error submitting daily log:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get My Logs (Student)
exports.getMyLogs = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { internshipId } = req.query;

        let filter = { studentId };
        if (internshipId) filter.internshipId = internshipId;

        const logs = await DailyLog.find(filter)
            .populate('internshipId', 'title department')
            .populate('mentorId', 'fullName email')
            .sort({ date: -1 });

        // Calculate stats
        const stats = {
            total: logs.length,
            approved: logs.filter(l => l.status === 'approved').length,
            pending: logs.filter(l => l.status === 'pending').length,
            rejected: logs.filter(l => l.status === 'rejected').length,
            totalHours: logs.reduce((sum, l) => sum + (l.totalHours || 0), 0)
        };

        res.status(200).json({
            success: true,
            data: { logs, stats }
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Single Log by ID
exports.getLogById = async (req, res) => {
    try {
        const { logId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const log = await DailyLog.findById(logId)
            .populate('studentId', 'fullName email profilePicture')
            .populate('internshipId', 'title department')
            .populate('mentorId', 'fullName email');

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        // Check permission
        const isStudent = userRole === 'student' && log.studentId._id.toString() === userId;
        const isMentor = userRole === 'recruiter' && log.mentorId?._id.toString() === userId;
        const isHR = userRole === 'hr';

        if (!isStudent && !isMentor && !isHR) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this log'
            });
        }

        res.status(200).json({
            success: true,
            data: { log }
        });
    } catch (error) {
        console.error('Error fetching log:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Log (Student - only if pending)
exports.updateLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const studentId = req.user.id;

        const log = await DailyLog.findOne({
            _id: logId,
            studentId
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        if (log.status !== 'pending' && log.status !== 'needs-revision') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update log that has been reviewed'
            });
        }

        const {
            tasksCompleted,
            totalHours,
            learnings,
            challenges,
            tomorrowPlan,
            mood
        } = req.body;

        if (tasksCompleted) log.tasksCompleted = tasksCompleted;
        if (totalHours) log.totalHours = totalHours;
        if (learnings) log.learnings = learnings;
        if (challenges) log.challenges = challenges;
        if (tomorrowPlan) log.tomorrowPlan = tomorrowPlan;
        if (mood) log.mood = mood;

        log.status = 'pending'; // Reset to pending for review
        log.submittedAt = new Date();

        await log.save();

        res.status(200).json({
            success: true,
            message: 'Log updated successfully',
            data: { log }
        });
    } catch (error) {
        console.error('Error updating log:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// MENTOR FUNCTIONS
// ============================================

// Get Pending Logs for Review
exports.getPendingLogs = async (req, res) => {
    try {
        const mentorId = req.user.id;

        const logs = await DailyLog.find({
            mentorId,
            status: 'pending'
        })
            .populate('studentId', 'fullName email profilePicture')
            .populate('internshipId', 'title department')
            .sort({ date: 1 });

        res.status(200).json({
            success: true,
            data: { logs }
        });
    } catch (error) {
        console.error('Error fetching pending logs:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Logs for Specific Intern
exports.getInternLogs = async (req, res) => {
    try {
        const { studentId } = req.params;
        const mentorId = req.user.id;

        const logs = await DailyLog.find({
            studentId,
            mentorId
        })
            .populate('internshipId', 'title department')
            .sort({ date: -1 });

        // Calculate stats
        const stats = {
            total: logs.length,
            approved: logs.filter(l => l.status === 'approved').length,
            pending: logs.filter(l => l.status === 'pending').length,
            rejected: logs.filter(l => l.status === 'rejected').length,
            totalHours: logs.reduce((sum, l) => sum + (l.totalHours || 0), 0)
        };

        res.status(200).json({
            success: true,
            data: { logs, stats }
        });
    } catch (error) {
        console.error('Error fetching intern logs:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Approve Log
exports.approveLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const { feedback, rating } = req.body;
        const mentorId = req.user.id;

        const log = await DailyLog.findOne({
            _id: logId,
            mentorId
        }).populate('studentId', 'fullName email');

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        if (log.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Log is already approved'
            });
        }

        log.status = 'approved';
        log.reviewedAt = new Date();
        log.mentorFeedback = {
            comment: feedback || '',
            rating: rating || 5,
            submittedAt: new Date()
        };

        await log.save();

        // Update internship completed days
        await Internship.findByIdAndUpdate(
            log.internshipId,
            { $inc: { completedDays: 1 } }
        );

        // Notify student
        await Notification.create({
            recipientId: log.studentId._id,
            recipientModel: 'Student',
            type: 'log_feedback',
            title: 'Daily Log Approved',
            message: `Your log for Day ${log.dayNumber} has been approved`,
            data: {
                logId: log._id,
                dayNumber: log.dayNumber,
                feedback
            }
        });

        res.status(200).json({
            success: true,
            message: 'Log approved successfully',
            data: { log }
        });
    } catch (error) {
        console.error('Error approving log:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Reject Log with Feedback
exports.rejectLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const { reason } = req.body;
        const mentorId = req.user.id;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide reason for rejection'
            });
        }

        const log = await DailyLog.findOne({
            _id: logId,
            mentorId
        }).populate('studentId', 'fullName email');

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        log.status = 'rejected';
        log.reviewedAt = new Date();
        log.mentorFeedback = {
            comment: reason,
            submittedAt: new Date()
        };

        await log.save();

        // Notify student
        await Notification.create({
            recipientId: log.studentId._id,
            recipientModel: 'Student',
            type: 'log_feedback',
            title: 'Daily Log Needs Revision',
            message: `Your log for Day ${log.dayNumber} needs revision: ${reason}`,
            data: {
                logId: log._id,
                dayNumber: log.dayNumber,
                reason
            }
        });

        res.status(200).json({
            success: true,
            message: 'Log rejected',
            data: { log }
        });
    } catch (error) {
        console.error('Error rejecting log:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add Feedback Without Changing Status
exports.addFeedback = async (req, res) => {
    try {
        const { logId } = req.params;
        const { comment, rating, suggestions } = req.body;
        const mentorId = req.user.id;

        const log = await DailyLog.findOne({
            _id: logId,
            mentorId
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        log.mentorFeedback = {
            comment: comment || log.mentorFeedback?.comment,
            rating: rating || log.mentorFeedback?.rating,
            suggestions: suggestions || log.mentorFeedback?.suggestions,
            submittedAt: new Date()
        };

        await log.save();

        // Notify student
        await Notification.create({
            recipientId: log.studentId,
            recipientModel: 'Student',
            type: 'log_feedback',
            title: 'New Feedback on Your Log',
            message: `Your mentor left feedback on your Day ${log.dayNumber} log`,
            data: {
                logId: log._id,
                dayNumber: log.dayNumber
            }
        });

        res.status(200).json({
            success: true,
            message: 'Feedback added successfully',
            data: { log }
        });
    } catch (error) {
        console.error('Error adding feedback:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// STATS FUNCTIONS
// ============================================

// Get Stats for Student
exports.getStudentStats = async (req, res) => {
    try {
        const studentId = req.params.studentId || req.user.id;

        const logs = await DailyLog.find({ studentId });

        const totalLogs = logs.length;
        const approvedLogs = logs.filter(l => l.status === 'approved').length;
        const totalHours = logs.reduce((sum, l) => sum + (l.totalHours || 0), 0);

        // Streak calculation
        let currentStreak = 0;
        const sortedLogs = logs
            .filter(l => l.status === 'approved')
            .sort((a, b) => b.date - a.date);

        if (sortedLogs.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const lastLogDate = new Date(sortedLogs[0].date);
            lastLogDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.round((today - lastLogDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 1) {
                currentStreak = 1;
                for (let i = 1; i < sortedLogs.length; i++) {
                    const prevDate = new Date(sortedLogs[i-1].date);
                    const currDate = new Date(sortedLogs[i].date);
                    prevDate.setHours(0, 0, 0, 0);
                    currDate.setHours(0, 0, 0, 0);
                    
                    if ((prevDate - currDate) / (1000 * 60 * 60 * 24) === 1) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            data: {
                totalLogs,
                approvedLogs,
                pendingLogs: logs.filter(l => l.status === 'pending').length,
                rejectedLogs: logs.filter(l => l.status === 'rejected').length,
                totalHours,
                averageHours: totalLogs > 0 ? (totalHours / totalLogs).toFixed(1) : 0,
                currentStreak
            }
        });
    } catch (error) {
        console.error('Error getting student stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Mentor Stats
exports.getMentorStats = async (req, res) => {
    try {
        const mentorId = req.user.id;

        const logs = await DailyLog.find({ mentorId });

        const uniqueStudents = [...new Set(logs.map(l => l.studentId.toString()))];

        const stats = {
            totalMentees: uniqueStudents.length,
            totalLogs: logs.length,
            pendingReviews: logs.filter(l => l.status === 'pending').length,
            approvedToday: logs.filter(l => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return l.status === 'approved' &&
                    l.reviewedAt &&
                    l.reviewedAt >= today;
            }).length,
            averageRating: 0
        };

        const logsWithRating = logs.filter(l => l.mentorFeedback?.rating);
        if (logsWithRating.length > 0) {
            const totalRating = logsWithRating.reduce((sum, l) => sum + l.mentorFeedback.rating, 0);
            stats.averageRating = (totalRating / logsWithRating.length).toFixed(1);
        }

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting mentor stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};