const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      default: "Zoyaraa",
      required: true,
      trim: true,
      unique: true
    },
    
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true
    },
    
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"]
    },
    
    website: {
      type: String,
      trim: true
    },

    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'India' },
      pincode: String
    },

    description: {
      type: String,
      trim: true
    },
    
    logo: {
      type: String,
      default: ''
    },

    gstNumber: String,
    panNumber: String,

    industry: {
      type: String,
      enum: ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Other'],
      default: 'Technology'
    },

    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
      default: '51-200'
    },

    foundedYear: Number,

    socialMedia: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String
    },

    hrId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Recruiter' 
    },

    hrTeam: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter'
    }],

    departments: [{
      name: {
        type: String,
        enum: ['Frontend', 'Backend', 'DevOps', 'Marketing', 'HR', 'Sales', 'UI/UX', 'Mobile']
      },
      description: String,
      isActive: { type: Boolean, default: true }
    }],

    verificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified'
    },
    
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    verifiedAt: Date,

    documents: [{
      type: { type: String },
      url: String,
      filename: String,
      verified: { type: Boolean, default: false },
      uploadedAt: { type: Date, default: Date.now }
    }],

    settings: {
      allowMultipleApplications: { type: Boolean, default: true },
      requireResume: { type: Boolean, default: true },
      requireCoverLetter: { type: Boolean, default: false },
      maxRecruiters: { type: Number, default: 50 },
      internshipDuration: { type: Number, default: 90 },
      stipendRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 50000 }
      }
    },

    stats: {
      totalInternships: { type: Number, default: 0 },
      activeInternships: { type: Number, default: 0 },
      totalRecruiters: { type: Number, default: 0 },
      totalStudentsHired: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===== REMOVED THE PROBLEMATIC PRE-SAVE HOOK =====
// The error was coming from here - we'll handle company creation in the controller/script instead

module.exports = mongoose.model('Company', companySchema);