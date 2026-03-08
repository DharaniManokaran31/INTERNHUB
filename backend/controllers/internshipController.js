const Internship = require("../models/Internship");
const Recruiter = require("../models/Recruiter");
const Company = require("../models/Company");

// ----------------------
// Create Internship - UPDATED with Zoyaraa fields
// ----------------------
const createInternship = async (req, res) => {
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

    // Check if recruiter has permission to post internships
    if (!recruiter.permissions?.canPostInternship) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to post internships'
      });
    }

    // Get company
    const company = await Company.findOne({});
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const {
      title,
      location,
      type,
      category,
      description,
      skillsRequired,
      requirements,
      perks,
      deadline,
      
      // New Zoyaraa fields
      workMode,
      officeLocation,
      dailyTimings,
      weeklyOff,
      startDate,
      endDate,
      duration,
      stipend,
      positions,
      selectionProcess
    } = req.body;

    // Basic validation
    if (!title || !location || !type || !description || !startDate || !endDate || !duration || !workMode) {
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

    if (deadline && isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid deadline date" 
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

    const internship = new Internship({
      title,
      companyName: company.name,
      location,
      type,
      category: category || 'other',
      description,
      skillsRequired: processedSkills,
      requirements: requirements || [],
      perks: perks || [],
      deadline: deadlineDate,
      postedBy: recruiterId,
      status: 'active',
      
      // Zoyaraa specific fields
      companyId: company._id,
      department: recruiter.department,
      mentorId: recruiterId,
      workMode,
      officeLocation: officeLocation || '',
      dailyTimings: dailyTimings || "10 AM - 6 PM",
      weeklyOff: weeklyOff || "Saturday, Sunday",
      startDate: start,
      endDate: end,
      duration: parseInt(duration),
      stipend: stipend ? parseInt(stipend) : 0,
      positions: positions ? parseInt(positions) : 1,
      filledPositions: 0,
      selectionProcess: selectionProcess || []
    });

    const savedInternship = await internship.save();

    res.status(201).json({
      success: true,
      message: "Internship created successfully",
      data: { internship: savedInternship }
    });
  } catch (error) {
    console.error('Error creating internship:', error);
    res.status(500).json({ 
      success: false,
      message: "Error creating internship",
      error: error.message 
    });
  }
};

// ----------------------
// Update Internship
// ----------------------
const updateInternship = async (req, res) => {
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

    // Check if this internship belongs to the recruiter
    if (internship.postedBy.toString() !== recruiterId) {
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

    // Process skills if they're being updated
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
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Internship updated successfully",
      data: { internship: updatedInternship }
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    res.status(500).json({ 
      success: false,
      message: "Error updating internship",
      error: error.message 
    });
  }
};

// ----------------------
// Get All Internships (Public)
// ----------------------
const getAllInternships = async (req, res) => {
  try {
    const { 
      department,
      workMode,
      category, 
      location, 
      type, 
      minStipend, 
      skill, 
      status = 'active' 
    } = req.query;

    let filter = { status };

    if (department) filter.department = department;
    if (workMode) filter.workMode = workMode;
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (type) filter.type = { $regex: type, $options: 'i' };
    
    // Filter by stipend
    if (minStipend) {
      filter.stipend = { $gte: parseInt(minStipend) };
    }

    // Filter by skill
    if (skill) {
      filter['skillsRequired.name'] = { $regex: skill, $options: 'i' };
    }

    const internships = await Internship.find(filter)
      .populate('postedBy', 'fullName email department')
      .populate('mentorId', 'fullName email department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { internships }
    });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching internships",
      error: error.message 
    });
  }
};

// ----------------------
// Get internships for a specific recruiter (with department filter)
// ----------------------
const getRecruiterInternships = async (req, res) => {
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

    // Filter by recruiter ID AND department (extra safety)
    const query = { 
      postedBy: recruiterId,
      department: recruiter.department
    };

    const internships = await Internship.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { internships }
    });
  } catch (error) {
    console.error('Error in getRecruiterInternships:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching recruiter internships",
      error: error.message
    });
  }
};

// ----------------------
// Get Single Internship by ID
// ----------------------
const getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('postedBy', 'fullName email department')
      .populate('mentorId', 'fullName email department');

    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: { internship }
    });
  } catch (error) {
    console.error('Error fetching internship:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching internship",
      error: error.message 
    });
  }
};

// ----------------------
// Delete Internship
// ----------------------
const deleteInternship = async (req, res) => {
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

    // Check if this internship belongs to the recruiter
    if (internship.postedBy.toString() !== recruiterId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own internships'
      });
    }

    await Internship.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Internship deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting internship:', error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting internship",
      error: error.message 
    });
  }
};

// ----------------------
// Close Internship
// ----------------------
const closeInternship = async (req, res) => {
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

    // Check if this internship belongs to the recruiter
    if (internship.postedBy.toString() !== recruiterId) {
      return res.status(403).json({
        success: false,
        message: 'You can only close your own internships'
      });
    }

    internship.status = 'closed';
    await internship.save();

    res.status(200).json({
      success: true,
      message: "Internship closed successfully",
      data: { internship }
    });
  } catch (error) {
    console.error('Error closing internship:', error);
    res.status(500).json({ 
      success: false,
      message: "Error closing internship",
      error: error.message 
    });
  }
};

module.exports = {
  createInternship,
  getAllInternships,
  getInternshipById,
  getRecruiterInternships,
  updateInternship,
  deleteInternship,
  closeInternship
};