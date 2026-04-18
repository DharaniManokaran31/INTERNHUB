const mongoose = require('mongoose');
const path = require('path');
const Student = require("../models/Student");
const Application = require("../models/Application");
const Certificate = require("../models/Certificate");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendPasswordResetEmail } = require("../services/emailService");
const fs = require("fs");

// ----------------------
// Register Student
// ----------------------
exports.registerStudent = async (req, res) => {
  try {
    const { fullName, email, password, phone, education } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new student
    const newStudent = new Student({
      fullName,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: 'student',
      currentEducation: {
        college: education?.college || '',
        department: education?.department || '',
        yearOfStudy: education?.yearOfStudy || '1st Year',
        course: education?.course || '',
        specialization: education?.specialization || ''
      },
      isActive: true,
      isEmailVerified: false
    });

    // ✅ Calculate profile completion before saving
    newStudent.profileCompletion = newStudent.calculateProfileCompletion();

    await newStudent.save();

    // Remove password from response
    const studentResponse = newStudent.toSafeObject();

    res.status(201).json({
      success: true,
      message: "Account created successfully. Please sign in.",
      data: {
        user: studentResponse
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
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

    // Find student with password field (select: false)
    const student = await Student.findOne({ email }).select('+password');
    
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if account is active
    if (!student.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support."
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Update last login
    student.lastLoginAt = new Date();
    await student.save();

    // Generate JWT
    const token = jwt.sign(
      {
        id: student._id,
        email: student.email,
        role: student.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Get safe student object
    const studentResponse = student.toSafeObject();

    // Generate full URLs for files
    if (studentResponse.resume?.resumeFile) {
      studentResponse.resume.resumeUrl = `${req.protocol}://${req.get('host')}${studentResponse.resume.resumeFile}`;
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: studentResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
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

    // Get safe object and add file URLs
    const studentObj = student.toSafeObject();
    
    if (studentObj.resume?.resumeFile) {
      studentObj.resume.resumeUrl = `${req.protocol}://${req.get('host')}${studentObj.resume.resumeFile}`;
    }

    // Certificate URLs
    if (studentObj.resume?.certifications) {
      studentObj.resume.certifications = studentObj.resume.certifications.map(cert => ({
        ...cert,
        certificateUrl: cert.certificateUrl ? `${req.protocol}://${req.get('host')}${cert.certificateUrl}` : null
      }));
    }

    // Get missing fields
    const missingFields = student.getMissingFields();

    res.status(200).json({
      success: true,
      data: { 
        student: studentObj,
        profileCompletion: student.profileCompletion,
        missingFields
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
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
      phone,
      location,
      currentEducation,
      linkedin,
      github,
      portfolio,
      skills
    } = req.body;

    // Update fields
    if (fullName) student.fullName = fullName;
    if (phone) student.phone = phone;
    if (location) student.location = location;
    if (linkedin) student.linkedin = linkedin;
    if (github) student.github = github;
    if (portfolio) student.portfolio = portfolio;
    if (skills) student.skills = skills;

    // Update education
    if (currentEducation) {
      student.currentEducation = {
        college: currentEducation.college || student.currentEducation?.college || '',
        department: currentEducation.department || student.currentEducation?.department || '',
        yearOfStudy: currentEducation.yearOfStudy || student.currentEducation?.yearOfStudy || '1st Year',
        course: currentEducation.course || student.currentEducation?.course || '',
        specialization: currentEducation.specialization || student.currentEducation?.specialization || ''
      };
    }

    // ✅ Recalculate profile completion after updates
    student.profileCompletion = student.calculateProfileCompletion();

    await student.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { student: student.toSafeObject() }
    });
  } catch (error) {
    console.error('Update profile error:', error);
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
      // Clean up uploaded file if student not found
      if (req.file?.path) fs.unlinkSync(req.file.path);
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

    // Delete old resume file if exists
    if (student.resume?.resumeFile) {
      const oldFilePath = path.join(process.cwd(), student.resume.resumeFile);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Store file path
    const filePath = `/uploads/resumes/${req.file.filename}`;
    const fileUrl = `${req.protocol}://${req.get('host')}${filePath}`;

    // Initialize resume if needed
    if (!student.resume) student.resume = {};
    
    student.resume.resumeFile = filePath;
    student.resume.resumeFileName = req.file.originalname;
    student.resume.lastUpdated = Date.now();

    // ✅ Recalculate profile completion after resume upload
    student.profileCompletion = student.calculateProfileCompletion();
    
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
    console.error("Error uploading resume:", error);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload resume"
    });
  }
};

// ----------------------
// Update Resume Details (Education, Experience, etc.)
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

    // ✅ Recalculate profile completion after resume update
    student.profileCompletion = student.calculateProfileCompletion();
    
    await student.save();

    res.status(200).json({
      success: true,
      message: "Resume updated successfully",
      data: { resume: student.resume }
    });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Student Applications
// ----------------------
exports.getStudentApplications = async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log(`🔍 [DEBUG] Student fetching applications. ID: ${studentId}`);

    let queryId;
    try {
      queryId = new mongoose.Types.ObjectId(studentId);
    } catch (e) {
      console.error(`❌ [DEBUG] Invalid Student ID in JWT for applications: ${studentId}`);
      return res.status(400).json({ success: false, message: "Invalid student identity." });
    }

    const applications = await Application.find({ studentId: queryId })
      .populate({
        path: 'internshipId',
        select: 'title companyName department workMode location stipend duration startDate endDate'
      })
      .populate('recruiterId', 'fullName department')
      .sort({ appliedAt: -1 });

    // Add URLs for submitted files
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
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Issued Certificates
// ----------------------
exports.getIssuedCertificates = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentEmail = req.user.email;
    console.log(`🔍 [DEBUG] Student accessing certificates: ID=${studentId}, Email=${studentEmail}`);
    
    // Explicitly cast to ensure no cast errors occur during query if ID string is malformed
    let queryId;
    try {
      queryId = new mongoose.Types.ObjectId(studentId);
    } catch (e) {
      console.error(`❌ [DEBUG] Invalid Student ID in JWT: ${studentId}`);
      return res.status(400).json({ success: false, message: "Invalid student identity." });
    }

    const certificates = await Certificate.find({ 
      studentId: queryId, 
      status: 'issued' 
    })
      .populate('internshipId', 'title department')
      .populate('issuedBy', 'fullName designation')
      .sort({ issueDate: -1 });

    console.log(`✅ [DEBUG] Found ${certificates.length} certificates for ${studentEmail}`);

    res.status(200).json({
      success: true,
      data: { certificates }
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Change Password
// ----------------------
exports.changePassword = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('+password');
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
    console.error('Change password error:', error);
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
    console.error('Forgot password error:', error);
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

    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(password, salt);
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// MISSING FUNCTIONS
// ============================================

// ----------------------
// Get Student By ID (for recruiters)
// ----------------------
exports.getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Generate full URLs for files
    const studentObj = student.toSafeObject();
    
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
    console.error('Get student by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
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

      // ✅ Recalculate profile completion after resume removal
      student.profileCompletion = student.calculateProfileCompletion();
      
      await student.save();
    }

    res.status(200).json({
      success: true,
      message: "Resume removed successfully"
    });
  } catch (error) {
    console.error("Error removing resume:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove resume"
    });
  }
};

// ----------------------
// Get Issued Certificate By ID
// ----------------------
exports.getIssuedCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const certificate = await Certificate.findOne({ 
      _id: id, 
      studentId,
      status: 'issued'
    })
    .populate('internshipId', 'title department companyName')
    .populate('issuedBy', 'fullName designation');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    res.status(200).json({
      success: true,
      data: { certificate }
    });
  } catch (error) {
    console.error('Get issued certificate by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Student-Uploaded Certificates
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
    console.error("Error getting certificates:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get certificates"
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
      if (req.file?.path) fs.unlinkSync(req.file.path);
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

    const filePath = `/uploads/certificates/${req.file.filename}`;
    const fileUrl = `${req.protocol}://${req.get('host')}${filePath}`;

    // Get certificate details from request body
    const { name, issuer, date, expiryDate, credentialId, link } = req.body;

    // Initialize resume if it doesn't exist
    if (!student.resume) student.resume = {};
    if (!student.resume.certifications) student.resume.certifications = [];

    // Add new certificate with file info
    const newCertificate = {
      name: name || req.file.originalname.replace(/\.[^/.]+$/, ""),
      issuer: issuer || '',
      date: date || new Date(),
      expiryDate: expiryDate || null,
      credentialId: credentialId || '',
      link: link || '',
      certificateUrl: filePath
    };

    student.resume.certifications.push(newCertificate);
    student.resume.lastUpdated = Date.now();

    // ✅ Recalculate profile completion after certificate upload
    student.profileCompletion = student.calculateProfileCompletion();
    
    await student.save();

    // Get the saved certificate with ID
    const savedCertificate = student.resume.certifications[student.resume.certifications.length - 1];

    res.status(200).json({
      success: true,
      message: "Certificate uploaded successfully",
      data: {
        certificate: {
          ...savedCertificate.toObject(),
          certificateUrl: fileUrl
        },
        url: fileUrl,
        fileName: req.file.originalname,
        path: filePath
      }
    });
  } catch (error) {
    console.error("Error uploading certificate:", error);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload certificate"
    });
  }
};

// ----------------------
// Update Certificate Details
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

    // ✅ Recalculate profile completion after certificate update
    student.profileCompletion = student.calculateProfileCompletion();
    
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
    console.error("Error updating certificate:", error);
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

    // ✅ Recalculate profile completion after certificate removal
    student.profileCompletion = student.calculateProfileCompletion();
    
    await student.save();

    res.status(200).json({
      success: true,
      message: "Certificate removed successfully"
    });
  } catch (error) {
    console.error("Error removing certificate:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove certificate"
    });
  }
};