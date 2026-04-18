// backend/controllers/applicationController.js
const Application = require("../models/Application");
const Internship = require("../models/Internship");
const Student = require("../models/Student");
const Recruiter = require("../models/Recruiter");
const Notification = require("../models/Notification");
const { sendApplicationStatusEmail } = require("../services/emailService");
const { checkAndCloseInternship } = require("./internshipController"); // ✅ IMPORT helper

// ----------------------
// Apply to Internship
// ----------------------
exports.applyToInternship = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { internshipId, coverLetter } = req.body;

    if (!internshipId) {
      return res.status(400).json({ 
        success: false,
        message: "Internship ID is required" 
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }

    // Check if student has resume
    if (!student.resume || !student.resume.resumeFile) {
      return res.status(400).json({
        success: false,
        message: "Please upload your resume before applying"
      });
    }

    // Check internship
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Check deadline
    if (internship.deadline && new Date() > new Date(internship.deadline)) {
      return res.status(400).json({ 
        success: false,
        message: "Application deadline has passed" 
      });
    }

    // Check if positions available
    if (internship.filledPositions >= internship.positions) {
      return res.status(400).json({ 
        success: false,
        message: "All positions for this internship have been filled" 
      });
    }

    // Check if already accepted to an internship (Collision Prevention)
    const acceptedApplication = await Application.findOne({
      studentId,
      status: 'accepted'
    });

    if (acceptedApplication) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to new internships because you have already been accepted into one."
      });
    }

    // Prevent duplicate
    const existingApplication = await Application.findOne({
      studentId,
      internshipId
    });

    if (existingApplication) {
      return res.status(400).json({ 
        success: false,
        message: "You have already applied to this internship" 
      });
    }

    // Get student's certificates
    const studentCertificates = (student.resume?.certifications || [])
      .filter(cert => cert.certificateUrl)
      .map(cert => ({
        name: cert.name || 'Certificate',
        url: cert.certificateUrl,
        fileName: cert.certificateUrl.split('/').pop() || 'certificate.pdf',
        uploadedAt: cert.updatedAt || new Date()
      }));

    // Create application
    const application = new Application({
      studentId,
      internshipId,
      recruiterId: internship.mentorId,
      coverLetter: coverLetter || '',
      submittedResume: {
        url: student.resume.resumeFile,
        fileName: student.resume.resumeFileName || 'resume.pdf',
        fileSize: 0,
        uploadedAt: student.resume.lastUpdated || new Date()
      },
      submittedCertificates: studentCertificates,
      status: 'pending',
      timeline: [{
        status: 'pending',
        comment: 'Application submitted',
        updatedAt: new Date(),
        updatedBy: studentId
      }]
    });

    const savedApplication = await application.save();

    // Update internship application count
    internship.applicationCount += 1;
    await internship.save();

    // Create notification for recruiter
    if (internship.mentorId) {
      await Notification.create({
        recipientId: internship.mentorId,
        recipientModel: 'Recruiter',
        type: 'application_received',
        title: 'New Application Received',
        message: `${student.fullName} applied for ${internship.title}`,
        data: {
          applicationId: savedApplication._id,
          internshipId: internship._id,
          internshipTitle: internship.title,
          studentId: student._id,
          studentName: student.fullName
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: { application: savedApplication }
    });
  } catch (error) {
    console.error("Error in applyToInternship:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get My Applications (Student)
// ----------------------
exports.getMyApplications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const applications = await Application.find({ studentId })
      .populate({
        path: 'internshipId',
        select: 'title companyName department workMode location stipend duration startDate endDate deadline'
      })
      .populate('recruiterId', 'fullName department')
      .sort({ appliedAt: -1 });

    // Add status flags
    const now = new Date();
    const applicationsWithFlags = applications.map(app => {
      const appObj = app.toObject();
      appObj.isDeadlinePassed = app.internshipId?.deadline ? 
        new Date(app.internshipId.deadline) < now : false;
      return appObj;
    });

    res.status(200).json({
      success: true,
      data: { applications: applicationsWithFlags }
    });
  } catch (error) {
    console.error("Error in getMyApplications:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Applications for Internship (Recruiter/HR)
// ----------------------
exports.getInternshipApplications = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check internship exists
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found"
      });
    }

    // Check permission
    if (userRole !== 'hr' && internship.mentorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view these applications"
      });
    }

    const applications = await Application.find({ internshipId })
      .populate('studentId', 'fullName email profilePicture phone location skills currentEducation')
      .sort({ appliedAt: -1 });

    // Format response
    const formattedApplications = applications.map(app => ({
      id: app._id,
      student: app.studentId ? {
        id: app.studentId._id,
        name: app.studentId.fullName,
        email: app.studentId.email,
        profilePicture: app.studentId.profilePicture,
        phone: app.studentId.phone,
        location: app.studentId.location,
        skills: app.studentId.skills || [],
        education: app.studentId.currentEducation
      } : null,
      status: app.status,
      appliedAt: app.appliedAt,
      coverLetter: app.coverLetter,
      hasResume: !!app.submittedResume?.url,
      hasCertificates: app.submittedCertificates?.length > 0
    }));

    // Calculate stats
    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      accepted: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    };

    res.status(200).json({
      success: true,
      data: {
        internship: {
          id: internship._id,
          title: internship.title,
          department: internship.department,
          positions: internship.positions,
          filled: internship.filledPositions
        },
        stats,
        applications: formattedApplications
      }
    });
  } catch (error) {
    console.error("Error in getInternshipApplications:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Application by ID
// ----------------------
exports.getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const application = await Application.findById(applicationId)
      .populate('studentId', 'fullName email profilePicture phone location education skills resume')
      .populate('internshipId', 'title department companyName workMode location startDate endDate')
      .populate('recruiterId', 'fullName department')
      .populate('timeline.updatedBy', 'fullName');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check permission
    const isStudent = userRole === 'student' && application.studentId._id.toString() === userId;
    const isRecruiter = userRole === 'recruiter' && application.recruiterId?._id.toString() === userId;
    const isHR = userRole === 'hr';

    if (!isStudent && !isRecruiter && !isHR) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this application"
      });
    }

    // Add full URLs
    const appObj = application.toObject();
    
    if (appObj.submittedResume?.url) {
      appObj.submittedResume.url = `${req.protocol}://${req.get('host')}${appObj.submittedResume.url}`;
    }
    
    if (appObj.submittedCertificates) {
      appObj.submittedCertificates = appObj.submittedCertificates.map(cert => ({
        ...cert,
        url: cert.url ? `${req.protocol}://${req.get('host')}${cert.url}` : null
      }));
    }

    if (appObj.studentId?.resume?.resumeFile) {
      appObj.studentId.resume.resumeUrl = `${req.protocol}://${req.get('host')}${appObj.studentId.resume.resumeFile}`;
    }

    res.status(200).json({
      success: true,
      data: { application: appObj }
    });
  } catch (error) {
    console.error("Error in getApplicationById:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Update Application Status
// ----------------------
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, comment } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate status
    const validStatuses = ['pending', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const application = await Application.findById(applicationId)
      .populate('studentId')
      .populate('internshipId')
      .populate('recruiterId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check permission
    const isRecruiter = userRole === 'recruiter' && application.recruiterId?._id.toString() === userId;
    const isHR = userRole === 'hr';

    if (!isRecruiter && !isHR) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this application"
      });
    }

    const oldStatus = application.status;
    
    // Only update and push to timeline if status changed
    if (oldStatus !== status) {
      application.status = status;
      // Add timeline entry
      application.timeline.push({
        status,
        comment: comment || `Application status changed to ${status}`,
        updatedAt: new Date(),
        updatedBy: userId
      });
    }

    await application.save();

    // If accepted, update internship filled positions and set up mentoring
    if (status === 'accepted' && oldStatus !== 'accepted') {
      const internship = await Internship.findById(application.internshipId);
      if (internship) {
        internship.filledPositions += 1;
        if (internship.filledPositions >= internship.positions) {
          internship.status = 'closed';
        }
        await internship.save();

        // ✅ Use helper method to check if internship should auto-close
        await checkAndCloseInternship(internship._id);

        // Add student to recruiter's mentor list
        await Recruiter.findByIdAndUpdate(application.recruiterId, {
          $addToSet: { mentorFor: application.studentId._id }
        });

        // Update student's current internship
        await Student.findByIdAndUpdate(application.studentId._id, {
          currentInternship: internship._id
        });

        // 🚀 COLLISION PREVENTION: Auto-withdraw all other pending/shortlisted applications
        const otherApplications = await Application.find({
          studentId: application.studentId._id,
          _id: { $ne: application._id },
          status: { $in: ['pending', 'shortlisted'] }
        }).populate('internshipId');

        for (const otherApp of otherApplications) {
          otherApp.status = 'rejected';
          otherApp.timeline.push({
            status: 'rejected',
            comment: 'Auto-withdrawn: Student was accepted into another internship role.',
            updatedAt: new Date(),
            updatedBy: userId
          });
          await otherApp.save();

          await Notification.create({
            recipientId: application.studentId._id,
            recipientModel: 'Student',
            type: 'application_status_change',
            title: `Application Auto-Withdrawn`,
            message: `Your application for ${otherApp.internshipId.title} was removed because you were accepted into another role.`,
            data: {
              applicationId: otherApp._id,
              internshipId: otherApp.internshipId._id,
              internshipTitle: otherApp.internshipId.title,
              status: 'rejected'
            }
          });
        }
      }
    }

    // Send email notification
    try {
      await sendApplicationStatusEmail(
        application.studentId.email,
        application.studentId.fullName,
        application.internshipId.title,
        status,
        comment,
        application._id
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Create notification for student
    await Notification.create({
      recipientId: application.studentId._id,
      recipientModel: 'Student',
      type: 'application_status_change',
      title: `Application ${status}`,
      message: `Your application for ${application.internshipId.title} has been ${status}`,
      data: {
        applicationId: application._id,
        internshipId: application.internshipId._id,
        internshipTitle: application.internshipId.title,
        status
      }
    });

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: { application }
    });
  } catch (error) {
    console.error("Error in updateApplicationStatus:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Add Note to Application
// ----------------------
exports.addApplicationNote = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { note } = req.body;
    const userId = req.user.id;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: "Note is required"
      });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    application.recruiterNotes.push({
      note,
      addedAt: new Date(),
      addedBy: userId
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: { notes: application.recruiterNotes }
    });
  } catch (error) {
    console.error("Error in addApplicationNote:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Funnel Stats for Internship
// ----------------------
exports.getInternshipFunnelStats = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const mongoose = require('mongoose');

    const stats = await Application.aggregate([
      { $match: { internshipId: new mongoose.Types.ObjectId(internshipId) } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const funnel = {
      total: 0,
      pending: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      funnel[stat._id] = stat.count;
      funnel.total += stat.count;
    });

    // Calculate conversion rates
    if (funnel.total > 0) {
      funnel.shortlistRate = Math.round((funnel.shortlisted / funnel.total) * 100);
      funnel.acceptanceRate = Math.round((funnel.accepted / funnel.total) * 100);
    }

    res.status(200).json({
      success: true,
      data: funnel
    });
  } catch (error) {
    console.error("Error in getInternshipFunnelStats:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Recommend Certificate
// ----------------------
exports.recommendCertificate = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { feedback } = req.body;
    const userId = req.user.id;

    const application = await Application.findById(applicationId)
      .populate('internshipId')
      .populate('studentId');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check if application is accepted
    if (application.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: "Only accepted applications can be recommended for certification"
      });
    }

    application.certificateRecommended = true;
    application.certificationFeedback = feedback || '';
    await application.save();

    // Notify HR
    const hrs = await Recruiter.find({ role: 'hr' });
    for (const hr of hrs) {
      await Notification.create({
        recipientId: hr._id,
        recipientModel: 'Recruiter',
        type: 'certificate_recommendation',
        title: 'Certificate Recommendation',
        message: `${application.studentId.fullName} has been recommended for certification`,
        data: {
          applicationId: application._id,
          studentId: application.studentId._id,
          studentName: application.studentId.fullName,
          internshipTitle: application.internshipId.title
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Certificate recommendation submitted"
    });
  } catch (error) {
    console.error("Error in recommendCertificate:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Recruiter Application Stats
// ----------------------
exports.getRecruiterApplicationStats = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    console.log('🔍 Getting application stats for recruiter:', recruiterId);

    // First, get all internships posted by this recruiter
    const internships = await Internship.find({ postedBy: recruiterId }).select('_id');
    const internshipIds = internships.map(internship => internship._id);

    if (internshipIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalApplications: 0,
          shortlisted: 0,
          hired: 0,
          pending: 0,
          rejected: 0
        }
      });
    }

    // Get all applications for these internships
    const applications = await Application.find({
      internshipId: { $in: internshipIds }
    });

    // Calculate stats
    const stats = {
      totalApplications: applications.length,
      shortlisted: applications.filter(app => app.status === 'shortlisted').length,
      hired: applications.filter(app => app.status === 'accepted').length,
      pending: applications.filter(app => app.status === 'pending').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };

    console.log('✅ Recruiter stats calculated:', stats);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error in getRecruiterApplicationStats:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Recruiter Recent Applications
// ----------------------
exports.getRecruiterRecentApplications = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    console.log('🔍 Getting recent applications for recruiter:', recruiterId);

    // First, get all internships posted by this recruiter
    const internships = await Internship.find({ postedBy: recruiterId }).select('_id title');
    const internshipIds = internships.map(internship => internship._id);

    if (internshipIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          applications: []
        }
      });
    }

    // Get recent applications with student details and internship details
    const applications = await Application.find({
      internshipId: { $in: internshipIds }
    })
      .populate('studentId', 'fullName email profilePicture')
      .populate('internshipId', 'title department location')
      .sort({ appliedAt: -1 })
      .limit(limit);

    console.log(`✅ Found ${applications.length} recent applications`);

    res.status(200).json({
      success: true,
      data: {
        applications: applications
      }
    });
  } catch (error) {
    console.error("Error in getRecruiterRecentApplications:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};