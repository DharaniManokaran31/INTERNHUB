const path = require('path');
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail } = require("../services/emailService");
const fs = require("fs");

// ----------------------
// Register Student
// ----------------------
exports.registerStudent = async (req, res) => {
  try {
    const { fullName, email, password, role, education } = req.body;

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new Student({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'student',
      education: education || {
        college: '',
        department: '',
        yearOfStudy: '1st Year',
        course: '',
        specialization: ''
      }
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please sign in.",
      data: {
        user: {
          id: newStudent._id,
          fullName: newStudent.fullName,
          email: newStudent.email,
          role: newStudent.role
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Login Student
// ----------------------
exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: student._id,
        email: student.email,
        role: student.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Generate full URLs for files
    let resumeUrl = null;
    if (student.resume?.resumeFile) {
      resumeUrl = `${req.protocol}://${req.get('host')}${student.resume.resumeFile}`;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: student._id,
          fullName: student.fullName,
          email: student.email,
          role: student.role,
          education: student.education || {
            college: '',
            department: '',
            yearOfStudy: '1st Year',
            course: '',
            specialization: ''
          },
          linkedin: student.linkedin || "",
          github: student.github || "",
          portfolio: student.portfolio || "",
          profilePicture: student.profilePicture || "",
          resume: student.resume || {},
          resumeUrl: resumeUrl || ""
        },
        token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Student Profile
// ----------------------
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!student.education) {
      student.education = {
        college: '',
        department: '',
        yearOfStudy: '1st Year',
        course: '',
        specialization: ''
      };
    }

    // Generate full URLs for files
    const studentObj = student.toObject();
    if (studentObj.resume?.resumeFile) {
      studentObj.resume.resumeUrl = `${req.protocol}://${req.get('host')}${studentObj.resume.resumeFile}`;
    }
    
    // Generate full URLs for certificate files
    if (studentObj.resume?.certifications) {
      studentObj.resume.certifications = studentObj.resume.certifications.map(cert => ({
        ...cert,
        certificateUrl: cert.certificateUrl ? `${req.protocol}://${req.get('host')}${cert.certificateUrl}` : null
      }));
    }

    res.status(200).json({
      success: true,
      data: { student: studentObj }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Update Student Profile
// ----------------------
exports.updateStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const {
      fullName,
      education,
      linkedin,
      github,
      portfolio,
      phone,
      location,
      profilePicture,
    } = req.body;

    if (fullName) student.fullName = fullName;

    if (education) {
      student.education = {
        college: education.college || student.education?.college || '',
        department: education.department || student.education?.department || '',
        yearOfStudy: education.yearOfStudy || student.education?.yearOfStudy || '1st Year',
        course: education.course || student.education?.course || '',
        specialization: education.specialization || student.education?.specialization || ''
      };
    }

    if (linkedin) student.linkedin = linkedin;
    if (github) student.github = github;
    if (portfolio) student.portfolio = portfolio;
    if (phone) student.phone = phone;
    if (location) student.location = location;
    if (profilePicture) student.profilePicture = profilePicture;

    await student.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { student }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Update Resume Details (Text only)
// ----------------------
exports.updateResume = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { education, experience, projects, skills, certifications } = req.body;

    if (!student.resume) student.resume = {};

    if (education !== undefined) student.resume.education = education;
    if (experience !== undefined) student.resume.experience = experience;
    if (projects !== undefined) student.resume.projects = projects;
    if (skills !== undefined) student.resume.skills = skills;
    if (certifications !== undefined) student.resume.certifications = certifications;

    student.resume.lastUpdated = Date.now();
    await student.save();

    res.status(200).json({
      success: true,
      message: "Resume updated successfully",
      data: { resume: student.resume }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Upload Resume File
// ----------------------
exports.uploadResumeFile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    console.log("✅ Resume file received:", req.file.originalname);
    console.log("📁 Filename:", req.file.filename);

    // Delete old resume file if exists
    if (student.resume?.resumeFile) {
      const oldFilePath = path.join(process.cwd(), student.resume.resumeFile);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log("✅ Old resume deleted");
      }
    }

    // Store the correct path
    const filePath = `/uploads/resumes/${req.file.filename}`;
    const fileUrl = `${req.protocol}://${req.get('host')}${filePath}`;

    if (!student.resume) student.resume = {};
    student.resume.resumeFile = filePath;
    student.resume.resumeFileName = req.file.originalname;
    student.resume.lastUpdated = Date.now();
    await student.save();

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      data: {
        url: fileUrl,
        fileName: req.file.originalname,
        path: filePath
      }
    });
  } catch (error) {
    console.error("❌ Error uploading resume:", error);
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload resume"
    });
  }
};

// ----------------------
// Remove Resume File
// ----------------------
exports.removeResumeFile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (student.resume?.resumeFile) {
      const filePath = path.join(process.cwd(), student.resume.resumeFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("✅ Resume file deleted");
      }

      student.resume.resumeFile = '';
      student.resume.resumeFileName = '';
      student.resume.lastUpdated = Date.now();
      await student.save();
    }

    res.status(200).json({
      success: true,
      message: "Resume removed successfully"
    });
  } catch (error) {
    console.error("❌ Error removing resume:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove resume"
    });
  }
};

