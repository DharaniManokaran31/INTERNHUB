const Internship = require("../models/Internship");
const Recruiter = require("../models/Recruiter");
const Company = require("../models/Company");
const Application = require("../models/Application");
const mongoose = require("mongoose");

// ============================================
// CREATE INTERNSHIP
// ============================================
exports.createInternship = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    // Get recruiter details
    const recruiter = await Recruiter.findById(recruiterId);
    
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }

    // Check if recruiter has permission
    if (!recruiter.permissions?.canPostInternship) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to post internships'
      });
    }

    // Get company
    const company = await Company.findOne();
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const {
      title,
      description,
      location,
      workMode,
      officeLocation,
      dailyTimings,
      weeklyOff,
      startDate,
      endDate,
      duration,
      stipend,
      positions,
      skillsRequired,
      requirements,
      perks,
      selectionProcess,
      deadline
    } = req.body;

    // Validation
    if (!title || !description || !location || !workMode || !startDate || !endDate || !duration) {
      return res.status(400).json({ 
        success: false,
        message: "Please fill all required fields" 
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const deadlineDate = deadline ? new Date(deadline) : null;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid start or end date" 
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    // Process skills
    let processedSkills = [];
    if (skillsRequired) {
      if (Array.isArray(skillsRequired)) {
        processedSkills = skillsRequired.map(skill => {
          if (typeof skill === 'string') {
            return { name: skill, level: 'beginner' };
          }
          return {
            name: skill.name || '',
            level: skill.level || 'beginner'
          };
        }).filter(skill => skill.name);
      }
    }

    // Create internship
    const internship = new Internship({
      title,
      description,
      companyName: company.name,
      companyId: company._id,
      location,
      workMode,
      officeLocation: officeLocation || '',
      dailyTimings: dailyTimings || "10:00 AM - 6:00 PM",
      weeklyOff: weeklyOff || "Saturday, Sunday",
      startDate: start,
      endDate: end,
      duration: parseInt(duration),
      stipend: stipend ? parseInt(stipend) : 0,
      positions: positions ? parseInt(positions) : 1,
      filledPositions: 0,
      
      // Department comes from recruiter
      department: recruiter.department,
      
      // Mentor is the recruiter themselves
      mentorId: recruiterId,
      postedBy: recruiterId,
      
      // Skills and requirements
      skillsRequired: processedSkills,
      requirements: requirements || [],
      perks: perks || [],
      
      // Selection process
      selectionProcess: selectionProcess || [],
      
      // Deadline
      deadline: deadlineDate || end,
      
      // Status
      status: 'active',
      
      // Type (legacy field)
      type: workMode === 'Remote' ? 'Remote' : workMode === 'Hybrid' ? 'Hybrid' : 'On-site'
    });

    const savedInternship = await internship.save();

    // Update company stats (non-blocking)
    try {
      company.stats.totalInternships += 1;
      company.stats.activeInternships += 1;
      await company.save();
    } catch (companyError) {
      console.log('⚠️ Company stats update failed (non-critical):', companyError.message);
    }

    res.status(201).json({
      success: true,
      message: "Internship created successfully",
      data: { internship: savedInternship }
    });
  } catch (error) {
    console.error('❌ Error creating internship:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error creating internship"
    });
  }
};

// ============================================
// GET ALL INTERNSHIPS (Public with filters)
// ============================================
exports.getAllInternships = async (req, res) => {
  try {
    const { 
      department,
      workMode,
      location, 
      minStipend, 
      skill,
      search
    } = req.query;

    // Base filter - only active internships that haven't passed deadline
    let filter = { 
      status: 'active',
      deadline: { $gt: new Date() },
      $expr: { $lt: ["$filledPositions", "$positions"] }
    };

    // Apply filters
    if (department) filter.department = department;
    if (workMode) filter.workMode = workMode;
    if (location) filter.location = { $regex: location, $options: 'i' };
    
    // Stipend filter
    if (minStipend) {
      filter.stipend = { $gte: parseInt(minStipend) };
    }

    // Skill filter
    if (skill) {
      filter['skillsRequired.name'] = { $regex: skill, $options: 'i' };
    }

    // Search in title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const internships = await Internship.find(filter)
      .populate('mentorId', 'fullName email department designation')
      .populate('postedBy', 'fullName')
      .sort({ createdAt: -1 });

    // Add application status for logged-in students
    let internshipsWithStatus = internships;
    if (req.user && req.user.role === 'student') {
      const applications = await Application.find({ 
        studentId: req.user.id,
        internshipId: { $in: internships.map(i => i._id) }
      });
      
      const appliedIds = new Set(applications.map(a => a.internshipId.toString()));
      
      internshipsWithStatus = internships.map(internship => {
        const internshipObj = internship.toObject();
        internshipObj.hasApplied = appliedIds.has(internship._id.toString());
        return internshipObj;
      });
    }

    res.status(200).json({
      success: true,
      data: { internships: internshipsWithStatus }
    });
  } catch (error) {
    console.error('❌ Error fetching internships:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching internships"
    });
  }
};

