const Recruiter = require('../models/Recruiter');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// REMOVED: const sendEmail = require('../utils/sendEmail');

// Register Recruiter
const registerRecruiter = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if recruiter exists
        const existingRecruiter = await Recruiter.findOne({ email });
        if (existingRecruiter) {
            return res.status(400).json({
                success: false,
                message: 'Recruiter already exists with this email'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new recruiter
        const recruiter = new Recruiter({
            fullName,
            email,
            password: hashedPassword
        });

        await recruiter.save();

        // Remove password from response
        const recruiterWithoutPassword = recruiter.toObject();
        delete recruiterWithoutPassword.password;

        res.status(201).json({
            success: true,
            message: 'Recruiter registered successfully',
            data: {
                user: recruiterWithoutPassword
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Login Recruiter
const loginRecruiter = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find recruiter
        const recruiter = await Recruiter.findOne({ email });
        if (!recruiter) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, recruiter.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: recruiter._id, email: recruiter.email, role: recruiter.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Remove password from response
        const recruiterWithoutPassword = recruiter.toObject();
        delete recruiterWithoutPassword.password;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: recruiterWithoutPassword,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Recruiter Profile
const getRecruiterProfile = async (req, res) => {
    try {
        const recruiter = await Recruiter.findById(req.user.id).select('-password');
        
        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: recruiter
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Recruiter Profile
const updateRecruiterProfile = async (req, res) => {
    try {
        const updates = req.body;
        
        // Remove fields that shouldn't be updated
        delete updates.password;
        delete updates.email;
        delete updates.role;

        const recruiter = await Recruiter.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: recruiter
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const recruiter = await Recruiter.findById(req.user.id);

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, recruiter.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        recruiter.password = hashedPassword;
        await recruiter.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Forgot Password (Simplified - no email)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const recruiter = await Recruiter.findOne({ email });
        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter not found with this email'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // In production, store this token in database with expiry
        // For now, just return success message
        res.status(200).json({
            success: true,
            message: 'Password reset functionality - Please contact admin for password reset',
            // In development, you can return the token for testing
            devToken: resetToken
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Reset Password (Simplified)
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, email } = req.body;

        // Simple implementation - find by email
        const recruiter = await Recruiter.findOne({ email });
        
        if (!recruiter) {
            return res.status(400).json({
                success: false,
                message: 'Recruiter not found'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);
        recruiter.password = hashedPassword;
        await recruiter.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    registerRecruiter,
    loginRecruiter,
    getRecruiterProfile,
    updateRecruiterProfile,
    changePassword,
    forgotPassword,
    resetPassword
};