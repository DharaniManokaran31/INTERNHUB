const Recruiter = require('../models/Recruiter');
const Student = require('../models/Student');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendInvitationEmail } = require('../services/emailService');

// ============================================
// AUTHENTICATION (Shared by Recruiters & HR)
// ============================================

// Login (Both Recruiters and HR) - FIXED VERSION
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password field
        const user = await Recruiter.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact HR.'
            });
        }

        // Check if invitation is accepted
        if (user.invitationStatus !== 'accepted') {
            return res.status(401).json({
                success: false,
                message: 'Please accept your invitation first'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // ✅ FIX: Update last login WITHOUT calling save() (avoids pre-save hook)
        await Recruiter.updateOne(
            { _id: user._id },
            { $set: { lastLoginAt: new Date() } }
        );

        // Generate JWT
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                department: user.department
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove sensitive data
        const userResponse = user.toSafeObject();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
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

        // Get mentee details
        if (user.mentorFor && user.mentorFor.length > 0) {
            await user.populate('mentorFor', 'fullName email profilePicture currentEducation');
        }

        res.status(200).json({
            success: true,
            data: { user: user.toSafeObject() }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
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
        delete updates.companyId;

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
            data: { user: user.toSafeObject() }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await Recruiter.findById(req.user.id).select('+password');

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
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
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
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
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
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// ============================================
// ACCEPT INVITATION - FINAL FIXED VERSION
// ============================================
exports.acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        console.log('🔍 Looking for token:', token);

        // Try to find by token first (for pending invites)
        let recruiter = await Recruiter.findOne({
            invitationToken: token
        });

        // If found by token, process normally
        if (recruiter) {
            console.log('✅ Found by token:', recruiter.email);
            console.log('📊 Status:', recruiter.invitationStatus);

            // Check if token is expired
            if (recruiter.invitationExpires < Date.now()) {
                return res.status(400).json({
                    success: false,
                    message: 'This invitation has expired. Please contact HR for a new invitation.'
                });
            }

            // Check if already accepted (shouldn't happen if token exists, but just in case)
            if (recruiter.invitationStatus === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'You have already accepted this invitation. Please login with your credentials.',
                    redirectTo: '/login'
                });
            }

            // Check if still pending
            if (recruiter.invitationStatus !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'This invitation is no longer valid. Please contact HR.'
                });
            }

            // Validate password
            if (!password || password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update recruiter
            recruiter.password = hashedPassword;
            recruiter.invitationStatus = 'accepted';
            recruiter.isInvited = false;
            recruiter.invitationToken = undefined;
            recruiter.invitationExpires = undefined;
            recruiter.isActive = true;
            recruiter.lastLoginAt = new Date();

            await recruiter.save();

            // Generate JWT
            const token_jwt = jwt.sign(
                { 
                    id: recruiter._id, 
                    email: recruiter.email, 
                    role: recruiter.role,
                    department: recruiter.department
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                success: true,
                message: 'Account created successfully',
                data: {
                    user: recruiter.toSafeObject(),
                    token: token_jwt
                }
            });
        }

        // ===== TOKEN NOT FOUND - Check if this is a reused link =====
        console.log('❌ Token not found in database');

        // Try to find ANY recruiter that might have used this token before
        // Since we can't find by token, we'll look for recently accepted recruiters
        const recentAccepted = await Recruiter.findOne({
            invitationStatus: 'accepted',
            updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }).sort({ updatedAt: -1 });

        if (recentAccepted) {
            console.log('✅ Found recently accepted recruiter:', recentAccepted.email);
            return res.status(400).json({
                success: false,
                message: 'This invitation link has already been used. Please login with your credentials.',
                redirectTo: '/login'
            });
        }

        // If still not found, token is completely invalid
        return res.status(400).json({
            success: false,
            message: 'Invalid invitation token. Please contact HR for assistance.'
        });

    } catch (error) {
        console.error('❌ Accept invitation error:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
// ============================================
// RECRUITER-SPECIFIC FUNCTIONS
// ============================================

// Get My Mentees
exports.getMyMentees = async (req, res) => {
    try {
        const recruiterId = req.user.id;

        const recruiter = await Recruiter.findById(recruiterId);

        if (!recruiter || !recruiter.mentorFor || recruiter.mentorFor.length === 0) {
            return res.status(200).json({
                success: true,
                data: { mentees: [], total: 0 }
            });
        }

        const mentees = await Promise.all(recruiter.mentorFor.map(async (studentId) => {
            const student = await Student.findById(studentId)
                .select('fullName email profilePicture currentEducation skills createdAt');

            if (!student) return null;

            // Get active internship
            const application = await Application.findOne({
                studentId: student._id,
                status: 'accepted'
            }).populate('internshipId', 'title startDate endDate duration');

            let progress = 'Not started';
            if (application?.internshipId?.startDate) {
                const start = new Date(application.internshipId.startDate);
                const now = new Date();
                const daysPassed = Math.floor((now - start) / (24 * 60 * 60 * 1000));
                const totalDays = application.internshipId.duration * 30 || 60;
                progress = `Day ${Math.min(daysPassed + 1, totalDays)}/${totalDays}`;
            }

            return {
                _id: student._id,
                fullName: student.fullName,
                email: student.email,
                profilePicture: student.profilePicture,
                education: student.currentEducation,
                skills: student.skills,
                internship: application ? {
                    title: application.internshipId?.title,
                    startDate: application.internshipId?.startDate,
                    progress
                } : null
            };
        }));

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

// Get Department Stats
exports.getMyDepartmentStats = async (req, res) => {
    try {
        const recruiter = await Recruiter.findById(req.user.id);

        const internships = await Internship.find({
            department: recruiter.department,
            postedBy: req.user.id
        });

        const internshipIds = internships.map(i => i._id);
        
        const applications = await Application.find({
            internshipId: { $in: internshipIds }
        });

        res.status(200).json({
            success: true,
            data: {
                totalInternships: internships.length,
                activeInternships: internships.filter(i => i.status === 'active').length,
                totalApplications: applications.length,
                pendingApplications: applications.filter(a => a.status === 'pending').length,
                acceptedApplications: applications.filter(a => a.status === 'accepted').length,
                shortlistedApplications: applications.filter(a => a.status === 'shortlisted').length,
                rejectedApplications: applications.filter(a => a.status === 'rejected').length
            }
        });
    } catch (error) {
        console.error('Error getting department stats:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Get Student by ID (for recruiters)
exports.getStudentById = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findById(studentId)
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Check if this student is a mentee of the recruiter
        const recruiter = await Recruiter.findById(req.user.id);
        const isMentee = recruiter.mentorFor?.includes(studentId);

        if (!isMentee && req.user.role !== 'hr') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view this student"
            });
        }

        // Get student's applications for this recruiter's internships
        const applications = await Application.find({
            studentId: student._id,
            recruiterId: req.user.id
        }).populate('internshipId', 'title');

        const studentObj = student.toSafeObject();
        
        // Add file URLs
        if (studentObj.resume?.resumeFile) {
            studentObj.resume.resumeUrl = `${req.protocol}://${req.get('host')}${studentObj.resume.resumeFile}`;
        }

        res.status(200).json({
            success: true,
            data: { 
                student: studentObj,
                applications 
            }
        });
    } catch (error) {
        console.error('Error getting student:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