// ============================================
// GET RECRUITER'S INTERNSHIPS
// ============================================
exports.getRecruiterInternships = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    
    const internships = await Internship.find({ postedBy: recruiterId })
      .sort({ createdAt: -1 });

    // Add application counts
    const internshipsWithStats = await Promise.all(internships.map(async (internship) => {
      const applications = await Application.countDocuments({ internshipId: internship._id });
      const pending = await Application.countDocuments({ 
        internshipId: internship._id, 
        status: 'pending' 
      });
      
      return {
        ...internship.toObject(),
        stats: {
          totalApplications: applications,
          pendingApplications: pending
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: { internships: internshipsWithStats }
    });
  } catch (error) {
    console.error('❌ Error fetching recruiter internships:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching internships"
    });
  }
};

// ============================================
// GET SINGLE INTERNSHIP BY ID
// ============================================
exports.getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('mentorId', 'fullName email department designation')
      .populate('postedBy', 'fullName email');

    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Increment view count
    internship.viewCount += 1;
    await internship.save();

    let hasApplied = false;
    if (req.user && req.user.role === 'student') {
      const application = await Application.findOne({
        studentId: req.user.id,
        internshipId: internship._id
      });
      hasApplied = !!application;
    }

    res.status(200).json({
      success: true,
      data: { 
        internship,
        hasApplied 
      }
    });
  } catch (error) {
    console.error('❌ Error fetching internship:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching internship"
    });
  }
};

// ============================================
// UPDATE INTERNSHIP
// ============================================
exports.updateInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user.id;

    const internship = await Internship.findById(id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Check ownership
    if (internship.postedBy.toString() !== recruiterId && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own internships'
      });
    }

    const updates = req.body;

    // Prevent changing critical fields
    delete updates.companyId;
    delete updates.department;
    delete updates.postedBy;
    delete updates.mentorId;
    delete updates.filledPositions;

    // Process skills if being updated
    if (updates.skillsRequired) {
      updates.skillsRequired = updates.skillsRequired.map(skill => {
        if (typeof skill === 'string') {
          return { name: skill, level: 'beginner' };
        }
        return {
          name: skill.name || '',
          level: skill.level || 'beginner'
        };
      }).filter(skill => skill.name);
    }

    const updatedInternship = await Internship.findByIdAndUpdate(
      id,
      { ...updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Internship updated successfully",
      data: { internship: updatedInternship }
    });
  } catch (error) {
    console.error('❌ Error updating internship:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error updating internship"
    });
  }
};

// ============================================
// DELETE INTERNSHIP
// ============================================
exports.deleteInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user.id;

    const internship = await Internship.findById(id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Check ownership
    if (internship.postedBy.toString() !== recruiterId && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own internships'
      });
    }

    // Check if there are any accepted applications
    const acceptedApps = await Application.countDocuments({
      internshipId: id,
      status: 'accepted'
    });

    if (acceptedApps > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete internship with accepted candidates. Close it instead.'
      });
    }

    await Internship.findByIdAndDelete(id);
    
    // Delete related applications
    await Application.deleteMany({ internshipId: id });

    // Update company stats (non-blocking)
    try {
      const company = await Company.findOne();
      if (company) {
        company.stats.totalInternships = Math.max(0, (company.stats.totalInternships || 1) - 1);
        if (internship.status === 'active') {
          company.stats.activeInternships = Math.max(0, (company.stats.activeInternships || 1) - 1);
        }
        await company.save();
      }
    } catch (companyError) {
      console.log('⚠️ Company stats update failed (non-critical):', companyError.message);
    }

    res.status(200).json({
      success: true,
      message: "Internship deleted successfully"
    });
  } catch (error) {
    console.error('❌ Error deleting internship:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error deleting internship"
    });
  }
};

