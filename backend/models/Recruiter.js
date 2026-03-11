const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema({
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
        required: true
    },
    // 👑 Role-based access: Both recruiters and HR use same model
    role: {
        type: String,
        enum: ['recruiter', 'hr'],
        default: 'recruiter'
    },
    company: {
        type: String,
        default: 'Zoyaraa'
    },
    position: {
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
    companyDescription: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    linkedin: {
        type: String,
        default: ''
    },
    
    // ✅ ZOYARAA-SPECIFIC FIELDS
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company',
        required: true
    },
    
    department: { 
        type: String, 
        enum: ['Frontend', 'Backend', 'DevOps', 'Marketing', 'HR', 'Sales', 'UI/UX', 'Mobile'],
        default: null
    },
    
    designation: {
        type: String,
        default: ''
    },
    
    // ✅ Role-Based Permissions
    permissions: {
        // Recruiter permissions
        canPostInternship: { type: Boolean, default: true },
        canViewApplicants: { type: Boolean, default: true },
        canShortlist: { type: Boolean, default: true },
        canAcceptReject: { type: Boolean, default: true },
        canMentor: { type: Boolean, default: true },
        maxInterns: { type: Number, default: 3 },
        departmentOnly: { type: Boolean, default: true },
        
        // HR-only permissions (default false for recruiters)
        canInviteRecruiters: { type: Boolean, default: false },
        canPublishCertificates: { type: Boolean, default: false },
        canViewAllDepartments: { type: Boolean, default: false },
        canManageCompany: { type: Boolean, default: false },
        canViewAllInternships: { type: Boolean, default: false },
        canViewAllApplications: { type: Boolean, default: false }
    },
    
    // Mentees (for recruiters)
    mentorFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recruiter' // References the HR who added them
    },
    
    // Invitation fields (for recruiters)
    isInvited: { type: Boolean, default: false },
    invitationToken: String,
    invitationExpires: Date,
    invitationStatus: { 
        type: String, 
        enum: ['pending', 'accepted', 'expired', 'revoked'],
        default: 'pending'
    },
    
    // Account status
    isActive: {
        type: Boolean,
        default: true
    },
    deactivatedAt: Date,
    deactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recruiter'
    },
    
    // Password reset fields
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    
    // Activity tracking
    lastLoginAt: Date,
    lastActiveAt: Date
    
}, {
    timestamps: true
});

// Index for faster queries
recruiterSchema.index({ role: 1 });
recruiterSchema.index({ invitationStatus: 1 });
recruiterSchema.index({ department: 1 });

// Virtual for full profile
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

// Method to check if HR
recruiterSchema.methods.isHR = function() {
    return this.role === 'hr';
};

// Method to check if can manage recruiters
recruiterSchema.methods.canManageRecruiters = function() {
    return this.role === 'hr' || this.permissions?.canInviteRecruiters === true;
};

module.exports = mongoose.model('Recruiter', recruiterSchema);