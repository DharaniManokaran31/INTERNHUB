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
    role: {
        type: String,
        default: 'recruiter',
        enum: ['recruiter']
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Recruiter', recruiterSchema);