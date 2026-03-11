const DailyLog = require('../models/DailyLog');
const Internship = require('../models/Internship');
const Student = require('../models/Student');

// @desc    Get intern progress
// @route   GET /api/progress/intern/:id
// @access  Private (Recruiter/Mentor or Student themself)
exports.getInternProgress = async (req, res) => {
    try {
        const studentId = req.params.id;

        const userId = req.user.id || req.user._id;

        // Check access rights: Must be the student themselves or a mentor
        if (req.user.role === 'student' && String(userId) !== String(studentId)) {
            return res.status(403).json({ message: 'Not authorized to view this progress' });
        }

        const logs = await DailyLog.find({ studentId }).sort({ date: 1 });
        const approvedLogs = logs.filter(log => log.status === 'approved');

        // Get the internship details
        // We assume the student has an active internship
        const internship = await Internship.findOne({ 'internDetails.status': 'active' });
        // Ideally we'd find the internship associated with these logs, let's get it from the latest log
        let currentInternshipId = null;
        if (logs.length > 0) {
            currentInternshipId = logs[logs.length - 1].internshipId;
        }

        let progressData = {
            totalDays: 60, // Default fallback
            completedDays: approvedLogs.length,
            pendingDays: logs.filter(log => log.status === 'pending').length,
            rejectedDays: logs.filter(log => log.status === 'rejected').length,
            totalHours: approvedLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0)
        };

        if (currentInternshipId) {
            const internshipData = await Internship.findById(currentInternshipId);
            if (internshipData) {
                progressData.totalDays = internshipData.totalDays || 60;
                progressData.percentage = Math.min(Math.round((progressData.completedDays / progressData.totalDays) * 100), 100);
            }
        }

        res.status(200).json({
            success: true,
            progress: progressData
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get mentor's overall stats
// @route   GET /api/progress/mentor/stats
// @access  Private (Recruiter/Mentor)
exports.getMentorStats = async (req, res) => {
    try {
        const mentorId = req.user.id || req.user._id;

        const allLogs = await DailyLog.find({ mentorId });
        const uniqueStudents = [...new Set(allLogs.map(log => log.studentId.toString()))];

        const stats = {
            totalMentees: uniqueStudents.length,
            pendingReviews: allLogs.filter(log => log.status === 'pending').length,
            approvedToday: allLogs.filter(log => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return log.status === 'approved' &&
                    log.reviewedAt &&
                    log.reviewedAt >= today;
            }).length,
            avgHoursPerDay: 0
        };

        if (allLogs.length > 0) {
            const approvedOnly = allLogs.filter(log => log.status === 'approved');
            if (approvedOnly.length > 0) {
                const totalHours = approvedOnly.reduce((sum, log) => sum + (log.totalHours || 0), 0);
                stats.avgHoursPerDay = Number((totalHours / approvedOnly.length).toFixed(1));
            }
        }

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching mentor stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get weekly breakdown
// @route   GET /api/progress/weekly/:id
// @access  Private
exports.getWeeklyBreakdown = async (req, res) => {
    try {
        const studentId = req.params.id;

        const logs = await DailyLog.find({ studentId, status: 'approved' }).sort({ date: 1 });

        // Group by week
        const weeklyData = {};

        logs.forEach(log => {
            // Logic for week calculation (simple logic here based on log date)
            const d = new Date(log.date);
            const weekNum = log.weekNumber || Math.ceil((d.getDate() - 1 - d.getDay()) / 7) + 1;
            const weekKey = `Week ${weekNum}`;

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { hours: 0, tasks: 0 };
            }

            weeklyData[weekKey].hours += (log.totalHours || 0);
            if (log.tasksCompleted) {
                weeklyData[weekKey].tasks += log.tasksCompleted.length;
            }
        });

        const categories = Object.keys(weeklyData);
        const hours = categories.map(key => weeklyData[key].hours);
        const tasks = categories.map(key => weeklyData[key].tasks);

        res.status(200).json({
            success: true,
            breakdown: {
                categories,
                hours,
                tasks
            }
        });
    } catch (error) {
        console.error('Error fetching weekly breakdown:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
