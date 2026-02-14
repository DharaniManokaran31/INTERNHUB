const mongoose = require("mongoose");

// Sub-schemas
const EducationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  gpa: { type: Number, min: 0, max: 10 },
  description: String
});

const ExperienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  description: { type: String, required: true },
  skills: [{ type: String }]
});

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  technologies: { type: String, required: true },
  github: String,
  demo: String
});

const CertificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  date: { type: Date, required: true },
  expiryDate: Date,                      // ✅ ADDED
  credentialId: String,
  link: String,
  certificateUrl: String                // ✅ ADDED - for uploaded certificate files
});

const SkillsSchema = new mongoose.Schema({
  category: { type: String, required: true },
  items: [{ type: String }]
});

// Main Student schema
const StudentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ['student', 'recruiter'],
      default: 'student',
      required: true
    },

    phone: String,
    location: String,
    education: {
      college: {
        type: String,
        default: ''
      },
      department: {
        type: String,
        default: ''
      },
      yearOfStudy: {
        type: String,
        enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduated"],
        default: "1st Year"
      },
      course: {
        type: String,
        default: ''
      },
      specialization: {
        type: String,
        default: ''
      }
    },
    expectedGraduation: Date,
    linkedin: String,
    github: String,
    portfolio: String,
    profilePicture: String,
    skills: [{ type: String }],
    
    // ===== ✅ ENHANCED RESUME SECTION =====
    resume: {
      education: [EducationSchema],
      experience: [ExperienceSchema],
      projects: [ProjectSchema],
      skills: [SkillsSchema],
      certifications: [CertificationSchema],
      resumeFile: {                     // ✅ ADDED - URL of uploaded resume PDF
        type: String,
        default: ''
      },
      resumeFileName: {                // ✅ ADDED - original filename
        type: String,
        default: ''
      },
      lastUpdated: {                  // ✅ ADDED - track when resume was last updated
        type: Date,
        default: Date.now
      }
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);