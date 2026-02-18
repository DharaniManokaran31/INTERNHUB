const Recruiter = require('../models/Recruiter');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');
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

// Forgot Password - FULL IMPLEMENTATION with email
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const recruiter = await Recruiter.findOne({ email });
        if (!recruiter) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, password reset instructions have been sent.'
            });
        }

        // Generate JWT token (valid for 15 minutes)
        const resetToken = jwt.sign(
            { id: recruiter._id },
            process.env.JWT_SECRET + recruiter.password,
            { expiresIn: '15m' }
        );

        // Store token in database with expiry
        recruiter.resetPasswordToken = resetToken;
        recruiter.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await recruiter.save();

        // Create reset URL
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

        // Send email
        await sendPasswordResetEmail(email, resetUrl);

        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, password reset instructions have been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Reset Password - FULL IMPLEMENTATION with token validation
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Find recruiter with valid token (not expired)
        const recruiter = await Recruiter.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!recruiter) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Validate password
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear reset fields
        recruiter.password = hashedPassword;
        recruiter.resetPasswordToken = undefined;
        recruiter.resetPasswordExpires = undefined;
        await recruiter.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
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