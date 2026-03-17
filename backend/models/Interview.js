const mongoose = require('mongoose');

// ===== SUB-SCHEMAS =====

const RoundSchema = new mongoose.Schema({
  roundNumber: { 
    type: Number, 
    required: [true, "Round number is required"],
    min: [1, "Round number must be at least 1"]
  },
  
  roundType: { 
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
  
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'scheduled', 'completed', 'cancelled', 'rescheduled'],
      message: "{VALUE} is not a valid status"
    },
    default: 'pending'
  },
  
  mode: { 
    type: String, 
    enum: {
      values: ['online', 'offline', 'assignment'],
      message: "{VALUE} is not a valid mode"
    },
    default: 'online'
  },
  
  // Online details
  onlineDetails: {
    platform: {
      type: String,
      enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Other'],
      trim: true
    },
    meetingLink: {
      type: String,
      trim: true,
      match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Invalid meeting link"]
    },
    testLink: {
      type: String,
      trim: true
    },
    testPlatform: {
      type: String,
      trim: true
    },
    accessCode: {
      type: String,
      trim: true
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [1000, "Instructions cannot exceed 1000 characters"]
    }
  },
  
  // Offline details
  offlineDetails: {
    venue: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    landmark: {
      type: String,
      trim: true
    },
    roomNumber: {
      type: String,
      trim: true
    },
    floor: {
      type: String,
      trim: true
    },
    contactPerson: {
      name: { type: String, trim: true },
      phone: { 
        type: String,
        match: [/^[0-9]{10}$/, "Invalid phone number"]
      },
      email: {
        type: String,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"]
      },
      designation: { type: String, trim: true }
    },
    parkingInfo: { type: String, trim: true },
    entryInstructions: { type: String, trim: true }
  },
  
  // Assignment details
  assignmentDetails: {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    requirements: [{ type: String, trim: true }],
    technologies: [{ type: String, trim: true }],
    deliverables: [{ type: String, trim: true }],
    submissionPlatform: { type: String, trim: true },
    evaluationCriteria: [{
      criterion: { type: String, trim: true },
      weightage: { type: Number, min: 0, max: 100 }
    }],
    resources: [{ type: String, trim: true }]
  },
  
  // Scheduling
  scheduledDate: { 
    type: Date,
    required: function() { return this.status === 'scheduled'; }
  },
  
  scheduledTime: { 
    type: String,
    required: function() { return this.status === 'scheduled'; }
  },
  
  scheduledAt: { 
    type: Date,
    default: Date.now
  },
  
  deadline: Date,
  
  // Student submission
  studentSubmission: {
    submittedAt: Date,
    submissionLink: { type: String, trim: true },
    files: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    submittedOnTime: { type: Boolean, default: true }
  },
  
  // Results
  result: { 
    type: String, 
    enum: {
      values: ['pass', 'fail', 'pending'],
      message: "{VALUE} is not a valid result"
    },
    default: 'pending'
  },
  
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    strengths: { type: String, trim: true },
    weaknesses: { type: String, trim: true },
    technicalSkills: { type: Number, min: 1, max: 5 },
    communicationSkills: { type: Number, min: 1, max: 5 },
    problemSolving: { type: Number, min: 1, max: 5 },
    overallImpression: { type: String, trim: true },
    detailedNotes: { type: String, trim: true },
    recommendedNextRound: { type: Boolean, default: true }
  },
  
  // Tracking
  emailSent: { type: Boolean, default: false },
  emailSentAt: Date,
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: Date,
  
  attendance: {
    studentJoined: { type: Boolean, default: false },
    joinedAt: Date,
    leftAt: Date,
    durationAttended: Number, // in minutes
    recruiterMarkedPresent: { type: Boolean, default: false },
    noShowReason: { type: String, trim: true }
  },
  
  rescheduleHistory: [{
    requestedBy: { 
      type: String, 
      enum: ['recruiter', 'student'],
      required: true
    },
    requestedAt: { 
      type: Date, 
      default: Date.now,
      required: true
    },
    originalDate: Date,
    originalTime: String,
    newDate: { 
      type: Date,
      required: true
    },
    newTime: { 
      type: String,
      required: true
    },
    reason: { 
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"]
    },
    approved: { type: Boolean, default: true },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' }
  }],
  
  completedAt: Date,
  feedbackSubmittedAt: Date
}, { timestamps: true });

// ===== MAIN INTERVIEW SCHEMA =====

