const Recruiter = require('../models/Recruiter');
const Student = require('../models/Student'); // ✅ ADD THIS
const Internship = require('../models/Internship'); // ✅ ADD THIS
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

// Register Recruiter
const registerRecruiter = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        const existingRecruiter = await Recruiter.findOne({ email });
        if (existingRecruiter) {
            return res.status(400).json({
                success: false,
                message: 'Recruiter already exists with this email'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const recruiter = new Recruiter({
            fullName,
            email,
            password: hashedPassword
        });

        await recruiter.save();

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

        const recruiter = await Recruiter.findOne({ email });
        if (!recruiter) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, recruiter.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            { id: recruiter._id, email: recruiter.email, role: recruiter.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

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

        const isPasswordValid = await bcrypt.compare(currentPassword, recruiter.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

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

// Forgot Password
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

        const resetToken = jwt.sign(
            { id: recruiter._id },
            process.env.JWT_SECRET + recruiter.password,
            { expiresIn: '15m' }
        );

        recruiter.resetPasswordToken = resetToken;
        recruiter.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await recruiter.save();

        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
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

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

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

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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

// ✅ NEW: Get recruiter's mentees (interns they are mentoring)
const getMyMentees = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        
        // Find the recruiter to get their mentees array
        const recruiter = await Recruiter.findById(recruiterId);
        
        if (!recruiter) {
            return res.status(404).json({
                success: false,
                message: 'Recruiter not found'
            });
        }

        // If no mentees, return empty array
        if (!recruiter.mentorFor || recruiter.mentorFor.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    mentees: [],
                    total: 0
                }
            });
        }

        // Get detailed information for each mentee
        const mentees = await Promise.all(recruiter.mentorFor.map(async (studentId) => {
            const student = await Student.findById(studentId)
                .select('fullName email profilePicture education skills currentInternship createdAt');
            
            if (!student) return null;
            
            // Get their active internship details
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

        // Filter out null values
        const filteredMentees = mentees.filter(m => m !== null);

        res.status(200).json({
            success: true,
            data: {
                mentees: filteredMentees,
                total: filteredMentees.length
            }
        });
    } catch (error) {
        console.error('Error fetching mentees:', error);
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
    resetPassword,
    getMyMentees // ✅ ADD THIS
};