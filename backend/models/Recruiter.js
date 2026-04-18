const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    
    password: {
      type: String,
      required: true,
      select: false
    },
    
    role: {
      type: String,
      enum: ['recruiter', 'hr'],
      default: 'recruiter'
    },
    
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Company',
      required: true
    },
    
    company: {
      type: String,
      default: 'Zoyaraa'
    },
    
    department: { 
      type: String,
      enum: ['Frontend', 'Backend', 'DevOps', 'Marketing', 'HR', 'Sales', 'UI/UX', 'Mobile']
    },
    
    designation: {
      type: String,
      default: ''
    },
    
    phone: {
      type: String,
      default: ''
    },
    
    profilePicture: {
      type: String,
      default: ''
    },
    
    permissions: {
      canPostInternship: { type: Boolean, default: true },
      canViewApplicants: { type: Boolean, default: true },
      canShortlist: { type: Boolean, default: true },
      canAcceptReject: { type: Boolean, default: true },
      canMentor: { type: Boolean, default: true },
      maxInterns: { type: Number, default: 3 },
      departmentOnly: { type: Boolean, default: true },
      canInviteRecruiters: { type: Boolean, default: false },
      canPublishCertificates: { type: Boolean, default: false },
      canViewAllDepartments: { type: Boolean, default: false },
      canManageCompany: { type: Boolean, default: false },
      canViewAllInternships: { type: Boolean, default: false },
      canViewAllApplications: { type: Boolean, default: false }
    },
    
    mentorFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter'
    },
    
    isInvited: { type: Boolean, default: false },
    invitationToken: { type: String, select: false },
    invitationExpires: { type: Date, select: false },
    invitationStatus: { 
      type: String, 
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending'
    },
    
    isActive: { type: Boolean, default: true },
    acceptedAt: Date,
    deactivatedAt: Date,
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' },
    
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    
    lastLoginAt: Date,
    lastActiveAt: Date,
    
    profileCompletion: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.invitationToken;
        delete ret.invitationExpires;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.invitationToken;
        delete ret.invitationExpires;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      }
    }
  }
);

// ===== INDEXES =====
recruiterSchema.index({ role: 1 });
recruiterSchema.index({ invitationStatus: 1 });
recruiterSchema.index({ invitationToken: 1 });
recruiterSchema.index({ department: 1 });
recruiterSchema.index({ companyId: 1 });

// ===== VIRTUALS =====
recruiterSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.fullName,
    email: this.email,
    role: this.role,
    department: this.department,
    designation: this.designation,
    permissions: this.permissions
  };
});

recruiterSchema.virtual('isHR').get(function() {
  return this.role === 'hr';
});

// ===== INSTANCE METHODS =====
recruiterSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.invitationToken;
  delete obj.invitationExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

recruiterSchema.methods.calculateProfileCompletion = function() {
  let score = 0;
  const fields = ['fullName', 'email', 'phone', 'department', 'designation'];
  fields.forEach(field => {
    if (this[field]) score += 20;
  });
  return Math.min(score, 100);
};

recruiterSchema.methods.canManageRecruiters = function() {
  return this.role === 'hr' || this.permissions?.canInviteRecruiters === true;
};

// ===== ⚠️ NO PRE-SAVE HOOKS - COMPLETELY REMOVED =====
// All logic handled in controllers

module.exports = mongoose.model('Recruiter', recruiterSchema);