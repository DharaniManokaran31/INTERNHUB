// backend/models/Internship.js
const mongoose = require("mongoose");

// ===== SUB-SCHEMAS =====
const SelectionProcessSchema = new mongoose.Schema({
  round: { 
    type: Number, 
    required: [true, "Round number is required"],
    min: [1, "Round number must be at least 1"]
  },
  type: {
    type: String,
    enum: {
      values: ['Technical Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Assignment'],
      message: "{VALUE} is not a valid round type"
    },
    required: [true, "Round type is required"]
  },
  duration: {
    type: String,
    trim: true
  },
  details: {
    type: String,
    trim: true,
    maxlength: [1000, "Details cannot exceed 1000 characters"]
  }
});

const SkillRequirementSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Skill name is required"],
    trim: true 
  },
  level: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: "{VALUE} is not a valid skill level"
    },
    default: 'beginner'
  }
});

const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Milestone title is required"],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  dueDate: {
    type: Date,
    required: [true, "Due date is required"]
  },
  completedDate: Date,
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'completed', 'overdue'],
      message: "{VALUE} is not a valid status"
    },
    default: 'pending' 
  }
});

// ===== MAIN INTERNSHIP SCHEMA =====
const InternshipSchema = new mongoose.Schema(
  {
    // Basic Information
    title: { 
      type: String, 
      required: [true, "Internship title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    
    description: { 
      type: String, 
      required: [true, "Description is required"],
      trim: true,
      minlength: [50, "Description must be at least 50 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"]
    },

    // Company Information
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"]
    },
    
    companyName: { 
      type: String, 
      required: [true, "Company name is required"],
      trim: true 
    },

    // Department & Mentor
    department: {
      type: String,
      enum: {
        values: ['Frontend', 'Backend', 'DevOps', 'Marketing', 'HR', 'Sales', 'UI/UX', 'Mobile'],
        message: "{VALUE} is not a valid department"
      },
      required: [true, "Department is required"]
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: [true, "Mentor ID is required"]
    },

    // Work Details
    workMode: {
      type: String,
      enum: {
        values: ['Remote', 'Hybrid', 'Onsite'],
        message: "{VALUE} is not a valid work mode"
      },
      required: [true, "Work mode is required"]
    },

    location: { 
      type: String, 
      required: [true, "Location is required"],
      trim: true 
    },

    officeLocation: {
      type: String,
      trim: true
    },

    dailyTimings: {
      type: String,
      default: "10:00 AM - 6:00 PM",
      trim: true
    },

    weeklyOff: {
      type: String,
      default: "Saturday, Sunday",
      trim: true
    },

    // Duration & Dates
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function(v) {
          return v >= new Date().setHours(0,0,0,0);
        },
        message: "Start date cannot be in the past"
      }
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function(v) {
          return v > this.startDate;
        },
        message: "End date must be after start date"
      }
    },

    duration: {
      type: Number, // in months
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 month"],
      max: [12, "Duration cannot exceed 12 months"]
    },

    deadline: { 
      type: Date, 
      required: [true, "Application deadline is required"],
      validate: {
        validator: function(v) {
          return v < this.startDate;
        },
        message: "Deadline must be before start date"
      }
    },

    // Stipend & Positions
    stipend: {
      type: Number,
      default: 0,
      min: [0, "Stipend cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stipend must be a whole number"
      }
    },

    positions: {
      type: Number,
      default: 1,
      min: [1, "At least 1 position required"],
      max: [100, "Cannot exceed 100 positions"],
      validate: {
        validator: Number.isInteger,
        message: "Positions must be a whole number"
      }
    },

    filledPositions: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function(v) {
          return v <= this.positions;
        },
        message: "Filled positions cannot exceed total positions"
      }
    },

    // Requirements & Skills
    skillsRequired: [SkillRequirementSchema],

    requirements: [{
      type: String,
      trim: true
    }],

    perks: [{
      type: String,
      trim: true
    }],

    // Selection Process
    selectionProcess: [SelectionProcessSchema],

    // Posted By
    postedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Recruiter", 
      required: [true, "Posted by is required"] 
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['active', 'closed', 'paused', 'draft'],
        message: "{VALUE} is not a valid status"
      },
      default: 'draft',
      required: true
    },

    // ===== PROGRESS TRACKING (for active internships) =====
    totalDays: { 
      type: Number,
      validate: {
        validator: function(v) {
          return v >= 0;
        },
        message: "Total days cannot be negative"
      }
    },
    
    completedDays: { 
      type: Number, 
      default: 0,
      min: 0,
      validate: {
        validator: function(v) {
          return v <= this.totalDays;
        },
        message: "Completed days cannot exceed total days"
      }
    },

    milestones: [MilestoneSchema],

    internDetails: {
      startDate: Date,
      expectedEndDate: Date,
      actualEndDate: Date,
      status: { 
        type: String, 
        enum: {
          values: ['active', 'completed', 'terminated'],
          message: "{VALUE} is not a valid intern status"
        }
      }
    },

    // View Count
    viewCount: {
      type: Number,
      default: 0
    },

    applicationCount: {
      type: Number,
      default: 0
    },

    // Legacy field (kept for compatibility)
    type: { 
      type: String,
      required: true,
      enum: {
        values: ['Remote', 'On-site', 'Hybrid'],
        message: "{VALUE} is not a valid type"
      }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===== INDEXES FOR PERFORMANCE =====
InternshipSchema.index({ companyId: 1, status: 1 });
InternshipSchema.index({ mentorId: 1 });
InternshipSchema.index({ department: 1, status: 1 });
InternshipSchema.index({ skillsRequired: 1 });
InternshipSchema.index({ stipend: -1 });
InternshipSchema.index({ createdAt: -1 });
InternshipSchema.index({ deadline: 1 });
InternshipSchema.index({ status: 1, deadline: 1 });

// ===== VIRTUALS =====
InternshipSchema.virtual('remainingPositions').get(function() {
  return this.positions - this.filledPositions;
});

InternshipSchema.virtual('isAcceptingApplications').get(function() {
  return this.status === 'active' && 
         this.deadline > new Date() && 
         this.filledPositions < this.positions;
});

InternshipSchema.virtual('progressPercentage').get(function() {
  if (!this.totalDays) return 0;
  return Math.round((this.completedDays / this.totalDays) * 100);
});

InternshipSchema.virtual('durationInWords').get(function() {
  if (this.duration < 1) return `${this.duration * 30} days`;
  return this.duration === 1 ? '1 month' : `${this.duration} months`;
});

// ===== PRE-SAVE HOOKS - FIXED with Async/Await (NO next parameter) =====
// Using async function - no 'next' parameter needed
InternshipSchema.pre('save', async function() {
  try {
    // Calculate total days from start/end date
    if (this.startDate && this.endDate && !this.totalDays) {
      const diffTime = Math.abs(this.endDate - this.startDate);
      this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Ensure filledPositions doesn't exceed positions
    if (this.filledPositions > this.positions) {
      this.filledPositions = this.positions;
    }

    // Auto-calculate duration if not provided (in months)
    if (this.startDate && this.endDate && !this.duration) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const diffTime = Math.abs(end - start);
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      this.duration = diffMonths;
    }
    
    // Ensure applicationCount is a number
    if (typeof this.applicationCount !== 'number') {
      this.applicationCount = 0;
    }

    // Update status based on filled positions
    if (this.filledPositions >= this.positions && this.status !== 'closed') {
      this.status = 'closed';
    }
    
    // No need to call next() - async function handles it
  } catch (error) {
    console.error('Error in internship pre-save hook:', error);
    throw error; // Let Mongoose handle the error
  }
});

// ===== INSTANCE METHODS =====
/**
 * Increment view count
 */
InternshipSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  return this.save();
};

