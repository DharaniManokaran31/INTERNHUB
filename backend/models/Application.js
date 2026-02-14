const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    internship: { type: mongoose.Schema.Types.ObjectId, ref: "Internship", required: true },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "rejected", "accepted"],
      default: "pending"
    },
    appliedAt: { type: Date, default: Date.now },
    
    // ✅ TRACK SUBMITTED RESUME (local file storage)
    submittedResume: {
      url: {                         // Path to file: /uploads/resumes/filename.pdf
        type: String,
        required: true
      },
      fileName: {                    // Original filename: "john_doe_resume.pdf"
        type: String,
        required: true
      },
      uploadedAt: {                  // When this version was uploaded
        type: Date,
        default: Date.now
      }
    },
    
    // ✅ TRACK SUBMITTED CERTIFICATES (local file storage)
    submittedCertificates: [{
      name: {                        // Certificate name: "AWS Certified Developer"
        type: String,
        required: true
      },
      url: {                         // Path: /uploads/certificates/aws-cert.pdf
        type: String,
        required: true
      },
      fileName: {                     // Original filename: "aws-certificate.pdf"
        type: String,
        required: true
      },
      uploadedAt: {                   // When this certificate was uploaded
        type: Date,
        default: Date.now
      }
    }],
    
    // ✅ OPTIONAL: Track which resume version from student's profile was used
    resumeVersion: {
      type: String,                   // Could be timestamp or version ID
      default: null
    }
  },
  { timestamps: true }
);

// ✅ Create indexes for faster queries
ApplicationSchema.index({ student: 1, internship: 1 }, { unique: true }); // Prevent duplicate applications
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ appliedAt: -1 });

module.exports = mongoose.model("Application", ApplicationSchema);