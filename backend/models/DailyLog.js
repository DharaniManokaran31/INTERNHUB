const mongoose = require("mongoose");

const DailyLogSchema = new mongoose.Schema(
  {
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
    
    mentorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Recruiter', 
      required: [true, "Mentor ID is required"],
      index: true
    },

    // Log Date
    date: { 
      type: Date, 
      required: [true, "Date is required"],
      index: true
    },
    
    dayNumber: { 
      type: Number,
      min: [1, "Day number must be at least 1"]
    },
    
    weekNumber: {
      type: Number,
      min: [1, "Week number must be at least 1"]
    },
    
    monthNumber: {
      type: Number,
      min: [1, "Month number must be at least 1"],
      max: [12, "Month number cannot exceed 12"]
    },

    // Work Details
    tasksCompleted: [{
      description: { 
        type: String, 
        required: [true, "Task description is required"],
        trim: true,
        maxlength: [500, "Task description cannot exceed 500 characters"]
      },
      
      hoursSpent: { 
        type: Number, 
        required: [true, "Hours spent is required"],
        min: [0.5, "Hours spent must be at least 0.5"],
        max: [12, "Hours spent cannot exceed 12"]
      },
      
      status: { 
        type: String, 
        enum: {
          values: ['completed', 'in-progress', 'blocked'],
          message: "{VALUE} is not a valid status"
        },
        default: 'completed'
      },
      
      githubLink: {
        type: String,
        trim: true,
        match: [/^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/, "Invalid GitHub URL"]
      },
      
      attachments: [{
        type: String,
        trim: true // URLs to uploaded files
      }]
    }],

    totalHours: { 
      type: Number, 
      required: [true, "Total hours is required"],
      min: [1, "Total hours must be at least 1"],
      max: [12, "Total hours cannot exceed 12"],
      validate: {
        validator: function(v) {
          if (!this.tasksCompleted || this.tasksCompleted.length === 0) return true;
          const sum = this.tasksCompleted.reduce((acc, task) => acc + (task.hoursSpent || 0), 0);
          return Math.abs(v - sum) < 0.1; // Allow small floating point differences
        },
        message: "Total hours must equal sum of task hours"
      }
    },

    // Learning & Challenges
    learnings: {
      type: String,
      trim: true,
      maxlength: [1000, "Learnings cannot exceed 1000 characters"]
    },
    
    challenges: {
      type: String,
      trim: true,
      maxlength: [1000, "Challenges cannot exceed 1000 characters"]
    },
    
    tomorrowPlan: {
      type: String,
      trim: true,
      maxlength: [1000, "Tomorrow's plan cannot exceed 1000 characters"]
    },

    // Mood/Energy (optional)
    mood: {
      type: String,
      enum: {
        values: ['😊 Great', '🙂 Good', '😐 Okay', '😔 Stressed', '😫 Exhausted'],
        message: "{VALUE} is not a valid mood"
      }
    },

    // Mentor Feedback
    mentorFeedback: {
      comment: { 
        type: String,
        trim: true,
        maxlength: [1000, "Feedback comment cannot exceed 1000 characters"]
      },
      
      rating: { 
        type: Number, 
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot exceed 5"]
      },
      
      suggestions: { 
        type: String,
        trim: true,
        maxlength: [1000, "Suggestions cannot exceed 1000 characters"]
      },
      
      submittedAt: { 
        type: Date 
      },
      
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recruiter'
      }
    },

    // Status
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'needs-revision'],
        message: "{VALUE} is not a valid status"
      },
      default: 'pending',
      index: true
    },

    // Submission Info
    submittedAt: { 
      type: Date, 
      default: Date.now,
      required: true
    },
    
    reviewedAt: Date,

    // Late submission flag
    isLate: {
      type: Boolean,
      default: false
    },

    // For revision requests
    revisionRequest: {
      requestedAt: Date,
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
      comments: String,
      resubmittedAt: Date
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===== INDEXES FOR PERFORMANCE =====

// Prevent duplicate logs for same student/internship/date
DailyLogSchema.index(
  { studentId: 1, internshipId: 1, date: 1 }, 
  { unique: true, message: "Log for this date already exists" }
);

// For mentor dashboards
DailyLogSchema.index({ mentorId: 1, status: 1, date: -1 });

// For student dashboards
DailyLogSchema.index({ studentId: 1, date: -1 });

// For date-based queries
DailyLogSchema.index({ date: -1 });

// ===== VIRTUALS =====

// Formatted date
DailyLogSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Days since submission
DailyLogSchema.virtual('daysSinceSubmission').get(function() {
  const diffTime = Math.abs(new Date() - this.submittedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Has mentor feedback
DailyLogSchema.virtual('hasFeedback').get(function() {
  return !!(this.mentorFeedback && this.mentorFeedback.comment);
});

// Task summary
DailyLogSchema.virtual('taskSummary').get(function() {
  return this.tasksCompleted.map(t => t.description).join('; ');
});

// ===== PRE-SAVE HOOKS =====

DailyLogSchema.pre('save', async function(next) {
  // Calculate day number if not set
  if (!this.dayNumber && this.internshipId && this.date) {
    const Internship = mongoose.model('Internship');
    const internship = await Internship.findById(this.internshipId);
    
    if (internship && internship.startDate) {
      const startDate = new Date(internship.startDate);
      const logDate = new Date(this.date);
      const diffTime = Math.abs(logDate - startDate);
      this.dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Calculate week number
      this.weekNumber = Math.ceil(this.dayNumber / 7);
      
      // Calculate month number
      const monthDiff = (logDate.getFullYear() - startDate.getFullYear()) * 12 +
        (logDate.getMonth() - startDate.getMonth());
      this.monthNumber = monthDiff + 1;
    }
  }
  
  // Check if log is late (submitted after 11:59 PM of the log date)
  const logDate = new Date(this.date);
  logDate.setHours(23, 59, 59, 999);
  
  if (this.submittedAt > logDate) {
    this.isLate = true;
  }
  
  next();
});

// ===== INSTANCE METHODS =====

/**
 * Add mentor feedback
 */
DailyLogSchema.methods.addFeedback = async function(feedbackData, mentorId) {
  this.mentorFeedback = {
    comment: feedbackData.comment,
    rating: feedbackData.rating,
    suggestions: feedbackData.suggestions,
    submittedAt: new Date(),
    reviewedBy: mentorId
  };
  
  this.status = feedbackData.rating >= 3 ? 'approved' : 'needs-revision';
  this.reviewedAt = new Date();
  
  await this.save();
  return this;
};

/**
 * Request revision
 */
DailyLogSchema.methods.requestRevision = async function(comments, mentorId) {
  this.status = 'needs-revision';
  this.revisionRequest = {
    requestedAt: new Date(),
    requestedBy: mentorId,
    comments,
    resubmittedAt: null
  };
  
  await this.save();
  return this;
};

/**
 * Resubmit revised log
 */
DailyLogSchema.methods.resubmit = async function(updatedData) {
  if (updatedData.tasksCompleted) {
    this.tasksCompleted = updatedData.tasksCompleted;
    this.totalHours = updatedData.totalHours;
  }
  
  if (updatedData.learnings) this.learnings = updatedData.learnings;
  if (updatedData.challenges) this.challenges = updatedData.challenges;
  if (updatedData.tomorrowPlan) this.tomorrowPlan = updatedData.tomorrowPlan;
  
  this.status = 'pending';
  this.submittedAt = new Date();
  
  if (this.revisionRequest) {
    this.revisionRequest.resubmittedAt = new Date();
  }
  
  await this.save();
  return this;
};

/**
 * Check if log can be edited
 */
DailyLogSchema.methods.canEdit = function() {
  // Can edit if pending or needs revision
  return ['pending', 'needs-revision'].includes(this.status);
};

// ===== STATIC METHODS =====

/**
 * Get logs for mentor review
 */
DailyLogSchema.statics.getForMentorReview = function(mentorId) {
  return this.find({
    mentorId,
    status: { $in: ['pending', 'needs-revision'] }
  })
    .populate('studentId', 'fullName email profilePicture')
    .populate('internshipId', 'title department')
    .sort({ date: -1 });
};

/**
 * Get logs for student with internship details
 */
DailyLogSchema.statics.getForStudent = function(studentId, internshipId = null) {
  const query = { studentId };
  if (internshipId) query.internshipId = internshipId;
  
  return this.find(query)
    .populate('mentorId', 'fullName email')
    .populate('internshipId', 'title companyName')
    .sort({ date: -1 });
};

/**
 * Get logs by date range
 */
DailyLogSchema.statics.getByDateRange = function(
  studentId,
  startDate,
  endDate
) {
  return this.find({
    studentId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

/**
 * Get weekly summary for student
 */
DailyLogSchema.statics.getWeeklySummary = async function(studentId, weekNumber) {
  const logs = await this.find({
    studentId,
    weekNumber,
    status: 'approved'
  });
  
  const summary = {
    totalDays: logs.length,
    totalHours: 0,
    averageRating: 0,
    tasksCompleted: []
  };
  
  if (logs.length > 0) {
    summary.totalHours = logs.reduce((acc, log) => acc + log.totalHours, 0);
    
    const ratings = logs
      .filter(log => log.mentorFeedback?.rating)
      .map(log => log.mentorFeedback.rating);
    
    if (ratings.length > 0) {
      summary.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }
    
    // Collect all tasks
    logs.forEach(log => {
      log.tasksCompleted.forEach(task => {
        summary.tasksCompleted.push({
          description: task.description,
          hours: task.hoursSpent
        });
      });
    });
  }
  
  return summary;
};

/**
 * Check if student has logged today
 */
DailyLogSchema.statics.hasLoggedToday = async function(studentId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const log = await this.findOne({
    studentId,
    date: { $gte: today, $lt: tomorrow }
  });
  
  return !!log;
};

/**
 * Get streak count (consecutive days with logs)
 */
DailyLogSchema.statics.getStreak = async function(studentId) {
  const logs = await this.find({
    studentId,
    status: 'approved'
  })
    .sort({ date: -1 })
    .select('date');
  
  if (logs.length === 0) return 0;
  
  let streak = 1;
  let currentDate = new Date(logs[0].date);
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 1; i < logs.length; i++) {
    const prevDate = new Date(logs[i].date);
    prevDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }
  
  return streak;
};

module.exports = mongoose.model("DailyLog", DailyLogSchema);