/**
 * Increment application count
 */
InternshipSchema.methods.incrementApplications = async function() {
  this.applicationCount += 1;
  return this.save();
};

/**
 * Check if student can apply
 */
InternshipSchema.methods.canApply = function() {
  return this.status === 'active' && 
         this.deadline > new Date() && 
         this.filledPositions < this.positions;
};

/**
 * Get application funnel stats
 */
InternshipSchema.methods.getFunnelStats = async function() {
  const stats = await mongoose.model('Application').aggregate([
    { $match: { internshipId: this._id } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 }
    }}
  ]);
  
  const funnel = {
    total: this.applicationCount,
    pending: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0
  };
  
  stats.forEach(stat => {
    funnel[stat._id] = stat.count;
  });
  
  return funnel;
};

/**
 * Auto-close if filled (controller should call this)
 */
InternshipSchema.methods.checkAndClose = function() {
  if (this.filledPositions >= this.positions && this.status !== 'closed') {
    this.status = 'closed';
  }
  return this;
};

/**
 * Update milestone statuses (controller should call this)
 */
InternshipSchema.methods.updateMilestoneStatuses = function() {
  if (this.milestones && this.milestones.length > 0) {
    const now = new Date();
    let updated = false;
    
    this.milestones.forEach(milestone => {
      if (milestone.status === 'pending' && milestone.dueDate < now) {
        milestone.status = 'overdue';
        updated = true;
      }
    });
    
    if (updated) {
      this.markModified('milestones');
    }
  }
  return this;
};

// ===== STATIC METHODS =====
/**
 * Find active internships with filters
 */
InternshipSchema.statics.findActive = function(filters = {}) {
  const query = { 
    status: 'active',
    deadline: { $gt: new Date() },
    ...filters
  };
  
  return this.find(query)
    .populate('mentorId', 'fullName email department')
    .populate('companyId', 'name logo')
    .sort({ createdAt: -1 });
};

/**
 * Get internships by mentor
 */
InternshipSchema.statics.findByMentor = function(mentorId) {
  return this.find({ mentorId })
    .sort({ createdAt: -1 })
    .populate('companyId', 'name logo');
};

/**
 * Search internships by keyword
 */
InternshipSchema.statics.search = function(keyword) {
  return this.find({
    $or: [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { skillsRequired: { $elemMatch: { name: { $regex: keyword, $options: 'i' } } } }
    ],
    status: 'active'
  }).populate('mentorId', 'fullName');
};

/**
 * Get department wise stats
 */
InternshipSchema.statics.getDepartmentStats = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    { $group: {
      _id: '$department',
      count: { $sum: 1 },
      avgStipend: { $avg: '$stipend' },
      totalPositions: { $sum: '$positions' }
    }}
  ]);
};

module.exports = mongoose.model("Internship", InternshipSchema);