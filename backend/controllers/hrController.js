const Recruiter = require('../models/Recruiter');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Certificate = require('../models/Certificate');
const crypto = require('crypto');
const { sendInvitationEmail } = require('../services/emailService');

// ============================================
// Recruiter Invitation
// ============================================
exports.inviteRecruiter = async (req, res) => {
    try {
        const { fullName, email, department, designation, maxInterns } = req.body;

        // Check if recruiter already exists
        const existingRecruiter = await Recruiter.findOne({ email });
        if (existingRecruiter) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Generate invitation token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        // Get company ID (from first company or HR's company)
        const company = await Company.findOne({});
        if (!company) {
            return res.status(500).json({ success: false, message: 'Company setup missing' });
        }

        // Create pending recruiter
        const newRecruiter = new Recruiter({
            fullName,
            email,
            department,
            designation,
            companyId: company._id,
            role: 'recruiter',
            invitationToken: inviteToken,
            invitationExpires: inviteExpires,
            invitationStatus: 'pending',
            isActive: false, // Inactive until password setup
            addedBy: req.user.id,
            password: crypto.randomBytes(16).toString('hex'), // Temporary random password
            permissions: {
                maxInterns: maxInterns || 5
            }
        });

        await newRecruiter.save();

        // Send Email
        const inviteLink = `http://localhost:3000/accept-invite/${inviteToken}`;
        const emailResult = await sendInvitationEmail(email, fullName, inviteLink);

        res.status(201).json({
            success: true,
            message: emailResult.success ? 'Invitation sent successfully' : 'Recruiter added, but email failed to send',
            data: { recruiter: newRecruiter }
        });
    } catch (error) {
        console.error('Error in inviteRecruiter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// HR Dashboard & Overview
// ============================================
exports.getCompanyOverview = async (req, res) => {
    try {
        const company = await Company.findOne({});

        // Get all recruiters
        const allRecruiters = await Recruiter.find({ role: 'recruiter' });
        const activeRecruiters = allRecruiters.filter(r =>
            r.invitationStatus === 'accepted' && r.isActive !== false
        );
        const pendingInvites = allRecruiters.filter(r =>
            r.invitationStatus === 'pending'
        );

        // Get all internships
        const internships = await Internship.find({});
        const activeInternships = internships.filter(i => i.status === 'active');

        // Get all applications
        const applications = await Application.find({});
        const totalApplicants = applications.length;
        const activeInterns = applications.filter(a => a.status === 'accepted').length;

        res.status(200).json({
            success: true,
            data: {
                company: {
                    name: company?.name || 'Zoyaraa',
                    verificationStatus: company?.verificationStatus || 'verified'
                },
                stats: {
                    totalRecruiters: activeRecruiters.length + pendingInvites.length,
                    pendingInvites: pendingInvites.length,
                    activeInternships: activeInternships.length,
                    totalApplicants,
                    activeInterns
                }
            }
        });
    } catch (error) {
        console.error('Error in getCompanyOverview:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// Recruiter Management
// ============================================

// Get all recruiters
exports.getAllRecruiters = async (req, res) => {
    try {
        const recruiters = await Recruiter.find({ role: 'recruiter' })
            .select('-password')
            .sort({ createdAt: -1 });

        // Add stats for each recruiter
        const recruitersWithStats = await Promise.all(recruiters.map(async (recruiter) => {
            const internCount = recruiter.mentorFor?.length || 0;
            const internshipCount = await Internship.countDocuments({ postedBy: recruiter._id });

            return {
                ...recruiter.toObject(),
                stats: {
                    activeInterns: internCount,
                    totalInternships: internshipCount
                }
            };
        }));

        const active = recruitersWithStats.filter(r => r.invitationStatus === 'accepted' && r.isActive !== false);
        const pending = recruitersWithStats.filter(r => r.invitationStatus === 'pending');

        res.status(200).json({
            success: true,
            data: { active, pending }
        });
    } catch (error) {
        console.error('Error in getAllRecruiters:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single recruiter
exports.getRecruiterById = async (req, res) => {
    try {
        const { id } = req.params;
        const recruiter = await Recruiter.findById(id)
            .select('-password')
            .populate('addedBy', 'fullName email');

        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { recruiter }
        });
    } catch (error) {
        console.error('Error in getRecruiterById:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update recruiter (HR can edit any recruiter)
exports.updateRecruiter = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Remove sensitive fields
        delete updates.password;
        delete updates.email;
        delete updates.role;
        delete updates.invitationToken;

        const recruiter = await Recruiter.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recruiter updated successfully',
            data: { recruiter }
        });
    } catch (error) {
        console.error('Error in updateRecruiter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Deactivate recruiter
exports.deactivateRecruiter = async (req, res) => {
    try {
        const { id } = req.params;

        const recruiter = await Recruiter.findByIdAndUpdate(
            id,
            {
                isActive: false,
                deactivatedAt: new Date(),
                deactivatedBy: req.user.id,
                'permissions.canPostInternship': false
            },
            { new: true }
        ).select('-password');

        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recruiter deactivated successfully',
            data: { recruiter }
        });
    } catch (error) {
        console.error('Error in deactivateRecruiter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Activate recruiter
exports.activateRecruiter = async (req, res) => {
    try {
        const { id } = req.params;

        const recruiter = await Recruiter.findByIdAndUpdate(
            id,
            {
                isActive: true,
                deactivatedAt: null,
                deactivatedBy: null,
                'permissions.canPostInternship': true
            },
            { new: true }
        ).select('-password');

        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Recruiter activated successfully',
            data: { recruiter }
        });
    } catch (error) {
        console.error('Error in activateRecruiter:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Revoke invitation
exports.revokeInvitation = async (req, res) => {
    try {
        const { id } = req.params;

        const recruiter = await Recruiter.findByIdAndUpdate(
            id,
            {
                invitationStatus: 'revoked',
                invitationToken: null,
                invitationExpires: null,
                isActive: false
            },
            { new: true }
        ).select('-password');

        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Invitation revoked successfully',
            data: { recruiter }
        });
    } catch (error) {
        console.error('Error in revokeInvitation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// View All Data (HR Oversight)
// ============================================

// Get all internships
exports.getAllInternships = async (req, res) => {
    try {
        const internships = await Internship.find({})
            .populate('postedBy', 'fullName email department')
            .populate('mentorId', 'fullName email department')
            .sort({ createdAt: -1 });

        // Add stats
        const internshipsWithStats = await Promise.all(internships.map(async (internship) => {
            const applications = await Application.find({ internship: internship._id });
            return {
                ...internship.toObject(),
                stats: {
                    totalApplications: applications.length,
                    pending: applications.filter(a => a.status === 'pending').length,
                    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
                    accepted: applications.filter(a => a.status === 'accepted').length
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: { internships: internshipsWithStats }
        });
    } catch (error) {
        console.error('Error in getAllInternships:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all applications
exports.getAllApplications = async (req, res) => {
    try {
        const applications = await Application.find({})
            .populate('student', 'fullName email education')
            .populate({
                path: 'internship',
                select: 'title department companyName',
                populate: {
                    path: 'postedBy',
                    select: 'fullName department'
                }
            })
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            data: { applications }
        });
    } catch (error) {
        console.error('Error in getAllApplications:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({})
            .select('fullName email education skills currentInternship createdAt')
            .sort({ createdAt: -1 });

        // Add application stats for each student
        const studentsWithStats = await Promise.all(students.map(async (student) => {
            const applications = await Application.find({ student: student._id })
                .populate('internship', 'title');
            return {
                ...student.toObject(),
                applications: applications.length,
                acceptedInternships: applications.filter(a => a.status === 'accepted').length
            };
        }));

        res.status(200).json({
            success: true,
            data: { students: studentsWithStats }
        });
    } catch (error) {
        console.error('Error in getAllStudents:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// Certificate Management
// ============================================

// Get all certificates
exports.getAllCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find({})
            .populate('student', 'fullName email')
            .populate('internship', 'title department')
            .sort({ issueDate: -1 });

        res.status(200).json({
            success: true,
            data: { certificates }
        });
    } catch (error) {
        console.error('Error in getAllCertificates:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get certificate stats
exports.getCertificateStats = async (req, res) => {
    try {
        const certificates = await Certificate.find({ status: 'issued' });

        const totalIssued = certificates.length;

        // This month's issued certificates
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const recentIssued = certificates.filter(cert => cert.issueDate >= startOfMonth).length;

        const totalRevoked = await Certificate.countDocuments({ status: 'revoked' });

        res.status(200).json({
            success: true,
            data: {
                totalIssued,
                recentIssued,
                totalRevoked
            }
        });
    } catch (error) {
        console.error('Error in getCertificateStats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get students eligible for certification
exports.getEligibleStudents = async (req, res) => {
    try {
        // Students who have an 'accepted' application but no certificate yet
        const acceptedApplications = await Application.find({ status: 'accepted' })
            .populate('student', 'fullName profilePicture email')
            .populate('internship', 'title department postedBy');

        // Filter out those who already have a certificate issued for that application
        const eligible = [];
        for (const app of acceptedApplications) {
            const certExists = await Certificate.findOne({ application: app._id, status: 'issued' });
            if (!certExists) {
                eligible.push(app);
            }
        }

        res.status(200).json({
            success: true,
            data: { eligible }
        });
    } catch (error) {
        console.error('Error in getEligibleStudents:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Issue a new certificate
exports.issueCertificate = async (req, res) => {
    try {
        const {
            applicationId,
            studentId,
            internshipId,
            template,
            issueDate,
            projectTitle,
            mentorName,
            skillsAcquired,
            grade,
            comments
        } = req.body;

        const hrId = req.user.id;

        // Generate unique certificate ID
        const certificateId = `CERT-ZOY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newCertificate = new Certificate({
            certificateId,
            student: studentId,
            internship: internshipId,
            application: applicationId,
            issueDate: issueDate || new Date(),
            template: template || 'professional',
            projectTitle,
            mentorName,
            skillsAcquired,
            grade,
            comments,
            status: 'issued',
            issuedBy: hrId
        });

        await newCertificate.save();

        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully',
            data: { certificate: newCertificate }
        });
    } catch (error) {
        console.error('Error in issueCertificate:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Revoke a certificate
exports.revokeCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const hrId = req.user.id;

        const certificate = await Certificate.findById(id);
        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        certificate.status = 'revoked';
        certificate.revocationReason = reason;
        certificate.revokedAt = new Date();
        certificate.revokedBy = hrId;

        await certificate.save();

        res.status(200).json({
            success: true,
            message: 'Certificate revoked successfully',
            data: { certificate }
        });
    } catch (error) {
        console.error('Error in revokeCertificate:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// Intern Tracking
// ============================================

// Get all active interns
exports.getActiveInterns = async (req, res) => {
    try {
        const activeApplications = await Application.find({
            status: { $in: ['accepted', 'hired', 'active'] }
        })
            .populate('student', 'fullName email profilePicture skills')
            .populate('internship', 'title department duration startDate endDate')
            .populate({
                path: 'internship',
                populate: { path: 'postedBy', select: 'fullName email' }
            })
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            data: { interns: activeApplications }
        });
    } catch (error) {
        console.error('Error in getActiveInterns:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get completed interns
exports.getCompletedInterns = async (req, res) => {
    try {
        const query = { status: 'completed' };

        const completedApplications = await Application.find(query)
            .populate('student', 'fullName email profilePicture')
            .populate('internship', 'title department')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: { interns: completedApplications }
        });
    } catch (error) {
        console.error('Error in getCompletedInterns:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// Detailed Entity Views (Added for Audit Fix)
// ============================================

// Get single internship
exports.getInternshipById = async (req, res) => {
    const { internshipId } = req.params;
    console.log('Fetching internship by ID:', internshipId);
    try {
        const internship = await Internship.findById(internshipId)
            .populate('postedBy', 'fullName email department')
            .populate('mentorId', 'fullName email department');

        if (!internship) {
            console.log('Internship NOT found in DB for ID:', internshipId);
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        res.status(200).json({
            success: true,
            data: { internship }
        });
    } catch (error) {
        console.error('Error in getInternshipById:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get applications for a specific internship
exports.getInternshipApplications = async (req, res) => {
    const { internshipId } = req.params;
    try {
        const applications = await Application.find({ internship: internshipId })
            .populate('student', 'fullName email profilePicture phone location skills')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            data: { applications }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update internship status (e.g., active to closed)
exports.updateInternshipStatus = async (req, res) => {
    const { internshipId } = req.params;
    try {
        const { status } = req.body;
        const internship = await Internship.findByIdAndUpdate(
            internshipId,
            { status },
            { new: true }
        );

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        res.status(200).json({
            success: true,
            message: `Internship status updated to ${status}`,
            data: { internship }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single application
exports.getApplicationById = async (req, res) => {
    const { applicationId } = req.params;
    try {
        const application = await Application.findById(applicationId)
            .populate('student')
            .populate('internship');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        res.status(200).json({
            success: true,
            data: { application }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update application status (Accept/Reject/Shortlist)
exports.updateApplicationStatus = async (req, res) => {
    const { applicationId } = req.params;
    try {
        const { status } = req.body;
        const application = await Application.findById(applicationId)
            .populate({
                path: 'internship',
                populate: { path: 'postedBy' }
            })
            .populate('student');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        application.status = status;
        await application.save();

        res.status(200).json({
            success: true,
            message: `Application status updated to ${status}`,
            data: { application }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single student
exports.getStudentById = async (req, res) => {
    const { studentId } = req.params;
    try {
        const student = await Student.findById(studentId)
            .select('-password');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.status(200).json({
            success: true,
            data: { student }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// ============================================
// Progress & Reports (Added for Audit Fix)
// ============================================

// Get intern progress
exports.getInternProgress = async (req, res) => {
    const { internRecordId } = req.params;
    try {
        const applicationId = internRecordId;
        const DailyLog = require('../models/DailyLog');
        
        // Find application to get student and internship details
        const application = await Application.findById(applicationId)
            .populate('student')
            .populate('internship');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Internship record not found' });
        }

        // ✅ FIXED: DailyLog model uses 'studentId' and 'internshipId', not 'student'/'internship'
        const logs = await DailyLog.find({ 
            studentId: application.student?._id,
            internshipId: application.internship?._id
        }).sort({ date: -1 });

        // Calculate progress percentage based on duration (months → days)
        const totalDays = (application.internship?.duration || 1) * 30;
        const completedDays = logs.length;
        const progress = Math.min(Math.round((completedDays / totalDays) * 100), 100);

        // Total hours logged
        const totalHours = logs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

        // Format recent logs for display
        const recentLogs = logs.slice(0, 10).map(log => ({
            _id: log._id,
            date: log.date,
            description: log.learnings || log.tasksCompleted?.[0]?.description || 'Work logged',
            hours: log.totalHours || 0,
            status: log.status || 'pending',
            mentorFeedback: log.mentorFeedback
        }));

        res.status(200).json({
            success: true,
            data: {
                student: application.student,
                internship: application.internship,
                progress,
                totalLogs: logs.length,
                totalHours,
                recentLogs
            }
        });
    } catch (error) {
        console.error('Error in getInternProgress:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark intern as complete
exports.markInternComplete = async (req, res) => {
    try {
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status: 'completed' },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ success: false, message: 'Internship record not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Intern marked as completed',
            data: { application }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get detailed reports stats
exports.getReportsStats = async (req, res) => {
    try {
        const totalInternships = await Internship.countDocuments({});
        const activeInternships = await Internship.countDocuments({ status: 'active' });
        const totalApplications = await Application.countDocuments({});
        const acceptedApplications = await Application.countDocuments({ status: 'accepted' });
        const rejectedApplications = await Application.countDocuments({ status: 'rejected' });
        const totalStudents = await Student.countDocuments({});
        const totalRecruiters = await Recruiter.countDocuments({ role: 'recruiter', invitationStatus: { $in: ['accepted', 'pending'] } });
        
        const placementRate = totalApplications > 0 
            ? ((acceptedApplications / totalApplications) * 100).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                totalRecruiters,
                totalInternships,
                activeInternships,
                totalApplications,
                acceptedApplications,
                rejectedApplications,
                totalStudents,
                placementRate,
                conversionRate: placementRate // Using same for now
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get department-wise distribution
exports.getDepartmentDistribution = async (req, res) => {
    try {
        const distribution = await Internship.aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $project: { name: "$_id", count: 1, _id: 0 } }
        ]);

        res.status(200).json({
            success: true,
            data: { distribution }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 1. Recent Activity Feed
exports.getRecentActivity = async (req, res) => {
    try {
        // Fetch recent applications, recruiter joins, and internship postings
        const [applications, recruiters, internships] = await Promise.all([
            Application.find().sort({ appliedAt: -1 }).limit(5).populate('student', 'fullName').populate('internship', 'title'),
            Recruiter.find({ role: 'recruiter' }).sort({ createdAt: -1 }).limit(5),
            Internship.find().sort({ createdAt: -1 }).limit(5).populate('postedBy', 'fullName')
        ]);

        const activities = [
            ...applications.map(a => ({
                id: a._id,
                type: 'application',
                description: `${a.student?.fullName || 'A student'} applied for ${a.internship?.title || 'an internship'}`,
                timestamp: a.appliedAt,
                link: `/hr/applicants/${a._id}`
            })),
            ...recruiters.map(r => ({
                id: r._id,
                type: 'recruiter',
                description: `New recruiter ${r.fullName} joined the platform`,
                timestamp: r.createdAt,
                link: `/hr/recruiters`
            })),
            ...internships.map(i => ({
                id: i._id,
                type: 'internship',
                description: `New internship posted: ${i.title} by ${i.postedBy?.fullName || 'HR'}`,
                timestamp: i.createdAt,
                link: `/hr/internships/${i._id}`
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

        res.status(200).json({ success: true, data: { activities } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Reports Trends
exports.getReportsTrends = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let days = 30;
        if (period === 'week') days = 7;
        if (period === 'year') days = 365;

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        // Aggregation for trends
        const appsTrend = await Application.aggregate([
            { $match: { appliedAt: { $gte: dateLimit } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        const hiresTrend = await Application.aggregate([
            { $match: { status: 'accepted', updatedAt: { $gte: dateLimit } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                applicationsOverTime: appsTrend.map(a => ({ date: a._id, count: a.count })),
                hiresOverTime: hiresTrend.map(h => ({ date: h._id, count: h.count }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Reports Conversion
exports.getReportsConversion = async (req, res) => {
    try {
        const totalApps = await Application.countDocuments();
        const totalHired = await Application.countDocuments({ status: 'accepted' });
        const interviewOffers = await Application.countDocuments({ status: 'shortlisted' });

        const applicationToHire = totalApps > 0 ? ((totalHired / totalApps) * 100).toFixed(1) : 0;
        const interviewToOffer = interviewOffers > 0 ? ((totalHired / interviewOffers) * 100).toFixed(1) : 0;

        const deptWise = await Internship.aggregate([
            {
                $lookup: {
                    from: 'applications',
                    localField: '_id',
                    foreignField: 'internship',
                    as: 'apps'
                }
            },
            {
                $project: {
                    department: 1,
                    total: { $size: "$apps" },
                    hired: {
                        $size: {
                            $filter: {
                                input: "$apps",
                                as: "app",
                                cond: { $eq: ["$$app.status", "accepted"] }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$department",
                    totalApps: { $sum: "$total" },
                    totalHired: { $sum: "$hired" }
                }
            },
            {
                $project: {
                    department: "$_id",
                    conversion: {
                        $cond: [
                            { $gt: ["$totalApps", 0] },
                            { $multiply: [{ $divide: ["$totalHired", "$totalApps"] }, 100] },
                            0
                        ]
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                applicationToHire,
                interviewToOffer,
                departmentWise: deptWise
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Certificate Verification (PUBLIC)
exports.verifyCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await Certificate.findOne({ certificateId: id })
            .populate('student', 'fullName email education')
            .populate('internship', 'title department companyName')
            .populate('issuedBy', 'fullName designation');

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Invalid Certificate ID' });
        }

        res.status(200).json({
            success: true,
            data: {
                valid: true,
                certificate,
                student: certificate.student,
                internship: certificate.internship,
                issuedBy: certificate.issuedBy
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Active Interns Stats
exports.getActiveInternsStats = async (req, res) => {
    try {
        const activeInterns = await Application.find({ status: 'accepted' }).populate('internship');
        
        const now = new Date();
        const endingSoonLimit = new Date();
        endingSoonLimit.setDate(now.getDate() + 15);

        const endingSoon = activeInterns.filter(i => {
             if (!i.internship?.endDate) return false;
             return new Date(i.internship.endDate) <= endingSoonLimit && new Date(i.internship.endDate) >= now;
        }).length;

        const activeGroups = new Set(activeInterns.map(i => i.internship?._id.toString())).size;

        res.status(200).json({
            success: true,
            data: {
                totalActive: activeInterns.length,
                currentlyOnline: Math.floor(activeInterns.length * 0.4), // Mocked online status for now
                endingSoon,
                activeGroups,
                averageProgress: 65 // Average fallback
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Schedule interview for a candidate
exports.scheduleInterview = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const interviewData = req.body;

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Add to interviews array
        if (!application.interviews) application.interviews = [];
        application.interviews.push({
            ...interviewData,
            status: 'scheduled',
            createdAt: new Date()
        });

        // Update status to shortlisted if not already
        application.status = 'shortlisted';
        await application.save();

        res.status(200).json({ success: true, message: 'Interview scheduled successfully', application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};