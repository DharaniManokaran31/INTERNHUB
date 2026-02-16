const Application = require("../models/Application");
const Internship = require("../models/Internship");
const Student = require("../models/Student");
const { createNotification } = require('./notificationController');

// ----------------------
// Apply to an internship
// ----------------------
const applyToInternship = async (req, res) => {
  try {
    const { studentId, internshipId, coverLetter } = req.body;

    // Validate input
    if (!studentId || !internshipId) {
      return res.status(400).json({ message: "studentId and internshipId are required" });
    }

    // Check if student exists and get their resume data
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student has a resume uploaded
    if (!student.resume || !student.resume.resumeFile) {
      return res.status(400).json({
        message: "Please upload your resume before applying"
      });
    }

    // Check if internship exists AND populate the recruiter who posted it
    const internship = await Internship.findById(internshipId).populate('postedBy');
    if (!internship) {
      return res.status(404).json({ message: "Internship not found" });
    }

    // Check if deadline has passed
    if (internship.deadline && new Date() > new Date(internship.deadline)) {
      return res.status(400).json({ message: "Cannot apply. Internship deadline has passed." });
    }

    // Prevent duplicate application
    const existingApplication = await Application.findOne({
      student: studentId,
      internship: internshipId,
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied to this internship" });
    }

    // Get student's certificates if any
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
      student: studentId,
      internship: internshipId,
      coverLetter: coverLetter || '',
      submittedResume: {
        url: student.resume.resumeFile,
        fileName: student.resume.resumeFileName || 'resume.pdf',
        uploadedAt: student.resume.lastUpdated || new Date()
      },
      submittedCertificates: studentCertificates,
      resumeVersion: student.resume.lastUpdated?.toString() || null
    });

    const savedApplication = await application.save();

    // ✅ CREATE NOTIFICATION FOR RECRUITER
    if (internship.postedBy) {
      try {
        const notificationResult = await createNotification({
          recipient: internship.postedBy._id,
          recipientModel: 'Recruiter',
          type: 'application_received',
          title: 'New Application Received',
          message: `${student.fullName} applied for ${internship.title}`,
          data: {
            applicationId: savedApplication._id,
            internshipId: internship._id,
            internshipTitle: internship.title,
            studentId: student._id,
            studentName: student.fullName,
            hasCoverLetter: !!coverLetter
          }
        });

      } catch (notifError) {
        console.error('❌ Error creating notification:', notifError);
      }
    } else {
      console.log('❌ No recruiter found for this internship - notification skipped');
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: savedApplication,
    });
  } catch (error) {
    console.error("❌ Error in applyToInternship:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while applying"
    });
  }
};

// ----------------------
// View all applications of a student
// ----------------------
const getStudentApplications = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId is required"
      });
    }

    // Fetch applications with internship details
    const applications = await Application.find({ student: studentId })
      .populate({
        path: 'internship',
        select: 'title companyName'
      })
      .sort({ appliedAt: -1 });

    // Format applications for frontend
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      status: app.status,
      appliedAt: app.appliedAt,
      internship: app.internship ? {
        _id: app.internship._id,
        title: app.internship.title,
        companyName: app.internship.companyName
      } : null
    }));

    // Send response in the format frontend expects
    res.status(200).json({
      success: true,
      applications: formattedApplications  // Direct array, not nested in data
    });

  } catch (error) {
    console.error("Error in getStudentApplications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching applications"
    });
  }
};

// ----------------------
// Get MY applications (from auth token)
// ----------------------
const getMyApplications = async (req, res) => {
  try {
    // Get student ID from the auth token (set by authMiddleware)
    const studentId = req.user.id;

    console.log('🔍 Getting applications for student ID from token:', studentId);

    // Fetch applications
    const applications = await Application.find({ student: studentId })
      .populate(
        "internship",
        "title companyName location type stipend duration description skillsRequired deadline"
      )
      .sort({ appliedAt: -1 });

    console.log(`🔍 Found ${applications.length} applications`);

    // Add expired flag for frontend
    const today = new Date();
    const applicationsWithStatus = applications.map((app) => {
      const deadline = app.internship?.deadline ? new Date(app.internship.deadline) : null;
      return {
        ...app._doc,
        internship: {
          ...app.internship?._doc,
          expired: deadline ? today > deadline : false,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        applications: applicationsWithStatus
      }
    });
  } catch (error) {
    console.error("Error in getMyApplications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching applications"
    });
  }
};

// =============== NEW RECRUITER FUNCTIONS ===============

// ----------------------
// Get recruiter's application stats
// ----------------------
const getRecruiterApplicationStats = async (req, res) => {
  try {
    const recruiterId = req.user.id; // From auth middleware

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
      internship: { $in: internshipIds }
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
      message: "Internal server error while fetching application stats"
    });
  }
};

