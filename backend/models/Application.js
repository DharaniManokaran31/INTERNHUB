const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    // References (standardized with Id suffix)
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Student", 
      required: [true, "Student ID is required"] 
    },
    
    internshipId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Internship", 
      required: [true, "Internship ID is required"] 
    },

    // Denormalized for quick access
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: [true, "Recruiter ID is required"]
    },

    // Application Status
    status: {
      type: String,
      enum: {
        values: ["pending", "shortlisted", "rejected", "accepted", "completed"],
        message: "{VALUE} is not a valid status"
      },
      default: "pending",
      required: true,
      index: true
    },
    
    appliedAt: { 
      type: Date, 
      default: Date.now,
      required: true,
      index: true
    },
    
    // Cover Letter
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [5000, "Cover letter cannot exceed 5000 characters"],
      default: ''
    },
    
    // Submitted Resume
    submittedResume: {
      url: {                         // Path: /uploads/resumes/filename.pdf
        type: String,
        required: [true, "Resume file is required"],
        trim: true
      },
      fileName: {                    // Original filename
        type: String,
        required: [true, "Resume filename is required"],
        trim: true
      },
      fileSize: {                    // Size in bytes
        type: Number,
        min: 0
      },
      uploadedAt: {                  // When this version was uploaded
        type: Date,
        default: Date.now
      }
    },
    
    // Submitted Certificates
    submittedCertificates: [{
      name: {                        // Certificate name
        type: String,
        required: [true, "Certificate name is required"],
        trim: true
      },
      url: {                         // Path: /uploads/certificates/filename.pdf
        type: String,
        required: [true, "Certificate URL is required"],
        trim: true
      },
      fileName: {                     // Original filename
        type: String,
        required: [true, "Certificate filename is required"],
        trim: true
      },
      fileSize: {                     // Size in bytes
        type: Number,
        min: 0
      },
      uploadedAt: {                   // When uploaded
        type: Date,
        default: Date.now
      }
    }],
    
    // Resume version tracking
    resumeVersion: {
      type: String,                   // Timestamp or version ID
      trim: true
    },

    // Status Timeline
    timeline: [{
      status: {
        type: String,
        enum: ["pending", "shortlisted", "rejected", "accepted", "completed"],
        required: true
      },
      comment: {
        type: String,
        trim: true,
        maxlength: [500, "Comment cannot exceed 500 characters"]
      },
      updatedAt: { 
        type: Date, 
        default: Date.now,
        required: true
      },
      updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Recruiter",
        required: true
      }
    }],

    // Recruiter Notes
    recruiterNotes: [{
      note: {
        type: String,
        required: [true, "Note is required"],
        trim: true,
        maxlength: [1000, "Note cannot exceed 1000 characters"]
      },
      addedAt: { 
        type: Date, 
        default: Date.now,
        required: true
      },
      addedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Recruiter",
        required: true
      }
    }],

    // Next Steps
    nextSteps: {
      type: String,
      trim: true,
      maxlength: [500, "Next steps cannot exceed 500 characters"],
      default: ''
    },

    // Certificate Recommendation
    certificateRecommended: {
      type: Boolean,
      default: false
    },
    
    certificationFeedback: {
      type: String,
      trim: true,
      maxlength: [500, "Certification feedback cannot exceed 500 characters"],
      default: ''
    },

    // Interview Link
    currentInterviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview"
    },

    // Matching Score (if you implement AI matching)
    matchingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    // Withdrawn by student
    isWithdrawn: {
      type: Boolean,
      default: false
    },
    
    withdrawnAt: Date,
    withdrawalReason: {
      type: String,
      trim: true,
      maxlength: [500, "Withdrawal reason cannot exceed 500 characters"]
    },

    // Read status (for new applications)
    isReadByRecruiter: {
      type: Boolean,
      default: false
    },
    
    readAt: Date
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===== INDEXES FOR PERFORMANCE =====

// Prevent duplicate applications
ApplicationSchema.index(
  { studentId: 1, internshipId: 1 }, 
  { unique: true, message: "You have already applied to this internship" }
);

// For recruiter dashboards
ApplicationSchema.index({ internshipId: 1, status: 1, appliedAt: -1 });
ApplicationSchema.index({ recruiterId: 1, status: 1, appliedAt: -1 });

// For student dashboards
ApplicationSchema.index({ studentId: 1, status: 1, appliedAt: -1 });

// For search/filter
ApplicationSchema.index({ status: 1, appliedAt: -1 });
ApplicationSchema.index({ certificateRecommended: 1 });

// ===== VIRTUALS =====

