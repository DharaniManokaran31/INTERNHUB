const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Recruiter = require('../models/Recruiter');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ----------------------
// Register Admin
// ----------------------
exports.registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = new Admin({
      fullName,
      email,
      password: hashedPassword
    });

    await admin.save();

    // Remove password from response
    const adminWithoutPassword = admin.toObject();
    delete adminWithoutPassword.password;

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        user: adminWithoutPassword
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
// Login Admin
// ----------------------
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email });
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

    // Generate token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const adminWithoutPassword = admin.toObject();
    delete adminWithoutPassword.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: adminWithoutPassword,
        token
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
        user: admin
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
// Update Admin Profile
// ----------------------
exports.updateAdminProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated
    delete updates.password;
    delete updates.email;
    delete updates.role;

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: admin
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
// Change Password
// ----------------------
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.user.id);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
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
// Dashboard Stats
// ----------------------
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalRecruiters = await Recruiter.countDocuments();
    const totalInternships = await Internship.countDocuments();
    const totalApplications = await Application.countDocuments();
    
    const activeInternships = await Internship.countDocuments({ status: 'active' });
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const shortlistedApplications = await Application.countDocuments({ status: 'shortlisted' });
    const acceptedApplications = await Application.countDocuments({ status: 'accepted' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    // Recent activities
    const recentStudents = await Student.find().sort({ createdAt: -1 }).limit(5).select('fullName email createdAt');
    const recentRecruiters = await Recruiter.find().sort({ createdAt: -1 }).limit(5).select('fullName email company createdAt');
    const recentInternships = await Internship.find().populate('postedBy', 'companyName').sort({ createdAt: -1 }).limit(5);

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
          active: activeInternships
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
    console.error(error);
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

    res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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
        { company: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const recruiters = await Recruiter.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Recruiter.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        recruiters,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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
// Delete User (Student/Recruiter)
// ----------------------
exports.deleteUser = async (req, res) => {
  try {
    const { userId, userType } = req.params;

    let deletedUser;
    if (userType === 'student') {
      deletedUser = await Student.findByIdAndDelete(userId);
    } else if (userType === 'recruiter') {
      deletedUser = await Recruiter.findByIdAndDelete(userId);
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------
// Get All Internships (Admin view)
// ----------------------
exports.getAllInternshipsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';

    const query = status ? { status } : {};

    const internships = await Internship.find(query)
      .populate('postedBy', 'fullName email company')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Internship.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        internships,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

    // Also delete all applications for this internship
    await Application.deleteMany({ internship: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Internship and related applications deleted successfully'
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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // In production, store this token in database with expiry
    // For now, just return success message
    
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
    const { password, email } = req.body;

    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
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
// Get Timeline Data for Reports - UPDATED VERSION
// ----------------------
exports.getTimelineData = async (req, res) => {
  try {
    const { range } = req.query; // 'week', 'month', 'quarter', 'year'
    
    console.log(`Fetching timeline data for range: ${range}`); // Debug log
    
    let startDate = new Date();
    let endDate = new Date();
    
    // Set date range based on selection
    switch(range) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    console.log(`Date range: ${startDate} to ${endDate}`); // Debug log

    // Generate labels based on range
    let labels = [];
    let dateFormat;
    
    switch(range) {
      case 'week':
        dateFormat = '%Y-%m-%d';
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        }
        break;
        
      case 'month':
        dateFormat = '%Y-%m-%d';
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.getDate().toString());
        }
        break;
        
      case 'quarter':
        dateFormat = '%Y-%U'; // Week number
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - (i * 7));
          labels.push(`Week ${12-i}`);
        }
        break;
        
      case 'year':
        dateFormat = '%Y-%m';
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        break;
        
      default:
        dateFormat = '%Y-%m-%d';
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.getDate().toString());
        }
    }

    // Fetch students timeline
    const students = await Student.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);
    console.log(`Found ${students.length} student registration days`); // Debug log

    // Fetch recruiters timeline
    const recruiters = await Recruiter.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);
    console.log(`Found ${recruiters.length} recruiter registration days`); // Debug log

    // Fetch internships timeline
    const internships = await Internship.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);
    console.log(`Found ${internships.length} internship posting days`); // Debug log

    // Fetch applications timeline
    const applications = await Application.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);
    console.log(`Found ${applications.length} application submission days`); // Debug log

    // Create maps for quick lookup
    const studentsMap = new Map();
    students.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      studentsMap.set(key, item.count);
      console.log(`Student data: ${key} = ${item.count}`); // Debug log
    });

    const recruitersMap = new Map();
    recruiters.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      recruitersMap.set(key, item.count);
    });

    const internshipsMap = new Map();
    internships.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      internshipsMap.set(key, item.count);
    });

    const applicationsMap = new Map();
    applications.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      applicationsMap.set(key, item.count);
      console.log(`Application data: ${key} = ${item.count}`); // Debug log
    });

    // Generate data arrays matching labels
    const studentsData = [];
    const recruitersData = [];
    const internshipsData = [];
    const applicationsData = [];

    for (let i = 0; i < labels.length; i++) {
      let date;
      let key;
      
      if (range === 'year') {
        // For year view, we'll use month numbers
        const monthIndex = i; // 0-11
        date = new Date();
        date.setMonth(monthIndex);
        key = `${date.getFullYear()}-${String(monthIndex + 1).padStart(2, '0')}`;
        
        // For year, we need to sum all days in that month
        const monthStudents = Array.from(studentsMap.entries())
          .filter(([k]) => k.startsWith(key))
          .reduce((sum, [_, count]) => sum + count, 0);
        
        const monthRecruiters = Array.from(recruitersMap.entries())
          .filter(([k]) => k.startsWith(key))
          .reduce((sum, [_, count]) => sum + count, 0);
        
        const monthInternships = Array.from(internshipsMap.entries())
          .filter(([k]) => k.startsWith(key))
          .reduce((sum, [_, count]) => sum + count, 0);
        
        const monthApplications = Array.from(applicationsMap.entries())
          .filter(([k]) => k.startsWith(key))
          .reduce((sum, [_, count]) => sum + count, 0);
        
        studentsData.push(monthStudents);
        recruitersData.push(monthRecruiters);
        internshipsData.push(monthInternships);
        applicationsData.push(monthApplications);
        
      } else if (range === 'quarter') {
        // For quarter, approximate by week
        const weekOffset = i * 7;
        date = new Date();
        date.setDate(date.getDate() - (labels.length - 1 - i) * 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        studentsData.push(studentsMap.get(key) || 0);
        recruitersData.push(recruitersMap.get(key) || 0);
        internshipsData.push(internshipsMap.get(key) || 0);
        applicationsData.push(applicationsMap.get(key) || 0);
        
      } else {
        // For week and month, get exact day
        date = new Date();
        date.setDate(date.getDate() - (labels.length - 1 - i));
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        studentsData.push(studentsMap.get(key) || 0);
        recruitersData.push(recruitersMap.get(key) || 0);
        internshipsData.push(internshipsMap.get(key) || 0);
        applicationsData.push(applicationsMap.get(key) || 0);
      }
    }

    // Calculate totals for debugging
    const totalStudents = studentsData.reduce((a, b) => a + b, 0);
    const totalRecruiters = recruitersData.reduce((a, b) => a + b, 0);
    const totalInternships = internshipsData.reduce((a, b) => a + b, 0);
    const totalApplications = applicationsData.reduce((a, b) => a + b, 0);
    
    console.log('Timeline totals:', {
      students: totalStudents,
      recruiters: totalRecruiters,
      internships: totalInternships,
      applications: totalApplications,
      labels: labels.length
    });

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
      createdAt: { $gte: lastMonth, $lte: now }
    });
    const previousApplications = await Application.countDocuments({
      createdAt: { $gte: previousMonth, $lte: lastMonth }
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