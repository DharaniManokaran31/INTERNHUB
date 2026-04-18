const DailyLog = require('../models/DailyLog');
const Internship = require('../models/Internship');
const Student = require('../models/Student');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

// ============================================
// STUDENT PROGRESS
// ============================================

// Get Student Progress Overview
exports.getStudentProgress = async (req, res) => {
    try {
        let studentId = req.params.studentId || req.user.id;
        if (studentId && typeof studentId === 'string') {
            studentId = studentId.trim();
        }

        // Get active internship
        const activeApplication = await Application.findOne({
            studentId,
            status: { $in: ['accepted', 'completed'] }
        }).populate({
            path: 'internshipId',
            populate: {
                path: 'mentorId',
                select: 'fullName email department designation'
            }
        });

        if (!activeApplication) {
            return res.status(200).json({
                success: true,
                data: {
                    hasActiveInternship: false,
                    message: 'No active internship found'
                }
            });
        }

        const internship = activeApplication.internshipId;
        
        // Get all logs for this internship
        const logs = await DailyLog.find({
            studentId,
            internshipId: internship._id
        }).sort({ date: 1 });

        // Calculate progress
        const startDate = new Date(internship.startDate);
        const endDate = new Date(internship.endDate);
        const now = new Date();

        const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        const timeElapsed = Math.max(0, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
        
        // Log stats
        const approvedLogs = logs.filter(l => l.status === 'approved');
        const totalHours = approvedLogs.reduce((sum, l) => sum + (l.totalHours || 0), 0);

        // Days passed is the maximum of calendar time and unique days logged
        const uniqueDaysLogged = new Set(logs.map(l => new Date(l.date).toDateString())).size;
        let daysPassed = Math.max(timeElapsed, uniqueDaysLogged, approvedLogs.length);
        let progress = Math.min(Math.round((daysPassed / totalDays) * 100), 100);

        // If completed, override with 100% progress
        if (activeApplication.status === 'completed') {
            progress = 100;
            daysPassed = totalDays;
        }

        // Weekly breakdown
        const weeklyData = [];
        const weeks = Math.ceil(totalDays / 7);

        for (let week = 1; week <= weeks; week++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const weekLogs = logs.filter(l => {
                const logDate = new Date(l.date);
                return logDate >= weekStart && logDate < weekEnd;
            });

            weeklyData.push({
                week,
                startDate: weekStart,
                endDate: weekEnd,
                logs: weekLogs.length,
                hours: weekLogs.reduce((sum, l) => sum + (l.totalHours || 0), 0),
                approved: weekLogs.filter(l => l.status === 'approved').length
            });
        }

        res.status(200).json({
            success: true,
            data: {
                hasActiveInternship: true,
                internship: {
                    id: internship._id,
                    title: internship.title,
                    department: internship.department,
                    mentor: internship.mentorId,
                    startDate: internship.startDate,
                    endDate: internship.endDate,
                    duration: internship.duration,
                    totalDays
                },
                progress: {
                    percentage: progress,
                    daysPassed,
                    totalDays,
                    daysRemaining: Math.max(0, totalDays - daysPassed)
                },
                stats: {
                    totalLogs: logs.length,
                    approvedLogs: approvedLogs.length,
                    pendingLogs: logs.filter(l => l.status === 'pending').length,
                    rejectedLogs: logs.filter(l => l.status === 'rejected').length,
                    totalHours: Number(totalHours.toFixed(2)),
                    averageHours: approvedLogs.length > 0 
                        ? Number((totalHours / approvedLogs.length).toFixed(2))
                        : 0
                },
                weeklyBreakdown: weeklyData,
                recentLogs: logs.slice(-10).reverse()
            }
        });
    } catch (error) {
        console.error('Error getting student progress:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// MILESTONES
// ============================================

// Get Internship Milestones (FIXED)
exports.getMilestones = async (req, res) => {
    try {
        const { internshipId } = req.params;

        const internship = await Internship.findById(internshipId);
        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        let milestones = internship.milestones || [];

        // Generate default milestones if none exist
        if (milestones.length === 0) {
            const startDate = new Date(internship.startDate);
            const endDate = new Date(internship.endDate); // FIXED: define endDate
            const totalDays = internship.totalDays || 60;

            milestones = [
                {
                    title: 'Onboarding & Setup',
                    description: 'Complete onboarding, setup development environment',
                    dueDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000),
                    status: 'pending'
                },
                {
                    title: 'First Week Review',
                    description: 'Complete first week tasks, meet with mentor',
                    dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                    status: 'pending'
                },
                {
                    title: 'First Project Milestone',
                    description: 'Complete first major task/project',
                    dueDate: new Date(startDate.getTime() + 21 * 24 * 60 * 60 * 1000),
                    status: 'pending'
                },
                {
                    title: 'Mid-Internship Review',
                    description: 'Progress review with mentor',
                    dueDate: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                    status: 'pending'
                },
                {
                    title: 'Final Project Submission',
                    description: 'Submit final project/work',
                    dueDate: new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000),
                    status: 'pending'
                },
                {
                    title: 'Final Presentation',
                    description: 'Present work to team',
                    dueDate: new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000),
                    status: 'pending'
                }
            ];
        }

        // Convert to plain objects if they're Mongoose documents
        const milestonesArray = milestones.map(m => m.toObject ? m.toObject() : m);

        // Update overdue status
        const now = new Date();
        const updatedMilestones = milestonesArray.map(m => ({
            ...m,
            status: m.status === 'pending' && m.dueDate && new Date(m.dueDate) < now ? 'overdue' : m.status
        }));

        const completed = updatedMilestones.filter(m => m.status === 'completed').length;
        const total = updatedMilestones.length;

        res.status(200).json({
            success: true,
            data: {
                milestones: updatedMilestones,
                stats: {
                    total,
                    completed,
                    pending: updatedMilestones.filter(m => m.status === 'pending').length,
                    overdue: updatedMilestones.filter(m => m.status === 'overdue').length,
                    progress: total > 0 ? Math.round((completed / total) * 100) : 0
                }
            }
        });
    } catch (error) {
        console.error('Error getting milestones:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Milestone Status
exports.updateMilestone = async (req, res) => {
    try {
        const { internshipId, milestoneId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const internship = await Internship.findById(internshipId);
        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        // Check permission
        const isStudent = userRole === 'student' && 
            (await Application.exists({ studentId: userId, internshipId, status: 'accepted' }));
        const isMentor = userRole === 'recruiter' && internship.mentorId.toString() === userId;
        const isHR = userRole === 'hr';

        if (!isStudent && !isMentor && !isHR) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update milestones'
            });
        }

        const milestone = internship.milestones.id(milestoneId);
        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found'
            });
        }

        milestone.status = status;
        if (status === 'completed') {
            milestone.completedDate = new Date();
        }

        await internship.save();

        res.status(200).json({
            success: true,
            message: 'Milestone updated successfully',
            data: { milestone }
        });
    } catch (error) {
        console.error('Error updating milestone:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// MENTOR DASHBOARD
// ============================================

// Get Mentor Dashboard Stats
exports.getMentorDashboard = async (req, res) => {
    try {
        const mentorId = req.user.id;

        // Get all mentees
        const mentor = await require('../models/Recruiter').findById(mentorId)
            .populate('mentorFor', 'fullName email profilePicture currentEducation createdAt');

        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        const mentees = mentor.mentorFor || [];

        // Get progress for each mentee
        const menteeProgress = await Promise.all(mentees.map(async (student) => {
            // Get active or completed internship
            const application = await Application.findOne({
                studentId: student._id,
                status: { $in: ['accepted', 'completed'] }
            }).populate('internshipId');

            if (!application || !application.internshipId) return null;

            const logs = await DailyLog.find({
                studentId: student._id,
                internshipId: application.internshipId._id
            });

            const approvedLogs = logs.filter(l => l.status === 'approved');
            
            // Robust daysPassed calculation (same as getStudentProgress)
            const startDate = new Date(application.internshipId.startDate);
            const endDate = new Date(application.internshipId.endDate);
            const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
            
            const today = new Date();
            const timeElapsed = Math.max(0, Math.ceil((Math.min(today, endDate) - startDate) / (1000 * 60 * 60 * 24)));
            
            const uniqueDaysLogged = new Set(logs.map(l => new Date(l.date).toDateString())).size;
            
            // Progress is 100% if status is completed, otherwise calculate
            let progress;
            if (application.status === 'completed') {
                progress = "100.00";
            } else {
                const daysPassed = Math.max(timeElapsed, uniqueDaysLogged, approvedLogs.length);
                progress = Math.min((daysPassed / totalDays) * 100, 100).toFixed(2);
            }

            return {
                student: student.toObject ? student.toObject({ virtuals: true }) : student,
                internship: {
                    title: application.internshipId.title,
                    startDate: application.internshipId.startDate,
                    endDate: application.internshipId.endDate,
                    status: application.status
                },
                stats: {
                    totalLogs: logs.length,
                    pendingLogs: logs.filter(l => l.status === 'pending').length,
                    approvedLogs: approvedLogs.length,
                    progress,
                    lastLog: logs.sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null
                }
            };
        }));

        const validMentees = menteeProgress.filter(m => m !== null);

        // Get pending interviews count
        const pendingInterviews = await Interview.countDocuments({
            recruiterId: mentorId,
            overallStatus: { $in: ['pending', 'scheduled', 'in_progress'] }
        });

        // Get daily stats from the valid mentees' logs
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let approvedToday = 0;
        let totalHours = 0;
        let totalApprovedLogsCount = 0;

        validMentees.forEach(m => {
            const studentLogs = m.stats.totalLogs > 0 ? m.stats : { approvedLogs: 0, totalLogs: 0 };
            // Note: m.stats only has counts, we need the actual logs for today's check
            // However, we can just aggregate from DailyLog manually for precision if needed
        });

        // Aggregate across all valid mentee IDs for accuracy
        const menteeIds = validMentees.map(m => m.student._id);
        
        approvedToday = await DailyLog.countDocuments({
            studentId: { $in: menteeIds },
            status: 'approved',
            updatedAt: { $gte: today }
        });

        const allApprovedLogs = await DailyLog.find({
            studentId: { $in: menteeIds },
            status: 'approved'
        });

        allApprovedLogs.forEach(l => totalHours += (l.totalHours || 0));
        const avgHours = allApprovedLogs.length > 0 ? (totalHours / allApprovedLogs.length).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalMentees: validMentees.length,
                mentees: validMentees,
                pendingReviews: validMentees.reduce((sum, m) => sum + m.stats.pendingLogs, 0),
                pendingInterviews,
                approvedToday,
                avgHoursPerDay: avgHours
            }
        });
    } catch (error) {
        console.error('Error getting mentor dashboard:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// HR DASHBOARD
// ============================================

// Get HR Progress Overview
exports.getHRProgressOverview = async (req, res) => {
    try {
        // Get all active internships
        const activeInternships = await Internship.find({ status: 'active' });

        // Get all accepted applications
        const activeInterns = await Application.find({ status: 'accepted' })
            .populate('studentId', 'fullName email')
            .populate('internshipId', 'title department');

        // Calculate overall stats
        const totalInterns = activeInterns.length;
        let totalProgress = 0;
        let totalLogs = 0;

        for (const intern of activeInterns) {
            const logs = await DailyLog.countDocuments({
                studentId: intern.studentId._id,
                internshipId: intern.internshipId._id
            });
            totalLogs += logs;

            const internship = intern.internshipId;
            const totalDays = internship.duration * 30 || 60;
            const progress = Math.min(Math.round((logs / totalDays) * 100), 100);
            totalProgress += progress;
        }

        const averageProgress = totalInterns > 0 ? Math.round(totalProgress / totalInterns) : 0;

        // Department-wise breakdown
        const departmentStats = await Application.aggregate([
            { $match: { status: 'accepted' } },
            { $lookup: {
                from: 'internships',
                localField: 'internshipId',
                foreignField: '_id',
                as: 'internship'
            }},
            { $unwind: '$internship' },
            { $group: {
                _id: '$internship.department',
                count: { $sum: 1 }
            }}
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalInterns,
                totalActiveInternships: activeInternships.length,
                totalLogsSubmitted: totalLogs,
                averageProgress,
                departmentWise: departmentStats,
                averageLogsPerIntern: totalInterns > 0 ? (totalLogs / totalInterns).toFixed(1) : 0
            }
        });
    } catch (error) {
        console.error('Error getting HR progress overview:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// MISSING FUNCTION - ADD THIS
// ============================================

// Get Weekly Breakdown for Intern
exports.getWeeklyBreakdown = async (req, res) => {
    try {
        let { studentId } = req.params;
        if (studentId) studentId = studentId.trim();
        const mentorId = req.user.id;
        const mongoose = require('mongoose');

        // Check if mentor has access to this student
        const mentor = await require('../models/Recruiter').findById(mentorId);
        if (!mentor || !mentor.mentorFor.includes(studentId)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this student\'s progress'
            });
        }

        // Get Internship info to know total weeks
        const activeApplication = await require('../models/Application').findOne({
            studentId,
            status: { $in: ['accepted', 'completed'] }
        }).populate('internshipId');

        if (!activeApplication || !activeApplication.internshipId) {
            return res.status(404).json({
                success: false,
                message: 'No active internship found for this student'
            });
        }

        const internship = activeApplication.internshipId;
        const startDate = new Date(internship.startDate);
        const endDate = new Date(internship.endDate);
        const durationDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        let totalWeeks = Math.ceil(durationDays / 7);

        // Get logs for this student
        const logs = await DailyLog.find({ 
            studentId,
            status: 'approved' 
        }).sort({ date: 1 });

        // Ensure totalWeeks covers all logs
        if (logs.length > 0) {
            const lastLogDate = new Date(logs[logs.length - 1].date);
            const timeDiffFromStart = Math.abs(lastLogDate.getTime() - startDate.getTime());
            const logWeeks = Math.ceil((timeDiffFromStart / (1000 * 3600 * 24) + 1) / 7);
            if (logWeeks > totalWeeks) {
                totalWeeks = logWeeks;
            }
        }

        // Group by week
        const weeklyData = {};
        
        // Initialize all weeks
        for (let i = 1; i <= totalWeeks; i++) {
            weeklyData[`Week ${i}`] = { hours: 0, tasks: 0 };
        }
        
        logs.forEach(log => {
            // Calculate week number based on date difference from start date
            const logDate = new Date(log.date);
            const timeDiff = Math.abs(logDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            // Note: diffDays is 0-indexed for calculation, but we want 1-indexed week
            let weekNum = Math.ceil((diffDays + 1) / 7);
            
            // Handle edge cases where date is slightly before startDate or beyond duration
            if (weekNum < 1) weekNum = 1;
            if (weekNum > totalWeeks) weekNum = totalWeeks;
            
            const weekKey = `Week ${weekNum}`;

            if (weeklyData[weekKey]) {
                weeklyData[weekKey].hours += (log.totalHours || 0);
                if (log.tasksCompleted) {
                    weeklyData[weekKey].tasks += log.tasksCompleted.length;
                }
            }
        });

        const categories = Object.keys(weeklyData);
        const hours = categories.map(key => Number(weeklyData[key].hours.toFixed(2)));
        const tasks = categories.map(key => weeklyData[key].tasks);

        res.status(200).json({
            success: true,
            data: {
                categories,
                hours,
                tasks
            }
        });
    } catch (error) {
        console.error('Error fetching weekly breakdown:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};