// Days since applied
ApplicationSchema.virtual('daysSinceApplied').get(function() {
  const diffTime = Math.abs(new Date() - this.appliedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Current status in timeline
ApplicationSchema.virtual('currentStatusDetails').get(function() {
  if (this.timeline && this.timeline.length > 0) {
    return this.timeline[this.timeline.length - 1];
  }
  return null;
});

// Has certificate recommendation
ApplicationSchema.virtual('hasCertificateRecommendation').get(function() {
  return this.certificateRecommended && this.status === 'accepted';
});

// // ===== PRE-SAVE HOOKS =====

// // Simple pre-save hook without complex logic
// ApplicationSchema.pre('save', function(next) {
//   try {
//     // For new documents, add initial timeline entry
//     if (this.isNew) {
//       if (!this.timeline || this.timeline.length === 0) {
//         this.timeline = [{
//           status: this.status || 'pending',
//           comment: 'Application submitted',
//           updatedAt: new Date(),
//           updatedBy: this.studentId
//         }];
//       }
//     }
    
//     // If status was modified, add to timeline
//     if (this.isModified('status')) {
//       // Add the status change to timeline
//       this.timeline = this.timeline || [];
//       this.timeline.push({
//         status: this.status,
//         comment: `Status changed to ${this.status}`,
//         updatedAt: new Date(),
//         updatedBy: this.recruiterId || this.studentId
//       });
//     }
    
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// ===== INSTANCE METHODS =====

/**
 * Update application status
 */
ApplicationSchema.methods.updateStatus = async function(
  newStatus, 
  updatedBy, 
  comment = ''
) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  this.timeline.push({
    status: newStatus,
    comment,
    updatedAt: new Date(),
    updatedBy
  });
  
  await this.save();
  
  // If accepted, update internship filled positions
  if (newStatus === 'accepted' && oldStatus !== 'accepted') {
    await this.updateInternshipFilledPositions();
  }
  
  return this;
};

/**
 * Update internship filled positions
 */
ApplicationSchema.methods.updateInternshipFilledPositions = async function() {
  const Internship = mongoose.model('Internship');
  const internship = await Internship.findById(this.internshipId);
  
  if (internship) {
    internship.filledPositions += 1;
    await internship.save();
  }
};

/**
 * Add recruiter note
 */
ApplicationSchema.methods.addNote = function(note, addedBy) {
  this.recruiterNotes.push({
    note,
    addedAt: new Date(),
    addedBy
  });
  return this.save();
};

/**
 * Mark as read by recruiter
 */
ApplicationSchema.methods.markAsRead = function() {
  this.isReadByRecruiter = true;
  this.readAt = new Date();
  return this.save();
};

/**
 * Recommend certificate
 */
ApplicationSchema.methods.recommendCertificate = function(feedback, recommendedBy) {
  this.certificateRecommended = true;
  this.certificationFeedback = feedback;
  this.timeline.push({
    status: this.status,
    comment: `Certificate recommended: ${feedback}`,
    updatedAt: new Date(),
    updatedBy: recommendedBy
  });
  return this.save();
};

/**
 * Withdraw application
 */
ApplicationSchema.methods.withdraw = function(reason) {
  this.isWithdrawn = true;
  this.withdrawnAt = new Date();
  this.withdrawalReason = reason;
  this.status = 'rejected';
  return this.save();
};

// ===== STATIC METHODS =====

/**
 * Get applications for a student with populated data
 */
ApplicationSchema.statics.getForStudent = function(studentId) {
  return this.find({ studentId })
    .populate({
      path: 'internshipId',
      populate: {
        path: 'companyId',
        select: 'name logo'
      }
    })
    .populate('recruiterId', 'fullName email')
    .sort({ appliedAt: -1 });
};

/**
 * Get applications for an internship with funnel stats
 */
ApplicationSchema.statics.getForInternship = function(internshipId) {
  return this.find({ internshipId })
    .populate('studentId', 'fullName email profilePicture currentEducation skills')
    .sort({ appliedAt: -1 });
};

/**
 * Get funnel stats for an internship
 */
ApplicationSchema.statics.getFunnelStats = async function(internshipId) {
  const stats = await this.aggregate([
    { $match: { internshipId: mongoose.Types.ObjectId(internshipId) } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 }
    }}
  ]);
  
  const funnel = {
    total: 0,
    pending: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0
  };
  
  stats.forEach(stat => {
    funnel[stat._id] = stat.count;
    funnel.total += stat.count;
  });
  
  // Add conversion rates
  if (funnel.total > 0) {
    funnel.shortlistRate = Math.round((funnel.shortlisted / funnel.total) * 100);
    funnel.acceptanceRate = Math.round((funnel.accepted / funnel.total) * 100);
    funnel.rejectionRate = Math.round((funnel.rejected / funnel.total) * 100);
  }
  
  return funnel;
};

/**
 * Get applications pending review
 */
ApplicationSchema.statics.getPendingReview = function(recruiterId) {
  return this.find({ 
    recruiterId,
    status: 'pending',
    isReadByRecruiter: false
  })
    .populate('studentId', 'fullName email')
    .populate('internshipId', 'title')
    .sort({ appliedAt: 1 });
};

/**
 * Search applications
 */
ApplicationSchema.statics.search = function(keyword, recruiterId = null) {
  const query = {
    $or: [
      { 'studentId.fullName': { $regex: keyword, $options: 'i' } },
      { 'studentId.email': { $regex: keyword, $options: 'i' } },
      { 'internshipId.title': { $regex: keyword, $options: 'i' } }
    ]
  };
  
  if (recruiterId) {
    query.recruiterId = recruiterId;
  }
  
  return this.find(query)
    .populate('studentId', 'fullName email')
    .populate('internshipId', 'title');
};

module.exports = mongoose.model("Application", ApplicationSchema);