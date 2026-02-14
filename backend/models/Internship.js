const mongoose = require("mongoose");

const InternshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    companyName: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true }, // Remote, On-site, Hybrid
    
    // ✅ NEW: Category field for filtering
    category: {
      type: String,
      enum: ['technology', 'marketing', 'design', 'finance', 'hr', 'sales', 'other'],
      default: 'other',
      required: true
    },
    
    stipend: { type: String, default: "Unpaid" },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    
    // ✅ UPDATED: Skills with levels (backward compatible)
    skillsRequired: [{
      name: { type: String, required: true },
      level: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
      }
    }],
    
    // ✅ NEW: Requirements list
    requirements: [{
      type: String
    }],
    
    // ✅ NEW: Perks & benefits list
    perks: [{
      type: String
    }],
    
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter" },
    deadline: { type: Date, required: true },
    
    // ✅ NEW: Status field for managing internships
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Internship", InternshipSchema);