const interviewSchema = new mongoose.Schema(
  {
    // References (standardized with Id suffix)
    applicationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Application', 
      required: [true, "Application ID is required"],
      unique: true // One interview per application
    },
    
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student', 
      required: [true, "Student ID is required"] 
    },
    
    internshipId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Internship', 
      required: [true, "Internship ID is required"] 
    },
    
    recruiterId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Recruiter', 
      required: [true, "Recruiter ID is required"] 
    },

    // Interview Rounds
    rounds: [RoundSchema],

    // Current Round
    currentRound: { 
      type: Number, 
      default: 1,
      min: 1,
      validate: {
        validator: function(v) {
          return v <= this.rounds.length + 1;
        },
        message: "Current round cannot exceed total rounds + 1"
      }
    },
    
    // Overall Status
    overallStatus: { 
      type: String, 
      enum: {
        values: ['in_progress', 'selected', 'rejected', 'on_hold'],
        message: "{VALUE} is not a valid overall status"
      },
      default: 'in_progress'
    },
    
    // Final Decision
    finalDecision: {
      madeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
      madeAt: Date,
      decision: { 
        type: String, 
        enum: ['selected', 'rejected'] 
      },
      comments: { 
        type: String,
        trim: true,
        maxlength: [1000, "Comments cannot exceed 1000 characters"]
      },
      offerLetterGenerated: { type: Boolean, default: false }
    },

    // Communication Log
    communicationLog: [{
      type: { 
        type: String, 
        enum: ['email', 'sms', 'call'],
        required: true
      },
      sentTo: { 
        type: String,
        required: true,
        trim: true
      },
      sentAt: { 
        type: Date, 
        default: Date.now,
        required: true
      },
      subject: { 
        type: String,
        trim: true
      },
      content: { 
        type: String,
        trim: true
      },
      status: { 
        type: String,
        trim: true
      }
    }],

    // Notes
    notes: { 
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"]
    },
    
    internalNotes: { 
      type: String,
      trim: true,
      maxlength: [2000, "Internal notes cannot exceed 2000 characters"]
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        // Remove internal notes from JSON response unless specifically requested
        if (!ret.includeInternal) {
          delete ret.internalNotes;
        }
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret) {
        if (!ret.includeInternal) {
          delete ret.internalNotes;
        }
        return ret;
      }
    }
  }
);

// ===== INDEXES FOR PERFORMANCE =====
interviewSchema.index({ applicationId: 1 }, { unique: true });
interviewSchema.index({ studentId: 1, overallStatus: 1 });
interviewSchema.index({ recruiterId: 1, overallStatus: 1 });
interviewSchema.index({ internshipId: 1 });
interviewSchema.index({ 'rounds.status': 1, 'rounds.scheduledDate': 1 });

// ===== VIRTUALS =====

// Next scheduled round
interviewSchema.virtual('nextRound').get(function() {
  if (!this.rounds || this.rounds.length === 0) return null;
  
  return this.rounds.find(round => 
    round.status === 'scheduled' && round.scheduledDate > new Date()
  );
});

// Last completed round
interviewSchema.virtual('lastCompletedRound').get(function() {
  if (!this.rounds || this.rounds.length === 0) return null;
  
  return [...this.rounds]
    .reverse()
    .find(round => round.status === 'completed');
});

// Progress percentage
interviewSchema.virtual('progressPercentage').get(function() {
  if (!this.rounds || this.rounds.length === 0) return 0;
  
  const completed = this.rounds.filter(r => r.status === 'completed').length;
  return Math.round((completed / this.rounds.length) * 100);
});

// Is interview process complete
interviewSchema.virtual('isComplete').get(function() {
  return this.overallStatus === 'selected' || this.overallStatus === 'rejected';
});

// ===== PRE-SAVE HOOKS - FIXED with Async/Await =====
// Using async/await pattern - NO 'next' parameter needed
interviewSchema.pre('save', async function() {
  try {
    // Auto-calculate current round based on rounds array
    if (this.rounds && this.rounds.length > 0) {
      // Find the highest round number with status 'scheduled' or 'pending'
      const activeRound = this.rounds
        .filter(r => r.status === 'scheduled' || r.status === 'pending')
        .sort((a, b) => b.roundNumber - a.roundNumber)[0];
      
      if (activeRound) {
        this.currentRound = activeRound.roundNumber;
      } else {
        // If no active rounds, next round is after last completed
        const completedRounds = this.rounds.filter(r => r.status === 'completed');
        if (completedRounds.length > 0) {
          const lastCompleted = Math.max(...completedRounds.map(r => r.roundNumber));
          this.currentRound = lastCompleted + 1;
        }
      }
    }
    
    // Update overall status based on rounds
    if (this.rounds && this.rounds.length > 0) {
      const lastRound = this.rounds[this.rounds.length - 1];
      
      if (lastRound.status === 'completed') {
        if (lastRound.result === 'fail') {
          this.overallStatus = 'rejected';
        } else if (lastRound.result === 'pass') {
          // Check if this was the final round (HR Interview typically)
          if (lastRound.roundType === 'HR Interview') {
            this.overallStatus = 'selected';
          }
        }
      }
    }
    
    // No need to call next() - async function handles it
  } catch (error) {
    console.error('Error in interview pre-save hook:', error);
    throw error; // Let Mongoose handle the error
  }
});

// ===== INSTANCE METHODS =====

/**
 * Schedule a new round
 */
