const mongoose = require("mongoose");

const InternshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    companyName: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true }, // Remote, On-site, Hybrid
    
    // ✅ ZOYARAA-SPECIFIC FIELDS
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Company",
      required: true
    },
    
    department: { 
      type: String, 
      enum: ['Frontend', 'Backend', 'DevOps', 'Marketing', 'HR', 'Sales', 'UI/UX', 'Mobile'],
      required: true
    },
    
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true
    },
    
    // ✅ WORK DETAILS
    workMode: { 
      type: String, 
      enum: ['Remote', 'Hybrid', 'Onsite'],
      required: true
    },
    
    officeLocation: {
      type: String,
      default: ''
    },
    
    dailyTimings: {
      type: String,
      default: "10 AM - 6 PM"
    },
    
    weeklyOff: {
      type: String,
      default: "Saturday, Sunday"
    },
    
    startDate: {
      type: Date,
      required: true
    },
    
    endDate: {
      type: Date,
      required: true
    },
    
    duration: { 
      type: Number, // in months
      required: true 
    },
    
    stipend: { 
      type: Number, // Changed from String to Number for calculations
      default: 0 
    },
    
    positions: {
      type: Number,
      default: 1
    },
    
    filledPositions: {
      type: Number,
      default: 0
    },
    
    // ✅ SELECTION PROCESS
    selectionProcess: [{
      round: { type: Number, required: true },
      type: { 
        type: String, 
        enum: ['Technical Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Assignment'],
        required: true 
      },
      duration: String,
      details: String
    }],
    
    // ✅ EXISTING FIELDS (kept for compatibility)
    category: {
      type: String,
      enum: ['technology', 'marketing', 'design', 'finance', 'hr', 'sales', 'other'],
      default: 'other'
    },
    
    description: { type: String, required: true },
    
    skillsRequired: [{
      name: { type: String, required: true },
      level: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
      }
    }],
    
    requirements: [{
      type: String
    }],
    
    perks: [{
      type: String
    }],
    
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter", required: true },
    deadline: { type: Date, required: true },
    
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Internship", InternshipSchema);