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
    // 👑 UPDATED: Now includes 'hr' role
    role: {
        type: String,
        enum: ['recruiter', 'hr'],  // Both recruiter and hr
        default: 'recruiter'
    },
    company: {
        type: String,
        default: ''
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
    
    // ✅ NEW: ZOYARAA-SPECIFIC FIELDS
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company',
        default: null
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
    
    // ✅ Permissions based on role
    permissions: {
        canPostInternship: { type: Boolean, default: true },
        canInviteRecruiters: { type: Boolean, default: false },  // Only HR can
        canPublishCertificates: { type: Boolean, default: false }, // Only HR can
        canViewAllDepartments: { type: Boolean, default: false }, // Only HR can
        departmentOnly: { type: Boolean, default: true },
        maxInterns: { type: Number, default: 3 }
    },
    
    mentorFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    
    // Invitation fields
    isInvited: { type: Boolean, default: false },
    invitationToken: String,
    invitationExpires: Date,
    invitationStatus: { 
        type: String, 
        enum: ['pending', 'accepted', 'expired'],
        default: 'pending'
    },
    
    // ✅ KEEP YOUR EXISTING PASSWORD RESET FIELDS
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Recruiter', recruiterSchema);