// ============================================
// CLOSE INTERNSHIP
// ============================================
exports.closeInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user.id;

    console.log(`🔍 Attempting to close internship: ${id}`);

    const internship = await Internship.findById(id);
    
    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    // Check ownership
    if (internship.postedBy.toString() !== recruiterId && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'You can only close your own internships'
      });
    }

    // Check if already closed
    if (internship.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Internship is already closed'
      });
    }

    // Update status
    internship.status = 'closed';
    
    // Save with error handling
    await internship.save();

    console.log(`✅ Internship ${id} closed successfully`);

    // Update company stats (non-blocking)
    try {
      const company = await Company.findOne();
      if (company) {
        company.stats.activeInternships = Math.max(0, (company.stats.activeInternships || 1) - 1);
        await company.save();
      }
    } catch (companyError) {
      console.log('⚠️ Company stats update failed (non-critical):', companyError.message);
    }

    res.status(200).json({
      success: true,
      message: "Internship closed successfully",
      data: { internship }
    });
  } catch (error) {
    console.error('❌ Error closing internship:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Error closing internship"
    });
  }
};

// ============================================
// GET DEPARTMENT-WISE STATS
// ============================================
exports.getDepartmentStats = async (req, res) => {
  try {
    const stats = await Internship.aggregate([
      { $match: { status: 'active' } },
      { $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgStipend: { $avg: '$stipend' },
        totalPositions: { $sum: '$positions' }
      }}
    ]);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('❌ Error getting department stats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================
// HELPER METHODS
// ============================================

/**
 * Auto-close internship if filled
 * This should be called after accepting an application
 */
exports.checkAndCloseInternship = async (internshipId) => {
  try {
    const internship = await Internship.findById(internshipId);
    if (!internship) return;

    if (internship.filledPositions >= internship.positions && internship.status !== 'closed') {
      internship.status = 'closed';
      await internship.save();
      
      // Update company stats
      const company = await Company.findOne();
      if (company) {
        company.stats.activeInternships = Math.max(0, (company.stats.activeInternships || 1) - 1);
        await company.save();
      }
      
      console.log(`✅ Internship ${internshipId} auto-closed (all positions filled)`);
    }
  } catch (error) {
    console.error('⚠️ Error auto-closing internship:', error);
  }
};

/**
 * Update milestone statuses (for active internships)
 * This should be called daily by a cron job or when viewing milestones
 */
exports.updateMilestoneStatuses = async (internshipId) => {
  try {
    const internship = await Internship.findById(internshipId);
    if (!internship || !internship.milestones || internship.milestones.length === 0) return;

    const now = new Date();
    let updated = false;

    internship.milestones.forEach(milestone => {
      if (milestone.status === 'pending' && milestone.dueDate < now) {
        milestone.status = 'overdue';
        updated = true;
      }
    });

    if (updated) {
      internship.markModified('milestones');
      await internship.save();
    }
  } catch (error) {
    console.error('⚠️ Error updating milestone statuses:', error);
  }
};

/**
 * Calculate total days from dates
 */
exports.calculateTotalDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

/**
 * Validate internship dates
 */
exports.validateInternshipDates = (startDate, endDate, deadline) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const deadlineDate = deadline ? new Date(deadline) : null;
  const now = new Date();

  if (start < now) {
    return { valid: false, message: "Start date cannot be in the past" };
  }
  if (end <= start) {
    return { valid: false, message: "End date must be after start date" };
  }
  if (deadlineDate && deadlineDate > start) {
    return { valid: false, message: "Deadline must be before start date" };
  }
  return { valid: true };
};

/**
 * Process skills input (reusable)
 */
exports.processSkills = (skillsRequired) => {
  if (!skillsRequired) return [];
  
  if (Array.isArray(skillsRequired)) {
    return skillsRequired.map(skill => {
      if (typeof skill === 'string') {
        return { name: skill, level: 'beginner' };
      }
      return {
        name: skill.name || '',
        level: skill.level || 'beginner'
      };
    }).filter(skill => skill.name);
  }
  return [];
};

/**
 * Get internships ending soon (within 15 days)
 */
exports.getInternshipsEndingSoon = async () => {
  try {
    const now = new Date();
    const fifteenDaysLater = new Date();
    fifteenDaysLater.setDate(now.getDate() + 15);

    const internships = await Internship.find({
      status: 'active',
      endDate: { $gte: now, $lte: fifteenDaysLater }
    }).populate('mentorId', 'fullName email');

    return internships;
  } catch (error) {
    console.error('⚠️ Error fetching ending soon internships:', error);
    return [];
  }
};

/**
 * Get internship application funnel stats
 */
exports.getInternshipFunnelStats = async (internshipId) => {
  try {
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

    return funnel;
  } catch (error) {
    console.error('⚠️ Error getting funnel stats:', error);
    return null;
  }
};

/**
 * Check if recruiter can post internship in their department
 */
exports.canPostInDepartment = (recruiter, requestedDepartment) => {
  // HR can post anywhere, recruiters only in their department
  if (recruiter.role === 'hr') return true;
  return recruiter.department === requestedDepartment;
};