// ----------------------
// Get recent applications for recruiter
// ----------------------
const getRecruiterRecentApplications = async (req, res) => {
  try {
    const recruiterId = req.user.id; // From auth middleware
    const limit = parseInt(req.query.limit) || 5; // Default to 5 recent applications

    console.log('🔍 Getting recent applications for recruiter:', recruiterId);

    // First, get all internships posted by this recruiter
    const internships = await Internship.find({ postedBy: recruiterId }).select('_id title companyName');
    const internshipIds = internships.map(internship => internship._id);

    if (internshipIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          applications: []
        }
      });
    }

    // Create a map of internship titles for quick lookup
    const internshipMap = {};
    internships.forEach(internship => {
      internshipMap[internship._id.toString()] = {
        title: internship.title,
        companyName: internship.companyName
      };
    });

    // Get recent applications with student details
    const applications = await Application.find({
      internship: { $in: internshipIds }
    })
      .populate('student', 'fullName email profilePicture')
      .sort({ appliedAt: -1 })
      .limit(limit);

    // Format the response
    const formattedApplications = applications.map(app => ({
      id: app._id,
      studentName: app.student?.fullName || 'Unknown Student',
      studentEmail: app.student?.email,
      studentId: app.student?._id,
      internshipId: app.internship,
      internshipTitle: internshipMap[app.internship.toString()]?.title || 'Unknown Internship',
      companyName: internshipMap[app.internship.toString()]?.companyName || '',
      status: app.status,
      appliedDate: app.appliedAt,
      appliedAt: app.appliedAt
    }));

    console.log(`✅ Found ${formattedApplications.length} recent applications`);

    res.status(200).json({
      success: true,
      data: {
        applications: formattedApplications
      }
    });
  } catch (error) {
    console.error("Error in getRecruiterRecentApplications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching recent applications"
    });
  }
};

// ----------------------
// Get all applications for a specific internship
// ----------------------
const getInternshipApplications = async (req, res) => {
  try {
    const recruiterId = req.user.id; // From auth middleware
    const { internshipId } = req.params;

    console.log(`🔍 Getting applications for internship ${internshipId} by recruiter ${recruiterId}`);

    // Verify the internship belongs to this recruiter
    const internship = await Internship.findOne({
      _id: internshipId,
      postedBy: recruiterId
    });

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: "Internship not found or you don't have permission to view it"
      });
    }

    // Get applications with student details
    const applications = await Application.find({ internship: internshipId })
      .populate('student', 'fullName email profilePicture phone location skills resume')
      .sort({ appliedAt: -1 });

    // Format the response
    const formattedApplications = applications.map(app => ({
      id: app._id,
      student: {
        id: app.student?._id,
        name: app.student?.fullName || 'Unknown Student',
        email: app.student?.email,
        profilePicture: app.student?.profilePicture,
        phone: app.student?.phone,
        location: app.student?.location,
        skills: app.student?.skills || []
      },
      status: app.status,
      appliedDate: app.appliedAt,
      appliedAt: app.appliedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        internship: {
          id: internship._id,
          title: internship.title,
          companyName: internship.companyName
        },
        applications: formattedApplications,
        stats: {
          total: applications.length,
          pending: applications.filter(app => app.status === 'pending').length,
          shortlisted: applications.filter(app => app.status === 'shortlisted').length,
          accepted: applications.filter(app => app.status === 'accepted').length,
          rejected: applications.filter(app => app.status === 'rejected').length
        }
      }
    });
  } catch (error) {
    console.error("Error in getInternshipApplications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching internship applications"
    });
  }
};

// ----------------------
// Update application status (shortlist/reject/accept)
// ----------------------
const updateApplicationStatus = async (req, res) => {
  try {
    const recruiterId = req.user.id; // From auth middleware
    const { applicationId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: pending, shortlisted, rejected, accepted"
      });
    }

    console.log(`🔍 Updating application ${applicationId} to status: ${status}`);

    // Find the application and check if the internship belongs to this recruiter
    const application = await Application.findById(applicationId)
      .populate({
        path: 'internship',
        populate: {
          path: 'postedBy'
        }
      })
      .populate('student');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check if internship exists and belongs to recruiter
    if (!application.internship || application.internship.postedBy._id.toString() !== recruiterId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this application"
      });
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    // ✅ CREATE NOTIFICATION FOR STUDENT
    if (application.student) {
      let title, message;

      switch (status) {
        case 'shortlisted':
          title = 'Application Shortlisted!';
          message = `Your application for ${application.internship.title} has been shortlisted`;
          break;
        case 'accepted':
          title = 'Congratulations! Application Accepted';
          message = `You have been selected for ${application.internship.title}`;
          break;
        case 'rejected':
          title = 'Application Update';
          message = `Your application for ${application.internship.title} was not selected`;
          break;
        default:
          title = 'Application Status Updated';
          message = `Your application for ${application.internship.title} is now ${status}`;
      }

      await createNotification({
        recipient: application.student._id,
        recipientModel: 'Student',
        type: 'application_status_change',
        title: title,
        message: message,
        data: {
          applicationId: application._id,
          internshipId: application.internship._id,
          internshipTitle: application.internship.title,
          oldStatus,
          newStatus: status
        }
      });
    }

    console.log(`✅ Application ${applicationId} updated to ${status}`);

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: {
        application: {
          id: application._id,
          status: application.status,
          updatedAt: application.updatedAt
        }
      }
    });
  } catch (error) {
    console.error("Error in updateApplicationStatus:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating application status"
    });
  }
};

module.exports = {
  applyToInternship,
  getStudentApplications,
  getMyApplications,
  // New exports
  getRecruiterApplicationStats,
  getRecruiterRecentApplications,
  getInternshipApplications,
  updateApplicationStatus
};