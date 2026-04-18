const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
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
      default: 'admin',
      enum: ['admin']
    },
    
    profilePicture: {
      type: String,
      default: ''
    },
    
    phone: {
      type: String,
      default: ''
    },

    isSuperAdmin: {
      type: Boolean,
      default: false
    },
    
    // Simple permissions object
    permissions: {
      canManageUsers: { type: Boolean, default: true },
      canManageInternships: { type: Boolean, default: true },
      canManageRecruiters: { type: Boolean, default: true },
      canManageHR: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: true },
      canManageCompany: { type: Boolean, default: true }
    },

    lastLoginAt: Date,
    isActive: { type: Boolean, default: true },

    // Password reset
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false }
  },
  { 
    timestamps: true 
  }
);

// Method to remove sensitive data
adminSchema.methods.toSafeObject = function() {
  const admin = this.toObject();
  delete admin.password;
  delete admin.resetPasswordToken;
  delete admin.resetPasswordExpires;
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);