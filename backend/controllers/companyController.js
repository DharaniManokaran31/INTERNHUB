const Company = require('../models/Company');
const Recruiter = require('../models/Recruiter');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Student = require('../models/Student');

// ============================================
// PUBLIC COMPANY INFO
// ============================================

// Get Company Profile (Public)
exports.getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Return only public information
    const publicInfo = {
      name: company.name,
      description: company.description,
      website: company.website,
      logo: company.logo,
      industry: company.industry,
      size: company.size,
      foundedYear: company.foundedYear,
      address: company.address,
      socialMedia: company.socialMedia,
      departments: company.departments?.filter(d => d.isActive).map(d => d.name)
    };

    res.status(200).json({
      success: true,
      data: { company: publicInfo }
    });
  } catch (error) {
    console.error('Error in getCompanyProfile:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// ADMIN/HR FUNCTIONS
// ============================================

// Get Full Company Details (Admin/HR only)
exports.getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get additional stats
    const [
      totalRecruiters,
      activeRecruiters,
      totalInternships,
      activeInternships,
      totalStudents,
      activeInterns
    ] = await Promise.all([
      Recruiter.countDocuments({ role: 'recruiter' }),
      Recruiter.countDocuments({ 
        role: 'recruiter', 
        isActive: true, 
        invitationStatus: 'accepted' 
      }),
      Internship.countDocuments(),
      Internship.countDocuments({ status: 'active' }),
      Student.countDocuments(),
      Application.countDocuments({ status: 'accepted' })
    ]);

    // Populate HR team details
    if (company.hrTeam && company.hrTeam.length > 0) {
      await company.populate('hrTeam', 'fullName email department');
    }

    res.status(200).json({
      success: true,
      data: {
        company,
        stats: {
          ...company.stats,
          totalRecruiters,
          activeRecruiters,
          totalInternships,
          activeInternships,
          totalStudents,
          activeInterns
        }
      }
    });
  } catch (error) {
    console.error('Error in getCompanyDetails:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Company Details
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates._id;
    delete updates.stats;
    delete updates.verificationStatus;
    delete updates.verifiedBy;
    delete updates.verifiedAt;

    // Handle nested objects
    if (updates.address) {
      company.address = { ...company.address, ...updates.address };
      delete updates.address;
    }

    if (updates.socialMedia) {
      company.socialMedia = { ...company.socialMedia, ...updates.socialMedia };
      delete updates.socialMedia;
    }

    if (updates.settings) {
      company.settings = { ...company.settings, ...updates.settings };
      delete updates.settings;
    }

    // Apply remaining updates
    Object.assign(company, updates);
    
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Error in updateCompany:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// DEPARTMENT MANAGEMENT
// ============================================

// Get All Departments
exports.getDepartments = async (req, res) => {
  try {
    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get department stats
    const departments = await Promise.all(company.departments.map(async (dept) => {
      const recruiters = await Recruiter.countDocuments({ 
        department: dept.name,
        role: 'recruiter',
        isActive: true
      });
      
      const internships = await Internship.countDocuments({ 
        department: dept.name,
        status: 'active'
      });

      return {
        ...dept.toObject(),
        stats: {
          recruiters,
          internships
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: { departments }
    });
  } catch (error) {
    console.error('Error in getDepartments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add Department
exports.addDepartment = async (req, res) => {
  try {
    const { name, description, headId } = req.body;

    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if department already exists
    if (company.departments.some(d => d.name === name)) {
      return res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
    }

    company.departments.push({
      name,
      description,
      headId,
      isActive: true
    });

    await company.save();

    res.status(201).json({
      success: true,
      message: 'Department added successfully',
      data: { departments: company.departments }
    });
  } catch (error) {
    console.error('Error in addDepartment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Department
exports.updateDepartment = async (req, res) => {
  try {
    const { departmentName } = req.params;
    const updates = req.body;

    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const department = company.departments.find(d => d.name === departmentName);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    Object.assign(department, updates);
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: { departments: company.departments }
    });
  } catch (error) {
    console.error('Error in updateDepartment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// DOCUMENT MANAGEMENT
// ============================================

// Upload Company Document
exports.uploadDocument = async (req, res) => {
  try {
    const { type, filename } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const document = {
      type,
      url: `/uploads/company/${req.file.filename}`,
      filename: filename || req.file.originalname,
      uploadedAt: new Date()
    };

    company.documents.push(document);
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Document
exports.verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const document = company.documents.id(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    document.verified = true;
    document.verifiedAt = new Date();
    document.verifiedBy = req.user.id;

    await company.save();

    res.status(200).json({
      success: true,
      message: 'Document verified successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Error in verifyDocument:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// STATS & ANALYTICS
// ============================================

// Get Company Stats
exports.getCompanyStats = async (req, res) => {
  try {
    const company = await Company.findOne();
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Refresh stats
    const [
      totalInternships,
      activeInternships,
      totalRecruiters,
      totalStudentsHired,
      totalApplications
    ] = await Promise.all([
      Internship.countDocuments(),
      Internship.countDocuments({ status: 'active' }),
      Recruiter.countDocuments({ role: 'recruiter', isActive: true }),
      Application.countDocuments({ status: 'accepted' }),
      Application.countDocuments()
    ]);

    company.stats = {
      totalInternships,
      activeInternships,
      totalRecruiters,
      totalStudentsHired,
      totalApplications
    };

    await company.save();

    // Monthly trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = {
      internships: await Internship.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      applications: await Application.countDocuments({ 
        appliedAt: { $gte: thirtyDaysAgo } 
      }),
      hires: await Application.countDocuments({ 
        status: 'accepted',
        updatedAt: { $gte: thirtyDaysAgo } 
      })
    };

    res.status(200).json({
      success: true,
      data: {
        stats: company.stats,
        recent: recentStats
      }
    });
  } catch (error) {
    console.error('Error in getCompanyStats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Growth Chart Data
exports.getGrowthData = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // week, month, year

    let startDate = new Date();
    let groupFormat;

    switch(period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        groupFormat = '%Y-%m-%d';
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupFormat = '%Y-%m';
        break;
      default: // month
        startDate.setMonth(startDate.getMonth() - 1);
        groupFormat = '%Y-%m-%d';
    }

    const [internshipGrowth, applicationGrowth, hireGrowth] = await Promise.all([
      Internship.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { '_id': 1 } }
      ]),
      Application.aggregate([
        { $match: { appliedAt: { $gte: startDate } } },
        { $group: {
          _id: { $dateToString: { format: groupFormat, date: '$appliedAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { '_id': 1 } }
      ]),
      Application.aggregate([
        { $match: { status: 'accepted', updatedAt: { $gte: startDate } } },
        { $group: {
          _id: { $dateToString: { format: groupFormat, date: '$updatedAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        internships: internshipGrowth,
        applications: applicationGrowth,
        hires: hireGrowth
      }
    });
  } catch (error) {
    console.error('Error in getGrowthData:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};