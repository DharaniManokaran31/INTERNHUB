const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Recruiter = require('../models/Recruiter');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../services/emailService');

// ----------------------
// Login Admin (Separate from main login)
// ----------------------
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin with password
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: 'admin',
        isSuperAdmin: admin.isSuperAdmin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const adminResponse = admin.toSafeObject();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: adminResponse,
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Admin Profile
// ----------------------
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: admin.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Dashboard Stats
// ----------------------
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalRecruiters = await Recruiter.countDocuments({ role: 'recruiter' });
    const totalHR = await Recruiter.countDocuments({ role: 'hr' });
    const totalInternships = await Internship.countDocuments();
    const totalApplications = await Application.countDocuments();
    
    const activeInternships = await Internship.countDocuments({ status: 'active' });
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const acceptedApplications = await Application.countDocuments({ status: 'accepted' });

    // Recent activities
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email createdAt');
    
    const recentRecruiters = await Recruiter.find({ role: 'recruiter' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email department createdAt');
    
    const recentInternships = await Internship.find()
      .populate('postedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        users: {
          totalStudents,
          totalRecruiters,
          totalHR,
          totalUsers: totalStudents + totalRecruiters + totalHR
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
        recent: {
          students: recentStudents,
          recruiters: recentRecruiters,
          internships: recentInternships
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get All Students
// ----------------------
exports.getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search ? {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const students = await Student.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Student.countDocuments(query);

    // Get application counts for each student
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      const applications = await Application.countDocuments({ studentId: student._id });
      const accepted = await Application.countDocuments({ 
        studentId: student._id, 
        status: 'accepted' 
      });
      
      return {
        ...student.toSafeObject(),
        stats: {
          totalApplications: applications,
          acceptedApplications: accepted
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        students: studentsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get All Recruiters
// ----------------------
exports.getAllRecruiters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search ? {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const recruiters = await Recruiter.find({ role: 'recruiter', ...query })
      .select('-password -invitationToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Recruiter.countDocuments({ role: 'recruiter', ...query });

    // Get internship counts
    const recruitersWithStats = await Promise.all(recruiters.map(async (recruiter) => {
      const internships = await Internship.countDocuments({ postedBy: recruiter._id });
      const mentees = recruiter.mentorFor?.length || 0;
      
      return {
        ...recruiter.toSafeObject(),
        stats: {
          totalInternships: internships,
          activeMentees: mentees
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        recruiters: recruitersWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all recruiters error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Delete User
// ----------------------
exports.deleteUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;

    // Check if trying to delete self
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    let deletedUser;
    if (userType === 'student') {
      deletedUser = await Student.findByIdAndDelete(userId);
      // Also delete applications
      await Application.deleteMany({ studentId: userId });
    } else if (userType === 'recruiter') {
      deletedUser = await Recruiter.findByIdAndDelete(userId);
      // Don't delete internships, but mark as inactive
      await Internship.updateMany(
        { postedBy: userId },
        { status: 'closed' }
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get All Internships (Admin)
// ----------------------
exports.getAllInternshipsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';

    const query = status ? { status } : {};

    const internships = await Internship.find(query)
      .populate('postedBy', 'fullName email department')
      .populate('mentorId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Internship.countDocuments(query);

    // Add application counts
    const internshipsWithStats = await Promise.all(internships.map(async (internship) => {
      const applications = await Application.countDocuments({ internshipId: internship._id });
      const accepted = await Application.countDocuments({ 
        internshipId: internship._id, 
        status: 'accepted' 
      });
      
      return {
        ...internship.toObject(),
        stats: {
          totalApplications: applications,
          acceptedApplications: accepted
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        internships: internshipsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all internships error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Delete Internship (Admin)
// ----------------------
exports.deleteInternshipAdmin = async (req, res) => {
  try {
    const internship = await Internship.findByIdAndDelete(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found'
      });
    }

    // Delete all applications for this internship
    await Application.deleteMany({ internshipId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Internship and related applications deleted successfully'
    });
  } catch (error) {
    console.error('Delete internship error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Company Info
// ----------------------
exports.getCompanyInfo = async (req, res) => {
  try {
    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { company }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Update Company Info
// ----------------------
exports.updateCompanyInfo = async (req, res) => {
  try {
    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const updates = req.body;
    
    // Prevent changing critical fields
    delete updates._id;
    delete updates.stats;

    Object.assign(company, updates);
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Update company error:', error);
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
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.user.id).select('+password');

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// MISSING FUNCTIONS - ADD THESE
// ============================================

// ----------------------
// Forgot Password
// ----------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.'
      });
    }

    // Generate JWT token (valid for 15 minutes)
    const resetToken = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET + admin.password,
      { expiresIn: '15m' }
    );

    // Store token in database with expiry
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await admin.save();

    // Create reset URL
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // Send email
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

    // Find admin with valid token (not expired)
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset fields
    admin.password = hashedPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

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

// ----------------------
// Update Admin Profile
// ----------------------
exports.updateAdminProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates.isSuperAdmin;

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: admin.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Timeline Data for Reports
// ----------------------
exports.getTimelineData = async (req, res) => {
  try {
    const { range } = req.query; // 'week', 'month', 'quarter', 'year'
    
    console.log(`Fetching timeline data for range: ${range}`);
    
    let startDate = new Date();
    let endDate = new Date();
    let labels = [];
    
    // Set date range based on selection
    switch(range) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        // Generate last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        // Generate last 30 days
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.getDate().toString());
        }
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        // Generate last 12 weeks
        for (let i = 11; i >= 0; i--) {
          labels.push(`Week ${12-i}`);
        }
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.getDate().toString());
        }
    }

    // Fetch counts for each entity type
    const students = await Student.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const recruiters = await Recruiter.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const internships = await Internship.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const applications = await Application.countDocuments({
      appliedAt: { $gte: startDate, $lte: endDate }
    });

    // For simplicity, distribute counts across labels
    // In a real implementation, you'd do proper aggregation by date
    const studentsData = Array(labels.length).fill(0);
    const recruitersData = Array(labels.length).fill(0);
    const internshipsData = Array(labels.length).fill(0);
    const applicationsData = Array(labels.length).fill(0);
    
    // Distribute counts roughly
    if (labels.length > 0) {
      const perDayStudents = Math.round(students / labels.length) || 1;
      const perDayRecruiters = Math.round(recruiters / labels.length) || 0;
      const perDayInternships = Math.round(internships / labels.length) || 0;
      const perDayApplications = Math.round(applications / labels.length) || 0;
      
      for (let i = 0; i < labels.length; i++) {
        studentsData[i] = perDayStudents;
        recruitersData[i] = perDayRecruiters;
        internshipsData[i] = perDayInternships;
        applicationsData[i] = perDayApplications;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        labels,
        students: studentsData,
        recruiters: recruitersData,
        internships: internshipsData,
        applications: applicationsData
      }
    });
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get Trends Data
// ----------------------
exports.getTrendsData = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // Current period counts
    const currentStudents = await Student.countDocuments({
      createdAt: { $gte: lastMonth, $lte: now }
    });
    const previousStudents = await Student.countDocuments({
      createdAt: { $gte: previousMonth, $lte: lastMonth }
    });

    const currentRecruiters = await Recruiter.countDocuments({
      createdAt: { $gte: lastMonth, $lte: now }
    });
    const previousRecruiters = await Recruiter.countDocuments({
      createdAt: { $gte: previousMonth, $lte: lastMonth }
    });

    const currentInternships = await Internship.countDocuments({
      createdAt: { $gte: lastMonth, $lte: now }
    });
    const previousInternships = await Internship.countDocuments({
      createdAt: { $gte: previousMonth, $lte: lastMonth }
    });

    const currentApplications = await Application.countDocuments({
      appliedAt: { $gte: lastMonth, $lte: now }
    });
    const previousApplications = await Application.countDocuments({
      appliedAt: { $gte: previousMonth, $lte: lastMonth }
    });

    // Calculate trends
    const studentsTrend = previousStudents ? 
      ((currentStudents - previousStudents) / previousStudents * 100).toFixed(0) : 
      currentStudents > 0 ? '+100' : '0';
    
    const recruitersTrend = previousRecruiters ? 
      ((currentRecruiters - previousRecruiters) / previousRecruiters * 100).toFixed(0) : 
      currentRecruiters > 0 ? '+100' : '0';
    
    const internshipsTrend = previousInternships ? 
      ((currentInternships - previousInternships) / previousInternships * 100).toFixed(0) : 
      currentInternships > 0 ? '+100' : '0';
    
    const applicationsTrend = previousApplications ? 
      ((currentApplications - previousApplications) / previousApplications * 100).toFixed(0) : 
      currentApplications > 0 ? '+100' : '0';

    res.status(200).json({
      success: true,
      data: {
        students: `${studentsTrend > 0 ? '+' : ''}${studentsTrend}%`,
        recruiters: `${recruitersTrend > 0 ? '+' : ''}${recruitersTrend}%`,
        internships: `${internshipsTrend > 0 ? '+' : ''}${internshipsTrend}%`,
        applications: `${applicationsTrend > 0 ? '+' : ''}${applicationsTrend}%`
      }
    });
  } catch (error) {
    console.error('Error calculating trends:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};