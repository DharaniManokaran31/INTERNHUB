const Application = require("../models/Application");
const Internship = require("../models/Internship");
const Student = require("../models/Student");

// ----------------------
// Apply to an internship
// ----------------------
const applyToInternship = async (req, res) => {
  try {
    const { studentId, internshipId } = req.body;

    // Validate input
    if (!studentId || !internshipId) {
      return res.status(400).json({ message: "studentId and internshipId are required" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if internship exists
    const internship = await Internship.findById(internshipId);
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

    // Create application
    const application = new Application({
      student: studentId,
      internship: internshipId,
    });

    const savedApplication = await application.save();

    res.status(201).json({
      message: "Application submitted successfully",
      application: savedApplication,
    });
  } catch (error) {
    console.error("Error in applyToInternship:", error);
    res.status(500).json({ message: "Internal server error while applying" });
  }
};

// ----------------------
// View all applications of a student
// ----------------------
const getStudentApplications = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch applications
    const applications = await Application.find({ student: studentId })
      .populate(
        "internship",
        "title companyName location type stipend duration description skillsRequired deadline"
      )
      .sort({ appliedAt: -1 });

    // Add expired flag for frontend
    const today = new Date();
    const applicationsWithStatus = applications.map((app) => {
      const deadline = app.internship.deadline ? new Date(app.internship.deadline) : null;
      return {
        ...app._doc,
        internship: {
          ...app.internship._doc,
          expired: deadline ? today > deadline : false,
        },
      };
    });

    res.status(200).json({
      student: student.fullName,
      applications: applicationsWithStatus,
    });
  } catch (error) {
    console.error("Error in getStudentApplications:", error);
    res.status(500).json({ message: "Internal server error while fetching applications" });
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

module.exports = { applyToInternship, getStudentApplications, getMyApplications };
