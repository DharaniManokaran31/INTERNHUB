const mongoose = require("mongoose");

// ===== SUB-SCHEMAS =====
const EducationSchema = new mongoose.Schema({
  institution: { 
    type: String, 
    required: [true, "Institution name is required"],
    trim: true 
  },
  degree: { 
    type: String, 
    required: [true, "Degree is required"],
    trim: true 
  },
  field: { 
    type: String, 
    trim: true 
  },
  startDate: { 
    type: Date, 
    required: [true, "Start date is required"] 
  },
  endDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.startDate;
      },
      message: "End date must be after start date"
    }
  },
  gpa: { 
    type: Number, 
    min: [0, "GPA cannot be negative"],
    max: [10, "GPA cannot exceed 10"]
  },
  description: { 
    type: String,
    trim: true 
  }
}, { timestamps: true });

const ExperienceSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Job title is required"],
    trim: true 
  },
  company: { 
    type: String, 
    required: [true, "Company name is required"],
    trim: true 
  },
  location: { 
    type: String,
    trim: true 
  },
  startDate: { 
    type: Date, 
    required: [true, "Start date is required"] 
  },
  endDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.startDate;
      },
      message: "End date must be after start date"
    }
  },
  current: { 
    type: Boolean, 
    default: false 
  },
  description: { 
    type: String, 
    required: [true, "Job description is required"],
    trim: true 
  },
  skills: [{ 
    type: String,
    trim: true 
  }]
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Project title is required"],
    trim: true 
  },
  description: { 
    type: String, 
    required: [true, "Project description is required"],
    trim: true 
  },
  technologies: [{ 
    type: String,
    required: [true, "At least one technology is required"],
    trim: true 
  }],
  github: { 
    type: String,
    trim: true,
    match: [/^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/, "Invalid GitHub URL"]
  },
  demo: { 
    type: String,
    trim: true,
    match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Invalid demo URL"]
  }
}, { timestamps: true });

const CertificationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Certificate name is required"],
    trim: true 
  },
  issuer: { 
    type: String, 
    required: [true, "Issuing organization is required"],
    trim: true 
  },
  date: { 
    type: Date, 
    required: [true, "Issue date is required"] 
  },
  expiryDate: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.date;
      },
      message: "Expiry date must be after issue date"
    }
  },
  credentialId: { 
    type: String,
    trim: true 
  },
  link: { 
    type: String,
    trim: true,
    match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Invalid certificate URL"]
  },
  certificateUrl: { 
    type: String,
    trim: true 
  }
}, { timestamps: true });

const SkillsCategorySchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: [true, "Skill category is required"],
    enum: {
      values: ['Programming Languages', 'Frameworks', 'Databases', 'Tools', 'Soft Skills', 'Languages'],
      message: "{VALUE} is not a valid category"
    }
  },
  items: [{ 
    type: String,
    required: [true, "At least one skill is required"],
    trim: true 
  }]
}, { timestamps: true });