// ----------------------
// Upload Certificate File
// ----------------------
exports.uploadCertificateFile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      // Clean up uploaded file if student not found
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    console.log("✅ Certificate file received:", req.file.originalname);
    console.log("📁 Filename:", req.file.filename);

    const filePath = `/uploads/certificates/${req.file.filename}`;
    const fileUrl = `${req.protocol}://${req.get('host')}${filePath}`;

    // Get certificate details from request body
    const { name, issuer, date, expiryDate, credentialId, link } = req.body;

    // Initialize resume if it doesn't exist
    if (!student.resume) student.resume = {};
    if (!student.resume.certifications) student.resume.certifications = [];

    // Add new certificate with file info
    const newCertificate = {
      name: name || req.file.originalname.replace(/\.[^/.]+$/, ""), // Remove extension for default name
      issuer: issuer || '',
      date: date || new Date(),
      expiryDate: expiryDate || null,
      credentialId: credentialId || '',
      link: link || '',
      certificateUrl: filePath  // Store the path to uploaded file
    };

    student.resume.certifications.push(newCertificate);
    student.resume.lastUpdated = Date.now();
    await student.save();

    // Get the saved certificate with ID
    const savedCertificate = student.resume.certifications[student.resume.certifications.length - 1];

    res.status(200).json({
      success: true,
      message: "Certificate uploaded successfully",
      data: {
        certificate: {
          ...savedCertificate.toObject(),
          certificateUrl: fileUrl // Return full URL
        },
        url: fileUrl,
        fileName: req.file.originalname,
        path: filePath
      }
    });
  } catch (error) {
    console.error("❌ Error uploading certificate:", error);
    // Clean up uploaded file on error
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload certificate"
    });
  }
};

// ----------------------
// Update Certificate Details (without re-uploading)
// ----------------------
exports.updateCertificate = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { certificateId } = req.params;
    const { name, issuer, date, expiryDate, credentialId, link } = req.body;

    if (!student.resume?.certifications) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    // Find the certificate
    const certificate = student.resume.certifications.id(certificateId);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    // Update fields
    if (name !== undefined) certificate.name = name;
    if (issuer !== undefined) certificate.issuer = issuer;
    if (date !== undefined) certificate.date = date;
    if (expiryDate !== undefined) certificate.expiryDate = expiryDate;
    if (credentialId !== undefined) certificate.credentialId = credentialId;
    if (link !== undefined) certificate.link = link;

    student.resume.lastUpdated = Date.now();
    await student.save();

    // Generate full URL for response
    const certificateObj = certificate.toObject();
    if (certificateObj.certificateUrl) {
      certificateObj.certificateUrl = `${req.protocol}://${req.get('host')}${certificateObj.certificateUrl}`;
    }

    res.status(200).json({
      success: true,
      message: "Certificate updated successfully",
      data: { certificate: certificateObj }
    });
  } catch (error) {
    console.error("❌ Error updating certificate:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update certificate"
    });
  }
};

