const Internship = require("../models/Internship");

// ----------------------
// Create Internship - UPDATED with new fields
// ----------------------
const createInternship = async (req, res) => {
  try {
    const {
      title,
      companyName,
      location,
      type,
      category,        // ✅ NEW
      stipend,
      duration,
      description,
      skillsRequired,  // ✅ Now can be array of {name, level} or array of strings
      requirements,    // ✅ NEW
      perks,          // ✅ NEW
      deadline,
      postedBy,
      status          // ✅ NEW
    } = req.body;

    // Basic validation
    if (!title || !companyName || !location || !type || !duration || !description) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Validate deadline
    const deadlineDate = deadline ? new Date(deadline) : null;
    if (deadline && isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid deadline date" });
    }

    // ✅ NEW: Process skills to ensure backward compatibility
    let processedSkills = [];
    if (skillsRequired) {
      if (Array.isArray(skillsRequired)) {
        processedSkills = skillsRequired.map(skill => {
          // If skill is string (old format), convert to object
          if (typeof skill === 'string') {
            return {
              name: skill,
              level: 'beginner'
            };
          }
          // If skill is already object, use as is
          return {
            name: skill.name || '',
            level: skill.level || 'beginner'
          };
        }).filter(skill => skill.name); // Remove empty skills
      }
    }

    const internship = new Internship({
      title,
      companyName,
      location,
      type,
      category: category || 'other',     // ✅ NEW with default
      stipend: stipend || "Unpaid",
      duration,
      description,
      skillsRequired: processedSkills,   // ✅ UPDATED
      requirements: requirements || [],  // ✅ NEW
      perks: perks || [],               // ✅ NEW
      deadline: deadlineDate,
      postedBy: postedBy || null,
      status: status || 'active'        // ✅ NEW
    });

    const savedInternship = await internship.save();

    res.status(201).json({
      success: true,
      message: "Internship created successfully",
      data: {
        internship: savedInternship
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error creating internship",
      error: error.message 
    });
  }
};

// ----------------------
// Update Internship - NEW FUNCTION
// ----------------------
const updateInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

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

    const internship = await Internship.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Internship updated successfully",
      data: { internship }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error updating internship",
      error: error.message 
    });
  }
};

// ----------------------
// Get All Internships - UPDATED with filters
// ----------------------
const getAllInternships = async (req, res) => {
  try {
    const { 
      category, 
      location, 
      type, 
      minStipend, 
      skill, 
      status = 'active' 
    } = req.query;

    // Build filter object
    let filter = { status };

    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (type) filter.type = { $regex: type, $options: 'i' };
    
    // Filter by stipend (parse numeric value from string)
    if (minStipend) {
      filter.$expr = {
        $gte: [
          { $toInt: { $regexFind: { input: "$stipend", regex: /\d+/ } } },
          parseInt(minStipend)
        ]
      };
    }

    // Filter by skill
    if (skill) {
      filter['skillsRequired.name'] = { $regex: skill, $options: 'i' };
    }

    const internships = await Internship.find(filter)
      .populate('postedBy', 'companyName fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { internships }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching internships",
      error: error.message 
    });
  }
};

// ----------------------
// Get Single Internship by ID - UPDATED
// ----------------------
const getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('postedBy', 'companyName fullName email');

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
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching internship",
      error: error.message 
    });
  }
};

// ----------------------
// Delete Internship - NEW FUNCTION
// ----------------------
const deleteInternship = async (req, res) => {
  try {
    const internship = await Internship.findByIdAndDelete(req.params.id);

    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Internship deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting internship",
      error: error.message 
    });
  }
};

// ----------------------
// Close Internship - NEW FUNCTION
// ----------------------
const closeInternship = async (req, res) => {
  try {
    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { status: 'closed', updatedAt: Date.now() },
      { new: true }
    );

    if (!internship) {
      return res.status(404).json({ 
        success: false,
        message: "Internship not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Internship closed successfully",
      data: { internship }
    });
  } catch (error) {
    console.error(error);
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
  updateInternship,    // ✅ NEW
  deleteInternship,    // ✅ NEW
  closeInternship,     // ✅ NEW
};