// ===== MAIN STUDENT SCHEMA =====
const StudentSchema = new mongoose.Schema(
  {
    fullName: { 
      type: String, 
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    
    email: { 
      type: String, 
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    
    password: { 
      type: String, 
      required: [true, "Password is required"],
      select: false,
      minlength: [6, "Password must be at least 6 characters"]
    },

    role: {
      type: String,
      enum: ['student'],
      default: 'student',
      required: true
    },

    phone: { 
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
      default: ''
    },
    
    location: { 
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
      default: ''
    },

    currentEducation: {
      college: { 
        type: String,
        trim: true,
        default: ''
      },
      department: { 
        type: String,
        trim: true,
        default: ''
      },
      yearOfStudy: {
        type: String,
        enum: {
          values: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduated"],
          message: "{VALUE} is not a valid year"
        },
        default: "1st Year"
      },
      course: { 
        type: String,
        trim: true,
        default: ''
      },
      specialization: { 
        type: String,
        trim: true,
        default: ''
      }
    },
    
    expectedGraduation: { 
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v > new Date();
        },
        message: "Expected graduation must be in the future"
      }
    },

    linkedin: { 
      type: String,
      trim: true,
      default: ''
    },
    
    github: { 
      type: String,
      trim: true,
      default: ''
    },
    
    portfolio: { 
      type: String,
      trim: true,
      default: ''
    },

    profilePicture: { 
      type: String,
      trim: true,
      default: ''
    },

    skills: [{ 
      type: String,
      trim: true 
    }],

    resume: {
      education: [EducationSchema],
      experience: [ExperienceSchema],
      projects: [ProjectSchema],
      skills: [SkillsCategorySchema],
      certifications: [CertificationSchema],
      
      resumeFile: { 
        type: String,
        trim: true,
        default: ''
      },
      
      resumeFileName: { 
        type: String,
        trim: true,
        default: ''
      },
      
      lastUpdated: { 
        type: Date,
        default: Date.now
      }
    },

    profileCompletion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    isActive: { 
      type: Boolean, 
      default: true 
    },
    
    isEmailVerified: { 
      type: Boolean, 
      default: false 
    },
    
    emailVerificationToken: {
      type: String,
      default: null
    },
    emailVerificationExpires: {
      type: Date,
      default: null
    },

    resetPasswordToken: { 
      type: String,
      select: false,
      default: null
    },
    
    resetPasswordExpires: { 
      type: Date,
      select: false,
      default: null
    },

    lastLoginAt: {
      type: Date,
      default: null
    },
    lastActiveAt: {
      type: Date,
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        return ret;
      }
    }
  }
);

// ===== INDEXES =====
StudentSchema.index({ skills: 1 });
StudentSchema.index({ 'currentEducation.yearOfStudy': 1 });
StudentSchema.index({ createdAt: -1 });
StudentSchema.index({ isActive: 1, isEmailVerified: 1 });

// ===== VIRTUALS =====
StudentSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.fullName,
    email: this.email,
    phone: this.phone,
    location: this.location,
    profilePicture: this.profilePicture,
    education: this.currentEducation || {},
    skills: this.skills || []
  };
});

StudentSchema.virtual('resumeSummary').get(function() {
  return {
    hasResume: !!(this.resume && this.resume.resumeFile),
    resumeFileName: this.resume?.resumeFileName || '',
    lastUpdated: this.resume?.lastUpdated || null,
    educationCount: this.resume?.education?.length || 0,
    experienceCount: this.resume?.experience?.length || 0,
    projectsCount: this.resume?.projects?.length || 0,
    certificationsCount: this.resume?.certifications?.length || 0
  };
});

// ===== INSTANCE METHODS =====
StudentSchema.methods.calculateProfileCompletion = function() {
  try {
    let score = 0;
    let total = 7;
    
    if (this.fullName) score++;
    if (this.email) score++;
    if (this.phone) score++;
    if (this.location) score++;
    if (this.currentEducation?.college) score++;
    if (this.skills && this.skills.length > 0) score++;
    if (this.resume?.resumeFile) score++;
    
    return Math.round((score / total) * 100);
  } catch (error) {
    console.error('Error calculating profile completion:', error);
    return 0;
  }
};

StudentSchema.methods.isProfileComplete = function(threshold = 70) {
  return this.calculateProfileCompletion() >= threshold;
};

StudentSchema.methods.getMissingFields = function() {
  const missing = [];
  
  if (!this.phone) missing.push('Phone Number');
  if (!this.location) missing.push('Location');
  if (!this.currentEducation?.college) missing.push('College');
  if (!this.currentEducation?.department) missing.push('Department');
  if (!this.skills || this.skills.length === 0) missing.push('Skills');
  if (!this.resume?.resumeFile) missing.push('Resume Upload');
  
  return missing;
};

StudentSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  return obj;
};

// ===== STATIC METHODS =====
StudentSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

StudentSchema.statics.findActiveWithCompleteProfiles = function() {
  return this.find({ 
    isActive: true, 
    profileCompletion: { $gte: 70 } 
  }).sort({ profileCompletion: -1 });
};

// ⚠️ NO PRE-SAVE HOOK - We'll handle profile completion in the controller

module.exports = mongoose.model("Student", StudentSchema);