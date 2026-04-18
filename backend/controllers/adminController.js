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
    let { email, password } = req.body;
    email = email?.trim().toLowerCase();
    password = password?.trim();
    
    const fs = require('fs');
    const path = require('path');
    const logPath = 'E:\\InternHub\\backend\\server.log';
    
    fs.appendFileSync(logPath, `[DEBUG] Attempting admin login for: "${email}" (len: ${email?.length})\n`);
    console.log(`[DEBUG] Attempting simplified admin login for: "${email}" (len: ${email?.length})`);
    console.log(`[DEBUG] Password length: ${password?.length}`);
    if (password && (password.startsWith(' ') || password.endsWith(' '))) {
       fs.appendFileSync(logPath, `[WARNING] Password has leading/trailing spaces!\n`);
    }
    
    // Find admin with password
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      console.log(`[DEBUG] Login failed: Admin not found`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatched = await bcrypt.compare(password, admin.password);

    if (!isMatched) {
      console.log(`[DEBUG] Login failed: Password mismatch`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Explicitly generate a clean ID for the token
    const token = jwt.sign(
      { id: admin._id.toString(), email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'internhub_secret_key',
      { expiresIn: '7d' }
    );

    // Manual cleanup instead of toSafeObject
    // Manual cleanup for the response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.resetPasswordToken;
    delete adminResponse.resetPasswordExpires;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      version: '2.0',
      data: {
        token,
        user: adminResponse
      }
    });

  } catch (error) {
    console.error('MOCK LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      version: '2.0',
      message: error.message || 'Internal Server Error'
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
        user: admin.toObject()
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
    const [
      totalStudents, 
      totalRecruiters, 
      totalHR,
      totalInternships, 
      activeInternships, 
      closedInternships,
      draftInternships,
      totalApplications, 
      pendingApplications, 
      shortlistedApplications, 
      acceptedApplications, 
      rejectedApplications
    ] = await Promise.all([
      Student.countDocuments(),
      Recruiter.countDocuments({ role: 'recruiter' }),
      Recruiter.countDocuments({ role: 'hr' }),
      Internship.countDocuments(),
      Internship.countDocuments({ status: 'active' }),
      Internship.countDocuments({ status: 'closed' }),
      Internship.countDocuments({ status: 'draft' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'shortlisted' }),
      Application.countDocuments({ status: { $in: ['accepted', 'completed'] } }),
      Application.countDocuments({ status: 'rejected' })
    ]);

    // Get recent data
    const [recentStudents, recentRecruiters, recentInternships] = await Promise.all([
      Student.find().sort({ createdAt: -1 }).limit(5),
      Recruiter.find().sort({ createdAt: -1 }).limit(5),
      Internship.find().sort({ createdAt: -1 }).limit(5)
    ]);

    console.log(`[DASHBOARD] Stats retrieved successfully.`);
    res.status(200).json({
      success: true,
      data: {
        users: {
          totalStudents,
          totalRecruiters,
          totalUsers: totalStudents + totalRecruiters
        },
        internships: {
          total: totalInternships,
          active: activeInternships,
          closed: closedInternships,
          draft: draftInternships
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          shortlisted: shortlistedApplications,
          accepted: acceptedApplications,
          rejected: rejectedApplications
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
        ...student.toObject(),
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
        ...recruiter.toObject(),
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

    // Add application counts using aggregation for performance
    const internshipIds = internships.map(i => i._id);
    const stats = await Application.aggregate([
      { $match: { internshipId: { $in: internshipIds } } },
      {
        $group: {
          _id: "$internshipId",
          totalApplications: { $sum: 1 },
          acceptedApplications: {
            $sum: { $cond: [{ $in: ["$status", ["accepted", "completed"]] }, 1, 0] }
          }
        }
      }
    ]);

    const statsMap = stats.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr;
      return acc;
    }, {});

    const internshipsWithStats = internships.map(internship => ({
      ...internship.toObject(),
      stats: statsMap[internship._id.toString()] || { totalApplications: 0, acceptedApplications: 0 }
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
    let company = await Company.findOne();
    
    if (!company) {
      // Create default company if not found
      company = new Company({
        name: 'InternHub',
        email: 'admin@internhub.com',
        phone: '1234567890',
        website: 'www.internhub.com',
        description: 'Quality internships for everyone.'
      });
      await company.save();
    }

    const adminResponse = admin.toObject();
    delete adminResponse.password;
    
    res.status(200).json({
      success: true,
      data: adminResponse
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
    let company = await Company.findOne();
    
    if (!company) {
      company = new Company(req.body);
      await company.save();
    } else {

    const updates = req.body;
    
    // Prevent changing critical fields
    delete updates._id;
    delete updates.stats;

    Object.assign(company, updates);
    await company.save();
    }

    const updatedCompany = await Company.findOne();

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: { company: updatedCompany }
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

    // Manual cleanup for the response instead of using a schema method
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.resetPasswordToken;
    delete adminResponse.resetPasswordExpires;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: adminResponse
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
    
    let startDate = new Date();
    let groupFormat = "%Y-%m-%d";
    let labels = [];
    let numDays = 30;
    
    // Set date range and grouping based on selection
    if (range === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      groupFormat = "%Y-%m-%d";
      numDays = 7;
    } else if (range === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
      groupFormat = "%Y-%m-%d";
      numDays = 30;
    } else if (range === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
      groupFormat = "%Y-%U"; // Group by week
      numDays = 90;
    } else if (range === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      groupFormat = "%Y-%m"; // Group by month
      numDays = 365;
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
      groupFormat = "%Y-%m-%d";
      numDays = 30;
    }

    const aggregateByDate = async (Model, dateField = 'createdAt') => {
      return await Model.aggregate([
        { $match: { [dateField]: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: `$${dateField}` } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    };

    const [studentsData, recruitersData, internshipsData, applicationsData] = await Promise.all([
      aggregateByDate(Student),
      aggregateByDate(Recruiter),
      aggregateByDate(Internship),
      aggregateByDate(Application, 'appliedAt')
    ]);

    // Create labels for the timeline
    if (range === 'week' || range === 'month' || !range) {
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    } else if (range === 'quarter') {
      for (let i = 12; i >= 0; i--) {
        labels.push(`Week ${12-i}`);
      }
    } else if (range === 'year') {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        labels.push(monthNames[d.getMonth()]);
      }
    }

    // Helper to map aggregate results to the fixed labels length
    const mapToLabels = (aggResults, format) => {
      const dataMap = {};
      aggResults.forEach(item => {
        dataMap[item._id] = item.count;
      });

      const result = [];
      if (range === 'week' || range === 'month' || !range) {
        for (let i = numDays - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          result.push(dataMap[key] || 0);
        }
      } else if (range === 'year') {
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          result.push(dataMap[key] || 0);
        }
      } else {
        // Simple fallback for quarter or others: just return counts distributed
        const values = aggResults.map(r => r.count);
        while (values.length < labels.length) values.unshift(0);
        return values.slice(-labels.length);
      }
      return result;
    };

    res.status(200).json({
      success: true,
      data: {
        labels,
        students: mapToLabels(studentsData, groupFormat),
        recruiters: mapToLabels(recruitersData, groupFormat),
        internships: mapToLabels(internshipsData, groupFormat),
        applications: mapToLabels(applicationsData, groupFormat)
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
