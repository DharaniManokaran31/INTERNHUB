const Recruiter = require('../models/Recruiter');
const Student = require('../models/Student');
const Internship = require('../models/Internship');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

// ============================================
// AUTHENTICATION (Shared by both Recruiters & HR)
// ============================================

// Login (Both Recruiters and HR use this)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Allow login if isActive is explicitly true, or if it doesn't exist (assuming default true)
        const user = await Recruiter.findOne({ email, isActive: { $ne: false } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                department: user.department
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Profile (Both)
const getProfile = async (req, res) => {
    try {
        const user = await Recruiter.findById(req.user.id)
            .select('-password')
            .populate('addedBy', 'fullName email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Profile (Both - but limited fields)
const updateProfile = async (req, res) => {
    try {
        const updates = req.body;
        const userId = req.user.id;

        // Remove fields that cannot be self-updated
        delete updates.password;
        delete updates.email;
        delete updates.role;
        delete updates.permissions;
        delete updates.isActive;
        delete updates.invitationStatus;

        // Recruiters cannot change department (set by HR)
        if (req.user.role === 'recruiter') {
            delete updates.department;
        }

        const user = await Recruiter.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Change Password (Both)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await Recruiter.findById(req.user.id);

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Forgot Password (Both)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await Recruiter.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists, reset instructions have been sent.'
            });
        }

        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET + user.password,
            { expiresIn: '15m' }
        );

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        await sendPasswordResetEmail(email, resetUrl);

        res.status(200).json({
            success: true,
            message: 'If an account exists, reset instructions have been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Reset Password (Both)
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await Recruiter.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ============================================
// RECRUITER-SPECIFIC FUNCTIONS
// ============================================

// Get recruiter's mentees
const getMyMentees = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        const recruiter = await Recruiter.findById(recruiterId);

        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter not found'
            });
        }

        if (!recruiter.mentorFor || recruiter.mentorFor.length === 0) {
            return res.status(200).json({
                success: true,
                data: { mentees: [], total: 0 }
            });
        }

        const mentees = await Promise.all(recruiter.mentorFor.map(async (studentId) => {
            const student = await Student.findById(studentId)
                .select('fullName email profilePicture education skills currentInternship createdAt');

            if (!student) return null;

            let internship = null;
            let progress = 'Not started';

            if (student?.currentInternship) {
                internship = await Internship.findById(student.currentInternship)
                    .select('title department startDate endDate duration');

                if (internship?.startDate) {
                    const start = new Date(internship.startDate);
                    const now = new Date();
                    const weeksPassed = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
                    const totalWeeks = internship.duration || 12;
                    const currentWeek = Math.min(weeksPassed + 1, totalWeeks);
                    progress = `Week ${currentWeek}/${totalWeeks}`;
                }
            }

            return {
                _id: student._id,
                fullName: student.fullName,
                email: student.email,
                profilePicture: student.profilePicture,
                education: student.education,
                skills: student.skills,
                internship: internship ? {
                    title: internship.title,
                    department: internship.department,
                    startDate: internship.startDate,
                    endDate: internship.endDate,
                    progress
                } : null,
                createdAt: student.createdAt
            };
        }));

        const filteredMentees = mentees.filter(m => m !== null);

        res.status(200).json({
            success: true,
            data: { mentees: filteredMentees, total: filteredMentees.length }
        });
    } catch (error) {
        console.error('Error fetching mentees:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get recruiter's department stats
const getMyDepartmentStats = async (req, res) => {
    try {
        const recruiter = await Recruiter.findById(req.user.id);

        const internships = await Internship.find({
            department: recruiter.department,
            postedBy: req.user.id
        });

        const internshipIds = internships.map(i => i._id);
        const applications = await Application.find({
            internship: { $in: internshipIds }
        });

        res.status(200).json({
            success: true,
            data: {
                totalInternships: internships.length,
                activeInternships: internships.filter(i => i.status === 'active').length,
                totalApplications: applications.length,
                pendingApplications: applications.filter(a => a.status === 'pending').length,
                acceptedApplications: applications.filter(a => a.status === 'accepted').length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    // Shared auth functions
    login,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,

    // Recruiter-specific
    getMyMentees,
    getMyDepartmentStats
};