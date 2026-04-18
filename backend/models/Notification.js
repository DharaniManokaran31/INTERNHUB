const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    // Recipient (polymorphic)
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Recipient ID is required"],
      refPath: 'recipientModel'
    },
    
    recipientModel: {
      type: String,
      required: [true, "Recipient model is required"],
      enum: {
        values: ['Student', 'Recruiter'],
        message: "{VALUE} is not a valid recipient model"
      }
    },

    // Notification Type
    type: {
      type: String,
      enum: {
        values: [
          'application_received',
          'application_status_change',
          'internship_expiring',
          'new_internship',
          'deadline_approaching',
          'interview_scheduled',
          'interview_rescheduled',
          'interview_cancelled',
          'interview_result',
          'certificate_issued',
          'certificate_revoked',
          'new_progress_log',
          'log_feedback',
          'log_reminder',
          'mentor_assigned',
          'internship_completed',
          'welcome_message'
        ],
        message: "{VALUE} is not a valid notification type"
      },
      required: [true, "Notification type is required"],
      index: true
    },

    // Content
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"]
    },

    // Related Data
    data: {
      internshipId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Internship' 
      },
      applicationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Application' 
      },
      interviewId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Interview' 
      },
      certificateId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Certificate' 
      },
      dailyLogId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'DailyLog' 
      },
      recruiterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recruiter' 
      },
      studentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student' 
      },
      url: {
        type: String,
        trim: true
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },

    // Status
    isRead: {
      type: Boolean,
      default: false
    },
    
    readAt: Date,

    isClicked: {
      type: Boolean,
      default: false
    },
    
    clickedAt: Date,

    // Priority
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: "{VALUE} is not a valid priority"
      },
      default: 'medium'
    },

    // Expiry
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },

    // Email tracking
    emailSent: {
      type: Boolean,
      default: false
    },
    
    emailSentAt: Date,

    // For batch operations
    batchId: {
      type: String,
      index: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ===== INDEXES FOR PERFORMANCE =====
NotificationSchema.index({ recipientId: 1, recipientModel: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, recipientModel: 1, isRead: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ===== VIRTUALS =====
NotificationSchema.virtual('timeAgo').get(function() {
  const diff = Date.now() - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

NotificationSchema.virtual('icon').get(function() {
  const icons = {
    application_received: '📥',
    application_status_change: '📊',
    internship_expiring: '⚠️',
    new_internship: '🎯',
    deadline_approaching: '⏰',
    interview_scheduled: '📅',
    interview_rescheduled: '🔄',
    interview_cancelled: '❌',
    interview_result: '🎉',
    certificate_issued: '🏆',
    certificate_revoked: '🔴',
    new_progress_log: '📝',
    log_feedback: '💬',
    log_reminder: '🔔',
    mentor_assigned: '👨‍🏫',
    internship_completed: '✅',
    welcome_message: '👋'
  };
  return icons[this.type] || '📌';
});

NotificationSchema.virtual('color').get(function() {
  const colors = {
    low: '#28a745',
    medium: '#ffc107',
    high: '#fd7e14',
    urgent: '#dc3545'
  };
  return colors[this.priority] || '#6c757d';
});

// ===== PRE-SAVE HOOKS - FIXED =====
// Using async/await pattern - NO 'next' parameter needed
NotificationSchema.pre('save', async function() {
  try {
    // Set priority based on type if not already set
    if (!this.priority) {
      const priorityMap = {
        interview_scheduled: 'high',
        interview_result: 'high',
        certificate_issued: 'high',
        certificate_revoked: 'high',
        application_received: 'medium',
        application_status_change: 'medium',
        new_progress_log: 'medium',
        log_feedback: 'medium',
        log_reminder: 'medium',
        deadline_approaching: 'medium',
        internship_expiring: 'medium',
        interview_rescheduled: 'medium',
        interview_cancelled: 'medium',
        new_internship: 'low',
        mentor_assigned: 'low',
        internship_completed: 'low',
        welcome_message: 'low'
      };
      
      this.priority = priorityMap[this.type] || 'medium';
    }
    
    // Set readAt if isRead is true
    if (this.isRead && !this.readAt) {
      this.readAt = new Date();
    }
    
    // No next() needed with async/await
  } catch (error) {
    console.error('Error in notification pre-save:', error);
    throw error; // Let Mongoose handle the error
  }
});

// ===== INSTANCE METHODS =====
NotificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

NotificationSchema.methods.markAsClicked = async function() {
  if (!this.isClicked) {
    this.isClicked = true;
    this.clickedAt = new Date();
    await this.save();
  }
  return this;
};

NotificationSchema.methods.getActionUrl = function() {
  if (this.data.url) return this.data.url;
  
  switch (this.type) {
    case 'application_received':
    case 'application_status_change':
      return this.data.applicationId 
        ? `/recruiter/applications/${this.data.applicationId}`
        : null;
    
    case 'interview_scheduled':
    case 'interview_rescheduled':
    case 'interview_cancelled':
    case 'interview_result':
      return this.data.interviewId
        ? (this.recipientModel === 'Student' 
            ? `/student/interviews/${this.data.interviewId}`
            : `/recruiter/interviews/${this.data.interviewId}`)
        : null;
    
    case 'certificate_issued':
    case 'certificate_revoked':
      return this.recipientModel === 'Student'
        ? '/student/certificates'
        : `/hr/certificates/${this.data.certificateId}`;
    
    case 'new_progress_log':
    case 'log_feedback':
      return this.recipientModel === 'Student'
        ? '/student/my-logs'
        : `/recruiter/review-logs?student=${this.data.studentId}`;
    
    case 'new_internship':
      return '/student/internships';
    
    default:
      return null;
  }
};

// ===== STATIC METHODS =====
NotificationSchema.statics.createForUser = async function(
  recipientId,
  recipientModel,
  type,
  title,
  message,
  data = {},
  priority = null
) {
  try {
    const notification = new this({
      recipientId,
      recipientModel,
      type,
      title,
      message,
      data,
      priority: priority || undefined
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error in createForUser:', error);
    return null;
  }
};

NotificationSchema.statics.createForUsers = async function(
  recipients,
  type,
  title,
  message,
  data = {},
  priority = null
) {
  try {
    const notifications = recipients.map(recipient => ({
      recipientId: recipient.id,
      recipientModel: recipient.model,
      type,
      title,
      message,
      data,
      priority: priority || undefined,
      batchId: new mongoose.Types.ObjectId().toString()
    }));
    
    const result = await this.insertMany(notifications);
    return result;
  } catch (error) {
    console.error('Error in createForUsers:', error);
    return [];
  }
};

NotificationSchema.statics.getUnreadCount = async function(
  recipientId,
  recipientModel
) {
  try {
    return this.countDocuments({
      recipientId,
      recipientModel,
      isRead: false,
      expiresAt: { $gt: new Date() }
    });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return 0;
  }
};

NotificationSchema.statics.getForUser = function(
  recipientId,
  recipientModel,
  page = 1,
  limit = 20,
  filter = {}
) {
  const query = {
    recipientId,
    recipientModel,
    expiresAt: { $gt: new Date() },
    ...filter
  };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

NotificationSchema.statics.markAllAsRead = async function(
  recipientId,
  recipientModel
) {
  try {
    const result = await this.updateMany(
      {
        recipientId,
        recipientModel,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    return 0;
  }
};

NotificationSchema.statics.deleteOld = async function(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error in deleteOld:', error);
    return 0;
  }
};

NotificationSchema.statics.getStats = async function() {
  try {
    const stats = await this.aggregate([
      { $group: {
        _id: '$type',
        count: { $sum: 1 },
        unread: { $sum: { $cond: ['$isRead', 0, 1] } }
      }}
    ]);
    
    return stats;
  } catch (error) {
    console.error('Error in getStats:', error);
    return [];
  }
};

module.exports = mongoose.model('Notification', NotificationSchema);