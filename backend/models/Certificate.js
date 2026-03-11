const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    certificateId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    internship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true
    },
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    template: {
        type: String,
        enum: ['professional', 'modern', 'creative'],
        default: 'professional'
    },
    projectTitle: String,
    mentorName: String,
    skillsAcquired: [String],
    grade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C', 'P'],
        default: 'A'
    },
    comments: String,
    status: {
        type: String,
        enum: ['issued', 'pending', 'revoked'],
        default: 'issued'
    },
    revocationReason: String,
    revokedAt: Date,
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recruiter'
    },
    qrCodeUrl: String,
    pdfUrl: String,
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recruiter',
        required: true
    }
}, { timestamps: true });

CertificateSchema.index({ student: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
