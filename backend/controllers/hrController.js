const Recruiter = require('../models/Recruiter');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Certificate = require('../models/Certificate');
const DailyLog = require('../models/DailyLog');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendInvitationEmail } = require('../services/emailService');

// ============================================
// RECRUITER INVITATION
// ============================================

// Get all available (uninvited) recruiters from pre-loaded list
exports.getAvailableRecruiters = async (req, res) => {
  try {
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Find recruiters who are NOT invited yet
    const availableRecruiters = await Recruiter.find({
      companyId: company._id,
      role: 'recruiter',
      isInvited: false,
      invitationStatus: 'pending'
    }).select('fullName email department designation phone');

    res.status(200).json({
      success: true,
      data: { recruiters: availableRecruiters }
    });
  } catch (error) {
    console.error('Error in getAvailableRecruiters:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Invite a recruiter
exports.inviteRecruiter = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    const hrId = req.user.id;

    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    if (recruiter.isInvited) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter already invited'
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Update recruiter
    recruiter.isInvited = true;
    recruiter.invitationToken = invitationToken;
    recruiter.invitationExpires = invitationExpires;
    recruiter.invitationStatus = 'pending';
    recruiter.addedBy = hrId;
    await recruiter.save();

    // Send invitation email
    try {
      const inviteLink = `http://localhost:3000/accept-invite/${invitationToken}`;
      await sendInvitationEmail(recruiter.email, recruiter.fullName, inviteLink);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${recruiter.fullName}`,
      data: { recruiter }
    });
  } catch (error) {
    console.error('Error in inviteRecruiter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get pending invitations
exports.getPendingInvitations = async (req, res) => {
  try {
    const company = await Company.findOne();

    const pendingRecruiters = await Recruiter.find({
      companyId: company._id,
      role: 'recruiter',
      invitationStatus: 'pending'
    }).select('fullName email department designation invitationExpires');

    res.status(200).json({
      success: true,
      data: { invitations: pendingRecruiters }
    });
  } catch (error) {
    console.error('Error in getPendingInvitations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Resend invitation
exports.resendInvitation = async (req, res) => {
  try {
    const { recruiterId } = req.params;

    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    // Generate new token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;

    recruiter.invitationToken = invitationToken;
    recruiter.invitationExpires = invitationExpires;
    await recruiter.save();

    // Send email
    const inviteLink = `http://localhost:3000/accept-invite/${invitationToken}`;
    await sendInvitationEmail(recruiter.email, recruiter.fullName, inviteLink);

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('Error in resendInvitation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Revoke invitation
exports.revokeInvitation = async (req, res) => {
  try {
    const { recruiterId } = req.params;

    const recruiter = await Recruiter.findByIdAndUpdate(
      recruiterId,
      {
        invitationStatus: 'revoked',
        invitationToken: null,
        invitationExpires: null,
        isInvited: false
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Invitation revoked successfully',
      data: { recruiter }
    });
  } catch (error) {
    console.error('Error in revokeInvitation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// RECRUITER MANAGEMENT
// ============================================

// Get all recruiters (active, pending, and inactive)
exports.getAllRecruiters = async (req, res) => {
  try {
    const company = await Company.findOne();

    const recruiters = await Recruiter.find({
      companyId: company._id,
      role: 'recruiter'
    })
      .select('-password -invitationToken -resetPasswordToken')
      .sort({ createdAt: -1 });

    // Add stats for each recruiter
    const recruitersWithStats = await Promise.all(recruiters.map(async (recruiter) => {
      const internships = await Internship.countDocuments({ postedBy: recruiter._id });
      const mentees = recruiter.mentorFor?.length || 0;

      return {
        ...recruiter.toObject(),
        stats: {
          totalInternships: internships,
          activeMentees: mentees
        }
      };
    }));

    // ✅ Active = accepted AND isActive = true
    const active = recruitersWithStats.filter(r =>
      r.invitationStatus === 'accepted' && r.isActive === true
    );

    // ✅ Pending = still pending invitation
    const pending = recruitersWithStats.filter(r =>
      r.invitationStatus === 'pending'
    );

    // ✅ NEW: Inactive = accepted but deactivated (isActive = false)
    const inactive = recruitersWithStats.filter(r =>
      r.invitationStatus === 'accepted' && r.isActive === false
    );

    console.log(`📊 Active: ${active.length}, Pending: ${pending.length}, Inactive: ${inactive.length}`);

    res.status(200).json({
      success: true,
      data: {
        active,
        pending,
        inactive,  // ✅ Now included in response
        total: recruiters.length
      }
    });
  } catch (error) {
    console.error('Error in getAllRecruiters:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single recruiter
exports.getRecruiterById = async (req, res) => {
  try {
    const { id } = req.params;

    const recruiter = await Recruiter.findById(id)
      .select('-password -invitationToken -resetPasswordToken')
      .populate('addedBy', 'fullName email')
      .populate('mentorFor', 'fullName email profilePicture');

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    // Get internship stats
    const internships = await Internship.find({ postedBy: id })
      .select('title status createdAt');

    res.status(200).json({
      success: true,
      data: {
        recruiter,
        internships
      }
    });
  } catch (error) {
    console.error('Error in getRecruiterById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update recruiter
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
    res.status(500).json({
      success: false,
      message: error.message
    });
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

    res.status(200).json({
      success: true,
      message: 'Recruiter deactivated successfully'
    });
  } catch (error) {
    console.error('Error in deactivateRecruiter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
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

    res.status(200).json({
      success: true,
      message: 'Recruiter activated successfully'
    });
  } catch (error) {
    console.error('Error in activateRecruiter:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// DASHBOARD & STATS
// ============================================

// Get HR Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const company = await Company.findOne();

    const [
      totalStudents,
      totalRecruiters,
      activeRecruiters,
      totalInternships,
      activeInternships,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      activeInterns,
      certificatesIssued
    ] = await Promise.all([
      Student.countDocuments(),
      Recruiter.countDocuments({ role: 'recruiter' }),
      Recruiter.countDocuments({ role: 'recruiter', isActive: true, invitationStatus: 'accepted' }),
      Internship.countDocuments(),
      Internship.countDocuments({ status: 'active' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'accepted' }),
      Application.countDocuments({ status: 'accepted' }),
      Certificate.countDocuments({ status: 'issued' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        company: {
          name: company?.name,
          stats: company?.stats
        },
        overview: {
          totalStudents,
          totalRecruiters,
          activeRecruiters,
          pendingInvites: totalRecruiters - activeRecruiters
        },
        internships: {
          total: totalInternships,
          active: activeInternships
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          accepted: acceptedApplications
        },
        interns: {
          active: activeInterns
        },
        certificates: {
          issued: certificatesIssued
        }
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Department Distribution
exports.getDepartmentDistribution = async (req, res) => {
  try {
    const distribution = await Internship.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          positions: { $sum: '$positions' },
          filled: { $sum: '$filledPositions' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: { distribution }
    });
  } catch (error) {
    console.error('Error in getDepartmentDistribution:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// ============================================
// RECENT ACTIVITY - FIXED VERSION
// ============================================
exports.getRecentActivity = async (req, res) => {
  try {
    const activities = [];

    // 1. Get recent recruiter invitations (last 7 days)
    const recentRecruiters = await Recruiter.find({
      role: 'recruiter',
      $or: [
        { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        { updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    })
      .select('fullName email department createdAt updatedAt invitationStatus isInvited')
      .sort({ updatedAt: -1 })
      .limit(10);

    recentRecruiters.forEach(recruiter => {
      // If they accepted recently (status changed to accepted)
      if (recruiter.invitationStatus === 'accepted') {
        activities.push({
          _id: recruiter._id,
          type: 'recruiter_accepted',
          title: 'Recruiter Joined',
          message: `${recruiter.fullName} accepted invitation and joined the team`,
          description: `${recruiter.fullName} accepted invitation and joined the team`,
          timestamp: recruiter.updatedAt, // Use updatedAt for acceptance time
          link: `/hr/recruiters/${recruiter._id}`,
          user: recruiter.fullName,
          isRead: false
        });
      }
      // If they were invited recently
      else if (recruiter.invitationStatus === 'pending' && recruiter.isInvited) {
        activities.push({
          _id: recruiter._id,
          type: 'recruiter_invited',
          title: 'Recruiter Invited',
          message: `${recruiter.fullName} was invited to join as ${recruiter.department || 'Recruiter'}`,
          description: `${recruiter.fullName} was invited to join as ${recruiter.department || 'Recruiter'}`,
          timestamp: recruiter.createdAt,
          link: `/hr/recruiters/${recruiter._id}`,
          user: recruiter.fullName,
          isRead: false
        });
      }
    });

    // 2. Get recent internship postings
    const recentInternships = await Internship.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .populate('postedBy', 'fullName department')
      .sort({ createdAt: -1 })
      .limit(5);

    recentInternships.forEach(internship => {
      activities.push({
        _id: internship._id,
        type: 'internship_posted',
        title: 'Internship Posted',
        message: `New ${internship.department || ''} internship posted by ${internship.postedBy?.fullName || 'a recruiter'}`,
        description: `New ${internship.department || ''} internship posted by ${internship.postedBy?.fullName || 'a recruiter'}`,
        timestamp: internship.createdAt,
        link: `/hr/internships/${internship._id}`,
        user: internship.postedBy?.fullName,
        isRead: false
      });
    });

    // 3. Get recent applications
    const recentApplications = await Application.find({
      appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .populate('studentId', 'fullName')
      .populate('internshipId', 'title department')
      .sort({ appliedAt: -1 })
      .limit(5);

    recentApplications.forEach(app => {
      activities.push({
        _id: app._id,
        type: 'application_received',
        title: 'New Application',
        message: `${app.studentId?.fullName || 'A student'} applied for ${app.internshipId?.title || 'an internship'}`,
        description: `${app.studentId?.fullName || 'A student'} applied for ${app.internshipId?.title || 'an internship'}`,
        timestamp: app.appliedAt,
        link: `/hr/applications/${app._id}`,
        user: app.studentId?.fullName,
        isRead: false
      });
    });

    // 4. Get recent certificate issuances
    const recentCertificates = await Certificate.find({
      issueDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .populate('studentId', 'fullName')
      .populate('internshipId', 'title')
      .sort({ issueDate: -1 })
      .limit(5);

    recentCertificates.forEach(cert => {
      activities.push({
        _id: cert._id,
        type: 'certificate_issued',
        title: 'Certificate Issued',
        message: `Certificate issued to ${cert.studentId?.fullName || 'a student'} for ${cert.internshipId?.title || 'internship'}`,
        description: `Certificate issued to ${cert.studentId?.fullName || 'a student'} for ${cert.internshipId?.title || 'internship'}`,
        timestamp: cert.issueDate,
        link: `/hr/certificates/${cert._id}`,
        user: cert.studentId?.fullName,
        isRead: false
      });
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return only the 15 most recent activities
    res.status(200).json({
      success: true,
      data: {
        activities: activities.slice(0, 15)
      }
    });

  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// ============================================
// INTERNSHIP VIEWS
// ============================================
exports.getAllInternships = async (req, res) => {
  try {
    const internships = await Internship.find({})
      .populate('postedBy', 'fullName email department')
      .populate('mentorId', 'fullName email department')
      .sort({ createdAt: -1 });

    // Add stats
    const internshipsWithStats = await Promise.all(internships.map(async (internship) => {
      const applications = await Application.find({ internshipId: internship._id });
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getInternshipById = async (req, res) => {
  const { internshipId } = req.params;
  try {
    const internship = await Internship.findById(internshipId)
      .populate('postedBy', 'fullName email department')
      .populate('mentorId', 'fullName email department');

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { internship }
    });
  } catch (error) {
    console.error('Error in getInternshipById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getInternshipApplications = async (req, res) => {
  const { internshipId } = req.params;
  try {
    const applications = await Application.find({ internshipId })
      .populate('studentId', 'fullName email profilePicture phone location skills currentEducation education')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    console.error('Error in getInternshipApplications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

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
      return res.status(404).json({
        success: false,
        message: 'Internship not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Internship status updated to ${status}`,
      data: { internship }
    });
  } catch (error) {
    console.error('Error in updateInternshipStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// APPLICATION VIEWS
// ============================================
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find({})
      .populate('studentId', 'fullName email education')
      .populate({
        path: 'internshipId',
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getApplicationById = async (req, res) => {
  const { applicationId } = req.params;
  try {
    const application = await Application.findById(applicationId)
      .populate('studentId')
      .populate('internshipId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { application }
    });
  } catch (error) {
    console.error('Error in getApplicationById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  const { applicationId } = req.params;
  try {
    const { status } = req.body;
    const application = await Application.findById(applicationId)
      .populate({
        path: 'internshipId',
        populate: { path: 'postedBy' }
      })
      .populate('studentId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      data: { application }
    });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// STUDENT MANAGEMENT
// ============================================
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .select('fullName email education skills currentInternship createdAt')
      .sort({ createdAt: -1 });

    // Add application stats for each student
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      const applications = await Application.find({ studentId: student._id })
        .populate('internshipId', 'title');
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStudentById = async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId)
      .select('-password')
      .populate('resume');  // ✅ ADD THIS - populates education, experience, projects, skills, certifications

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { student }
    });
  } catch (error) {
    console.error('Error in getStudentById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get student's applications
exports.getStudentApplications = async (req, res) => {
  const { studentId } = req.params;
  try {
    const applications = await Application.find({ studentId })
      .populate({
        path: 'internshipId',
        select: 'title department companyName status stipend location duration startDate'  // ✅ Added all relevant fields
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    console.error('Error in getStudentApplications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// INTERN TRACKING
// ============================================

// Get Active Interns
exports.getActiveInterns = async (req, res) => {
  try {
    const activeApplications = await Application.find({
      status: 'accepted'
    })
      .populate('studentId', 'fullName email profilePicture skills currentEducation')
      .populate({
        path: 'internshipId',
        select: 'title department startDate endDate duration',
        populate: {
          path: 'mentorId',
          select: 'fullName email'
        }
      })
      .sort({ updatedAt: -1 });

    // Get latest log for each intern
    const internsWithProgress = await Promise.all(activeApplications.map(async (app) => {
      const latestLog = await DailyLog.findOne({
        studentId: app.studentId._id,
        internshipId: app.internshipId._id
      }).sort({ date: -1 });

      // Calculate progress
      const startDate = new Date(app.internshipId.startDate);
      const endDate = new Date(app.internshipId.endDate);
      const now = new Date();

      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
      const progress = Math.min(Math.round((daysPassed / totalDays) * 100), 100);

      return {
        ...app.toObject(),
        progress,
        lastLog: latestLog ? {
          date: latestLog.date,
          status: latestLog.status,
          hours: latestLog.totalHours
        } : null
      };
    }));

    res.status(200).json({
      success: true,
      data: { interns: internsWithProgress }
    });
  } catch (error) {
    console.error('Error in getActiveInterns:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Active Interns Stats
exports.getActiveInternsStats = async (req, res) => {
  try {
    const activeInterns = await Application.find({
      status: 'accepted'  // Only 'accepted' status, not 'hired' or 'active'
    }).populate('internshipId');

    // Calculate REAL average progress
    let totalProgress = 0;
    const now = new Date();

    activeInterns.forEach(app => {
      if (app.internshipId?.startDate && app.internshipId?.endDate) {
        const start = new Date(app.internshipId.startDate);
        const end = new Date(app.internshipId.endDate);

        if (now < start) {
          // Not started yet
          totalProgress += 0;
        } else if (now > end) {
          // Already ended
          totalProgress += 100;
        } else {
          const totalDays = (end - start) / (1000 * 60 * 60 * 24);
          const daysPassed = (now - start) / (1000 * 60 * 60 * 24);
          const progress = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
          totalProgress += progress;
        }
      }
    });

    const averageProgress = activeInterns.length > 0
      ? Math.round(totalProgress / activeInterns.length)
      : 0;

    const now2 = new Date();
    const endingSoonLimit = new Date();
    endingSoonLimit.setDate(now2.getDate() + 15);

    const endingSoon = activeInterns.filter(i => {
      if (!i.internshipId?.endDate) return false;
      const endDate = new Date(i.internshipId.endDate);
      return endDate <= endingSoonLimit && endDate >= now2;
    }).length;

    res.status(200).json({
      success: true,
      data: {
        totalActive: activeInterns.length,
        currentlyOnline: 0, // This needs real-time tracking
        endingSoon,
        averageProgress  // ✅ Now shows REAL average
      }
    });
  } catch (error) {
    console.error('Error in getActiveInternsStats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Completed Interns
exports.getCompletedInterns = async (req, res) => {
  try {
    const completed = await Certificate.find({ status: 'issued' })
      .populate('studentId', 'fullName email profilePicture')
      .populate('internshipId', 'title department')
      .populate('issuedBy', 'fullName')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: { interns: completed }
    });
  } catch (error) {
    console.error('Error in getCompletedInterns:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Intern Progress
exports.getInternProgress = async (req, res) => {
  try {
    // Handle both parameter names
    const studentId = req.params.studentId || req.params.id;
    console.log('📡 Fetching progress for studentId:', studentId);
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const student = await Student.findById(studentId)
      .select('fullName email profilePicture currentEducation');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const application = await Application.findOne({
      studentId,
      status: 'accepted'
    }).populate({
      path: 'internshipId',
      populate: {
        path: 'mentorId',  // ✅ This populates the mentor
        select: 'fullName email department'  // ✅ Select the fields you want
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No active internship found'
      });
    }

    const logs = await DailyLog.find({
      studentId,
      internshipId: application.internshipId._id
    }).sort({ date: 1 });

    // Calculate stats
    const totalDays = application.internshipId.duration * 30 || 60;
    const completedDays = logs.filter(l => l.status === 'approved').length;
    const totalHours = logs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

    // Weekly breakdown
    const weeklyData = {};
    logs.forEach(log => {
      const week = log.weekNumber || 1;
      if (!weeklyData[week]) {
        weeklyData[week] = { hours: 0, tasks: 0 };
      }
      weeklyData[week].hours += log.totalHours || 0;
      weeklyData[week].tasks += log.tasksCompleted?.length || 0;
    });

    console.log('✅ Application found with mentor:', application.internshipId?.mentorId);

    res.status(200).json({
      success: true,
      data: {
        student,
        internship: application.internshipId,
        logs,
        stats: {
          totalDays,
          completedDays,
          progress: Math.min(Math.round((completedDays / totalDays) * 100), 100),
          totalHours,
          averageHours: logs.length > 0 ? (totalHours / logs.length).toFixed(1) : 0
        },
        weeklyBreakdown: weeklyData
      }
    });
  } catch (error) {
    console.error('Error in getInternProgress:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// CERTIFICATE MANAGEMENT
// ============================================
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get eligible students for certificates
exports.getEligibleStudents = async (req, res) => {
  try {
    // Students who have COMPLETED their internship (status = 'completed')
    const completedApplications = await Application.find({
      status: 'completed'  // ✅ Changed from 'accepted' to 'completed'
    })
      .populate('studentId', 'fullName profilePicture email')
      .populate({
        path: 'internshipId',
        select: 'title department postedBy startDate endDate',
        populate: {
          path: 'postedBy',
          select: 'fullName'
        }
      });

    // Filter out those who already have a certificate
    const eligible = [];
    for (const app of completedApplications) {
      const certExists = await Certificate.findOne({
        applicationId: app._id,
        status: 'issued'
      });
      if (!certExists) {
        eligible.push(app);
      }
    }

    console.log(`✅ Eligible students: ${eligible.length} (from ${completedApplications.length} completed internships)`);

    res.status(200).json({
      success: true,
      data: { eligible }
    });
  } catch (error) {
    console.error('Error in getEligibleStudents:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

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
      studentId,
      internshipId,
      applicationId,
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const hrId = req.user.id;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findOne({
      $or: [
        { _id: id },
        { certificateId: id }
      ]
    })
      .populate('studentId', 'fullName email')
      .populate('internshipId', 'title department')
      .populate('issuedBy', 'fullName designation');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        valid: certificate.status === 'issued',
        certificate,
        student: certificate.studentId,
        internship: certificate.internshipId,
        issuedBy: certificate.issuedBy
      }
    });
  } catch (error) {
    console.error('Error in verifyCertificate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// REPORTS
// ============================================
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
        conversionRate: placementRate
      }
    });
  } catch (error) {
    console.error('Error in getReportsStats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

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
    console.error('Error in getReportsTrends:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getReportsConversion = async (req, res) => {
  try {
    const totalApps = await Application.countDocuments();
    const totalHired = await Application.countDocuments({ status: 'accepted' });
    const interviewOffers = await Application.countDocuments({ status: 'shortlisted' });

    const applicationToHire = totalApps > 0 ? ((totalHired / totalApps) * 100).toFixed(1) : 0;
    const interviewToOffer = interviewOffers > 0 ? ((totalHired / interviewOffers) * 100).toFixed(1) : 0;

    // Get ALL departments from the Company collection (8 departments)
    const company = await Company.findOne();
    const allDepartments = company?.departments?.map(d => d.name) || [
      'Frontend', 'Backend', 'DevOps', 'Marketing', 'HR', 'Sales', 'UI/UX', 'Mobile'
    ];

    // Get application stats per department
    const deptStats = await Application.aggregate([
      {
        $lookup: {
          from: 'internships',
          localField: 'internshipId',
          foreignField: '_id',
          as: 'internship'
        }
      },
      { $unwind: '$internship' },
      {
        $group: {
          _id: '$internship.department',
          totalApps: { $sum: 1 },
          totalHired: {
            $sum: {
              $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Create a map of department stats
    const statsMap = {};
    deptStats.forEach(stat => {
      statsMap[stat._id] = {
        totalApps: stat.totalApps,
        totalHired: stat.totalHired
      };
    });

    // Build departmentWise array for ALL 8 departments
    const departmentWise = allDepartments.map(dept => {
      const stats = statsMap[dept] || { totalApps: 0, totalHired: 0 };
      return {
        department: dept,
        totalApps: stats.totalApps,
        totalHired: stats.totalHired,
        conversion: stats.totalApps > 0
          ? Number(((stats.totalHired / stats.totalApps) * 100).toFixed(1))
          : 0
      };
    }).sort((a, b) => b.conversion - a.conversion); // Sort by conversion rate

    console.log('✅ All 8 Departments:', JSON.stringify(departmentWise, null, 2));

    res.status(200).json({
      success: true,
      data: {
        applicationToHire,
        interviewToOffer,
        departmentWise
      }
    });
  } catch (error) {
    console.error('Error in getReportsConversion:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// PUBLIC CERTIFICATE VERIFICATION
// ============================================
exports.verifyCertificatePublic = async (req, res) => {
  try {
    const { id } = req.params;

    // Find certificate by ID or certificateId
    const certificate = await Certificate.findOne({
      $or: [
        { _id: id },
        { certificateId: id }
      ]
    })
      .populate('studentId', 'fullName email')
      .populate('internshipId', 'title department')
      .populate('issuedBy', 'fullName designation');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if certificate is valid (not revoked)
    if (certificate.status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: 'Certificate has been revoked or is not valid'
      });
    }

    // Return public verification data
    res.status(200).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentId.fullName,
        internshipTitle: certificate.internshipId.title,
        department: certificate.internshipId.department,
        issueDate: certificate.issueDate,
        grade: certificate.grade,
        issuedBy: certificate.issuedBy.fullName,
        issuedByDesignation: certificate.issuedBy.designation,
        isValid: true
      }
    });
  } catch (error) {
    console.error('Error in verifyCertificatePublic:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark intern as complete
exports.markInternComplete = async (req, res) => {
  try {
    const { internId } = req.params;
    const hrId = req.user.id;
    
    // Find the application
    const application = await Application.findById(internId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found'
      });
    }

    // Check if already completed
    if (application.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Intern is already marked as completed'
      });
    }

    // Check if it's in accepted status
    if (application.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only accepted interns can be marked as completed'
      });
    }

    // Update status
    application.status = 'completed';
    
    // Add to timeline manually
    if (!application.timeline) {
      application.timeline = [];
    }
    
    application.timeline.push({
      status: 'completed',
      comment: 'Internship completed successfully',
      updatedAt: new Date(),
      updatedBy: hrId
    });
    
    // Save the application
    await application.save();

    // Update internship filled positions
    const internship = await Internship.findById(application.internshipId);
    if (internship && internship.filledPositions > 0) {
      internship.filledPositions = Math.max(0, internship.filledPositions - 1);
      await internship.save();
    }

    console.log(`✅ Intern ${application._id} marked as completed`);

    res.status(200).json({
      success: true,
      message: 'Intern marked as completed successfully'
    });
  } catch (error) {
    console.error('Error marking intern as complete:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};