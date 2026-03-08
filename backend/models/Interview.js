// backend/models/Interview.js
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  // ===== LINKS TO OTHER MODELS =====
  applicationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Application', 
    required: true 
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  internshipId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Internship', 
    required: true 
  },
  recruiterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Recruiter', 
    required: true 
  },

  // ===== INTERVIEW ROUNDS =====
  rounds: [{
    roundNumber: { 
      type: Number, 
      required: true 
    },
    roundType: { 
      type: String, 
      enum: ['Technical Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Assignment'],
      required: true 
    },
    duration: String,
    
    status: { 
      type: String, 
      enum: ['pending', 'scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'pending'
    },
    
    mode: { 
      type: String, 
      enum: ['online', 'offline', 'assignment'],
      default: 'online'
    },
    
    // Online details
    onlineDetails: {
      platform: String,
      meetingLink: String,
      testLink: String,
      testPlatform: String,
      accessCode: String,
      instructions: String
    },
    
    // Offline details
    offlineDetails: {
      venue: String,
      address: String,
      city: String,
      landmark: String,
      roomNumber: String,
      floor: String,
      contactPerson: {
        name: String,
        phone: String,
        email: String,
        designation: String
      },
      parkingInfo: String,
      entryInstructions: String
    },
    
    // Assignment details
    assignmentDetails: {
      title: String,
      description: String,
      requirements: [String],
      technologies: [String],
      deliverables: [String],
      submissionPlatform: String,
      evaluationCriteria: [{
        criterion: String,
        weightage: Number
      }],
      resources: [String]
    },
    
    // Scheduling
    scheduledDate: Date,
    scheduledTime: String,
    scheduledAt: Date,
    deadline: Date,
    
    // Student submission
    studentSubmission: {
      submittedAt: Date,
      submissionLink: String,
      files: [String],
      notes: String,
      submittedOnTime: { type: Boolean, default: true }
    },
    
    // Results
    result: { 
      type: String, 
      enum: ['pass', 'fail', 'pending'],
      default: 'pending'
    },
    score: Number,
    percentage: Number,
    
    feedback: {
      rating: Number,
      strengths: String,
      weaknesses: String,
      technicalSkills: Number,
      communicationSkills: Number,
      problemSolving: Number,
      overallImpression: String,
      detailedNotes: String,
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
      durationAttended: Number,
      recruiterMarkedPresent: { type: Boolean, default: false },
      noShowReason: String
    },
    
    // ✅ FIXED: rescheduleHistory array
    rescheduleHistory: [{
      requestedBy: { type: String, enum: ['recruiter', 'student'] },
      requestedAt: Date,
      originalDate: Date,
      originalTime: String,
      newDate: Date,
      newTime: String,
      reason: String,
      approved: { type: Boolean, default: true },
      approvedAt: Date
    }],
    
    completedAt: Date,
    feedbackSubmittedAt: Date
  }],

  // ===== CURRENT ROUND =====
  currentRound: { 
    type: Number, 
    default: 1 
  },
  
  // ===== OVERALL STATUS =====
  overallStatus: { 
    type: String, 
    enum: ['in_progress', 'selected', 'rejected', 'on_hold'],
    default: 'in_progress'
  },
  
  // ===== FINAL DECISION =====
  finalDecision: {
    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
    madeAt: Date,
    decision: { type: String, enum: ['selected', 'rejected'] },
    comments: String,
    offerLetterGenerated: { type: Boolean, default: false }
  },

  // ===== COMMUNICATION LOG =====
  communicationLog: [{
    type: { type: String, enum: ['email', 'sms', 'call'] },
    sentTo: String,
    sentAt: Date,
    subject: String,
    content: String,
    status: String
  }],

  // ===== NOTES =====
  notes: String,
  internalNotes: String

}, { 
  timestamps: true
});

// ✅ REMOVED the pre-save hook entirely - timestamps handles it
// interviewSchema.pre('save', function(next) {
//   next();
// });

module.exports = mongoose.model('Interview', interviewSchema);