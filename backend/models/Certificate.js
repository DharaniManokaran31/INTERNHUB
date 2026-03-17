const mongoose = require('mongoose');
const crypto = require('crypto');

const CertificateSchema = new mongoose.Schema(
  {
    // Unique certificate ID (generated)
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    
    // References
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, "Student ID is required"],
      index: true
    },
    
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: [true, "Internship ID is required"],
      index: true
    },
    
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, "Application ID is required"],
      unique: true // One certificate per application
    },
    
    // Issuer
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: [true, "Issuer ID is required"]
    },

    // Certificate Details
    issueDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    template: {
      type: String,
      enum: {
        values: ['professional', 'modern', 'creative'],
        message: "{VALUE} is not a valid template"
      },
      default: 'professional'
    },

    // Student's Project (optional)
    projectTitle: {
      type: String,
      trim: true,
      maxlength: [200, "Project title cannot exceed 200 characters"]
    },
    
    mentorName: {
      type: String,
      trim: true,
      maxlength: [100, "Mentor name cannot exceed 100 characters"]
    },

    // Skills acquired during internship
    skillsAcquired: [{
      type: String,
      trim: true
    }],

    // Grade/Performance
    grade: {
      type: String,
      enum: {
        values: ['A+', 'A', 'B+', 'B', 'C', 'P'],
        message: "{VALUE} is not a valid grade"
      },
      default: 'A'
    },

    // Additional comments
    comments: {
      type: String,
      trim: true,
      maxlength: [500, "Comments cannot exceed 500 characters"]
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['issued', 'pending', 'revoked'],
        message: "{VALUE} is not a valid status"
      },
      default: 'issued',
      required: true,
      index: true
    },

    // Revocation details
    revocationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Revocation reason cannot exceed 500 characters"]
    },
    
    revokedAt: Date,
    
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter'
    },

    // Generated files
    qrCodeUrl: {
      type: String,
      trim: true,
      required: true
    },
    
    pdfUrl: {
      type: String,
      trim: true,
      required: true
    },

    // Verification
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // Download count
    downloadCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Email sent
    emailSent: {
      type: Boolean,
      default: false
    },
    
    emailSentAt: Date
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===== INDEXES =====
CertificateSchema.index({ verificationCode: 1 });
CertificateSchema.index({ studentId: 1, status: 1 });
CertificateSchema.index({ issuedBy: 1 });
CertificateSchema.index({ createdAt: -1 });

// ===== VIRTUALS =====

// Formatted issue date
CertificateSchema.virtual('formattedIssueDate').get(function() {
  return this.issueDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Verification URL
CertificateSchema.virtual('verificationUrl').get(function() {
  return `/verify/${this.verificationCode}`;
});

// Is valid (not revoked)
CertificateSchema.virtual('isValid').get(function() {
  return this.status === 'issued';
});

// Student full name (populated)
CertificateSchema.virtual('studentName').get(function() {
  return this.populated('studentId') ? this.studentId.fullName : null;
});

// Internship title (populated)
CertificateSchema.virtual('internshipTitle').get(function() {
  return this.populated('internshipId') ? this.internshipId.title : null;
});

// ===== PRE-SAVE HOOKS =====

// Generate certificate ID and verification code before saving
CertificateSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate unique certificate ID
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.certificateId = `CERT-${timestamp}-${random}`;
    
    // Generate verification code
    const studentPart = this.studentId.toString().slice(-4).toUpperCase();
    const internshipPart = this.internshipId.toString().slice(-4).toUpperCase();
    const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.verificationCode = `${studentPart}-${internshipPart}-${randomCode}`;
  }
  
  next();
});

// ===== INSTANCE METHODS =====

/**
 * Revoke certificate
 */
CertificateSchema.methods.revoke = async function(reason, revokedBy) {
  this.status = 'revoked';
  this.revocationReason = reason;
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  
  await this.save();
  return this;
};

/**
 * Reinstate revoked certificate
 */
CertificateSchema.methods.reinstate = async function() {
  if (this.status !== 'revoked') {
    throw new Error('Only revoked certificates can be reinstated');
  }
  
  this.status = 'issued';
  this.revocationReason = undefined;
  this.revokedAt = undefined;
  this.revokedBy = undefined;
  
  await this.save();
  return this;
};

/**
 * Increment download count
 */
CertificateSchema.methods.incrementDownloads = async function() {
  this.downloadCount += 1;
  await this.save();
  return this.downloadCount;
};

/**
 * Mark email as sent
 */
CertificateSchema.methods.markEmailSent = async function() {
  this.emailSent = true;
  this.emailSentAt = new Date();
  await this.save();
  return this;
};

/**
 * Verify certificate
 */
CertificateSchema.methods.verify = function() {
  return {
    isValid: this.status === 'issued',
    student: this.studentId,
    internship: this.internshipId,
    issueDate: this.issueDate,
    grade: this.grade,
    issuedBy: this.issuedBy
  };
};

// ===== STATIC METHODS =====

/**
 * Generate certificate PDF
 */
CertificateSchema.statics.generatePDF = async function(certificateId) {
  const Certificate = this;
  const cert = await Certificate.findById(certificateId)
    .populate('studentId', 'fullName')
    .populate('internshipId', 'title department startDate endDate')
    .populate('issuedBy', 'fullName designation');
  
  if (!cert) {
    throw new Error('Certificate not found');
  }
  
  // This would integrate with PDF generation library
  // For now, return the data needed for PDF generation
  return {
    certificateId: cert.certificateId,
    studentName: cert.studentId.fullName,
    internshipTitle: cert.internshipId.title,
    duration: `${cert.internshipId.startDate.toLocaleDateString()} to ${cert.internshipId.endDate.toLocaleDateString()}`,
    issueDate: cert.issueDate,
    grade: cert.grade,
    issuedByName: cert.issuedBy.fullName,
    issuedByDesignation: cert.issuedBy.designation,
    verificationCode: cert.verificationCode
  };
};

/**
 * Find by verification code
 */
CertificateSchema.statics.findByVerificationCode = function(code) {
  return this.findOne({ verificationCode: code })
    .populate('studentId', 'fullName')
    .populate('internshipId', 'title department startDate endDate')
    .populate('issuedBy', 'fullName designation');
};

/**
 * Get certificates for student
 */
CertificateSchema.statics.getForStudent = function(studentId) {
  return this.find({ 
    studentId, 
    status: 'issued' 
  })
    .populate('internshipId', 'title companyName department')
    .populate('issuedBy', 'fullName')
    .sort({ issueDate: -1 });
};

/**
 * Get certificate statistics
 */
CertificateSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    { $group: {
      _id: '$status',
      count: { $sum: 1 }
    }}
  ]);
  
  const result = {
    total: 0,
    issued: 0,
    revoked: 0,
    pending: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  // Get today's issued count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCount = await this.countDocuments({
    issueDate: { $gte: today },
    status: 'issued'
  });
  
  result.todayIssued = todayCount;
  
  return result;
};

/**
 * Bulk issue certificates
 */
CertificateSchema.statics.bulkIssue = async function(certificates, issuedBy) {
  const operations = certificates.map(cert => ({
    studentId: cert.studentId,
    internshipId: cert.internshipId,
    applicationId: cert.applicationId,
    issuedBy,
    grade: cert.grade || 'A',
    comments: cert.comments,
    template: cert.template || 'professional'
  }));
  
  const results = await this.insertMany(operations);
  return results;
};

module.exports = mongoose.model('Certificate', CertificateSchema);