interviewSchema.methods.scheduleRound = async function(roundData) {
  const roundNumber = this.rounds.length + 1;
  
  const newRound = {
    roundNumber,
    ...roundData,
    status: 'scheduled',
    scheduledAt: new Date()
  };
  
  this.rounds.push(newRound);
  this.currentRound = roundNumber;
  
  await this.save();
  return newRound;
};

/**
 * Submit result for a round
 */
interviewSchema.methods.submitRoundResult = async function(
  roundNumber,
  resultData
) {
  const round = this.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) {
    throw new Error('Round not found');
  }
  
  round.status = 'completed';
  round.result = resultData.result;
  round.score = resultData.score;
  round.percentage = resultData.percentage;
  round.feedback = resultData.feedback;
  round.completedAt = new Date();
  round.feedbackSubmittedAt = new Date();
  
  // Update attendance if provided
  if (resultData.attendance) {
    round.attendance = resultData.attendance;
  }
  
  await this.save();
  
  // Check if this was the final round
  if (round.roundType === 'HR Interview' && round.result === 'pass') {
    this.overallStatus = 'selected';
    await this.save();
  }
  
  return round;
};

/**
 * Reschedule a round
 */
interviewSchema.methods.rescheduleRound = async function(
  roundNumber,
  newDate,
  newTime,
  reason,
  requestedBy
) {
  const round = this.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) {
    throw new Error('Round not found');
  }
  
  // Add to reschedule history
  round.rescheduleHistory.push({
    requestedBy,
    requestedAt: new Date(),
    originalDate: round.scheduledDate,
    originalTime: round.scheduledTime,
    newDate,
    newTime,
    reason,
    approved: true,
    approvedAt: new Date()
  });
  
  // Update round
  round.scheduledDate = newDate;
  round.scheduledTime = newTime;
  round.status = 'scheduled';
  
  await this.save();
  return round;
};

/**
 * Add communication log
 */
interviewSchema.methods.addCommunicationLog = function(logData) {
  this.communicationLog.push({
    ...logData,
    sentAt: new Date()
  });
  return this.save();
};

/**
 * Get interview summary for student
 */
interviewSchema.methods.getStudentSummary = function() {
  return {
    id: this._id,
    internshipId: this.internshipId,
    currentRound: this.currentRound,
    totalRounds: this.rounds.length,
    nextRound: this.nextRound,
    overallStatus: this.overallStatus,
    progress: this.progressPercentage
  };
};

/**
 * Check if student can attend next round
 */
interviewSchema.methods.canStudentAttend = function() {
  const nextRound = this.nextRound;
  if (!nextRound) return false;
  
  // Check if within 24 hours of scheduled time
  const scheduledTime = new Date(nextRound.scheduledDate);
  const now = new Date();
  const hoursDiff = (scheduledTime - now) / (1000 * 60 * 60);
  
  return hoursDiff > 24; // Can't attend if less than 24 hours notice
};

// ===== STATIC METHODS =====

/**
 * Get upcoming interviews for recruiter
 */
interviewSchema.statics.getUpcomingForRecruiter = function(recruiterId) {
  const now = new Date();
  
  return this.find({
    recruiterId,
    overallStatus: 'in_progress',
    'rounds': {
      $elemMatch: {
        status: 'scheduled',
        scheduledDate: { $gt: now }
      }
    }
  })
    .populate('studentId', 'fullName email phone profilePicture')
    .populate('internshipId', 'title department')
    .sort({ 'rounds.scheduledDate': 1 });
};

/**
 * Get upcoming interviews for student
 */
interviewSchema.statics.getUpcomingForStudent = function(studentId) {
  const now = new Date();
  
  return this.find({
    studentId,
    overallStatus: 'in_progress',
    'rounds': {
      $elemMatch: {
        status: 'scheduled',
        scheduledDate: { $gt: now }
      }
    }
  })
    .populate('recruiterId', 'fullName email department')
    .populate('internshipId', 'title companyName')
    .populate('applicationId')
    .sort({ 'rounds.scheduledDate': 1 });
};

/**
 * Get interview statistics for recruiter
 */
interviewSchema.statics.getStatsForRecruiter = async function(recruiterId) {
  const stats = await this.aggregate([
    { $match: { recruiterId: mongoose.Types.ObjectId(recruiterId) } },
    { $group: {
      _id: '$overallStatus',
      count: { $sum: 1 }
    }}
  ]);
  
  const result = {
    total: 0,
    in_progress: 0,
    selected: 0,
    rejected: 0,
    on_hold: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  // Add upcoming count
  const upcoming = await this.getUpcomingForRecruiter(recruiterId);
  result.upcoming = upcoming.length;
  
  return result;
};

/**
 * Find by application
 */
interviewSchema.statics.findByApplication = function(applicationId) {
  return this.findOne({ applicationId })
    .populate('studentId', 'fullName email phone profilePicture')
    .populate('recruiterId', 'fullName email department')
    .populate('internshipId', 'title companyName department');
};

module.exports = mongoose.model('Interview', interviewSchema);