// ----------------------
// Remove Certificate
// ----------------------
exports.removeCertificate = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { certificateId } = req.params;

    if (!student.resume?.certifications) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    // Find the certificate
    const certificate = student.resume.certifications.id(certificateId);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    // Delete file if exists
    if (certificate.certificateUrl) {
      const filePath = path.join(process.cwd(), certificate.certificateUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("✅ Certificate file deleted:", certificate.certificateUrl);
      }
    }

    // Remove from array
    student.resume.certifications.pull(certificateId);
    student.resume.lastUpdated = Date.now();
    await student.save();

    res.status(200).json({
      success: true,
      message: "Certificate removed successfully"
    });
  } catch (error) {
    console.error("❌ Error removing certificate:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove certificate"
    });
  }
};

// ----------------------
// Get All Certificates
// ----------------------
exports.getCertificates = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const certificates = (student.resume?.certifications || []).map(cert => {
      const certObj = cert.toObject();
      if (certObj.certificateUrl) {
        certObj.certificateUrl = `${req.protocol}://${req.get('host')}${certObj.certificateUrl}`;
      }
      return certObj;
    });

    res.status(200).json({
      success: true,
      data: { certificates }
    });
  } catch (error) {
    console.error("❌ Error getting certificates:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get certificates"
    });
  }
};

// ----------------------
// Change Password
// ----------------------
exports.changePassword = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(newPassword, salt);
    await student.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Forgot Password
// ----------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.'
      });
    }

    const resetToken = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET + student.password,
      { expiresIn: '15m' }
    );

    student.resetPasswordToken = resetToken;
    student.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await student.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    await sendPasswordResetEmail(email, resetUrl);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ----------------------
// Reset Password
// ----------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const student = await Student.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    student.password = hashedPassword;
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ----------------------
// Get Student Applications
// ----------------------
exports.getStudentApplications = async (req, res) => {
  try {
    const Application = require("../models/Application");

    const applications = await Application.find({ student: req.user.id })
      .populate({
        path: 'internship',
        populate: {
          path: 'postedBy',
          select: 'companyName fullName email'
        }
      })
      .sort({ createdAt: -1 });

    // Add full URLs for submitted documents
    const applicationsWithUrls = applications.map(app => {
      const appObj = app.toObject();
      
      if (appObj.submittedResume?.url) {
        appObj.submittedResume.url = `${req.protocol}://${req.get('host')}${appObj.submittedResume.url}`;
      }
      
      if (appObj.submittedCertificates) {
        appObj.submittedCertificates = appObj.submittedCertificates.map(cert => ({
          ...cert,
          url: cert.url ? `${req.protocol}://${req.get('host')}${cert.url}` : null
        }));
      }
      
      return appObj;
    });

    res.status(200).json({
      success: true,
      data: { applications: applicationsWithUrls }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Student by ID (for recruiters)
// ----------------------
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .select("-password -resetPasswordToken -resetPasswordExpires");
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Generate full URLs for files (same as profile)
    const studentObj = student.toObject();
    if (studentObj.resume?.resumeFile) {
      studentObj.resume.resumeUrl = `${req.protocol}://${req.get('host')}${studentObj.resume.resumeFile}`;
    }
    
    if (studentObj.resume?.certifications) {
      studentObj.resume.certifications = studentObj.resume.certifications.map(cert => ({
        ...cert,
        certificateUrl: cert.certificateUrl ? `${req.protocol}://${req.get('host')}${cert.certificateUrl}` : null
      }));
    }

    res.status(200).json({
      success: true,
      data: { student: studentObj }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};