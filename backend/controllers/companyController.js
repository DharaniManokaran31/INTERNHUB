const Company = require('../models/Company');
const Recruiter = require('../models/Recruiter');
const { sendInvitationEmail } = require('../services/emailService'); // ✅ ADD THIS

// Get company profile
exports.getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findOne({});
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: { company } 
    });
  } catch (error) {
    console.error('Error in getCompanyProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get all recruiters
exports.getAllRecruiters = async (req, res) => {
  try {
    const company = await Company.findOne({});
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }

    const recruiters = await Recruiter.find({ companyId: company._id });
    
    const active = recruiters.filter(r => r.invitationStatus === 'accepted');
    const pending = recruiters.filter(r => r.invitationStatus === 'pending');
    
    res.json({ 
      success: true, 
      data: { 
        active, 
        pending,
        total: recruiters.length 
      } 
    });
  } catch (error) {
    console.error('Error in getAllRecruiters:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Invite recruiter
exports.inviteRecruiter = async (req, res) => {
  try {
    const { fullName, email, department, designation, maxInterns } = req.body;
    
    // Check if recruiter already exists
    const existingRecruiter = await Recruiter.findOne({ email });
    if (existingRecruiter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recruiter with this email already exists' 
      });
    }

    const company = await Company.findOne({});
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company not found' 
      });
    }
    
    // Generate invitation token
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const recruiter = new Recruiter({
      fullName,
      email,
      department,
      designation,
      companyId: company._id,
      isInvited: true,
      invitationStatus: 'pending',
      invitationToken,
      invitationExpires,
      permissions: { 
        maxInterns: maxInterns || 3,
        canPostInternship: true,
        departmentOnly: true 
      },
      // Temporary password (will be set when they accept)
      password: await require('bcryptjs').hash('temp123', 10)
    });
    
    await recruiter.save();
    
    // ✅ SEND INVITATION EMAIL
    try {
      const inviteLink = `http://localhost:3000/accept-invite/${invitationToken}`;
      await sendInvitationEmail(email, fullName, inviteLink);
      console.log(`✅ Invitation email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      // Don't fail the request if email fails - just log it
    }
    
    res.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      data: { 
        recruiter: {
          id: recruiter._id,
          fullName: recruiter.fullName,
          email: recruiter.email,
          department: recruiter.department
        }
      }
    });
  } catch (error) {
    console.error('Error in inviteRecruiter:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Resend invitation
exports.resendInvitation = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({ 
        success: false, 
        message: 'Recruiter not found' 
      });
    }
    
    // Generate new token
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
    
    recruiter.invitationToken = invitationToken;
    recruiter.invitationExpires = invitationExpires;
    await recruiter.save();
    
    // ✅ SEND INVITATION EMAIL AGAIN
    try {
      const inviteLink = `http://localhost:3000/accept-invite/${invitationToken}`;
      await sendInvitationEmail(recruiter.email, recruiter.fullName, inviteLink);
      console.log(`✅ Resent invitation email to ${recruiter.email}`);
    } catch (emailError) {
      console.error('❌ Failed to resend email:', emailError);
    }
    
    res.json({ 
      success: true, 
      message: 'Invitation resent successfully' 
    });
  } catch (error) {
    console.error('Error in resendInvitation:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Accept invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const recruiter = await Recruiter.findOne({
      invitationToken: token,
      invitationExpires: { $gt: Date.now() }
    });
    
    if (!recruiter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired invitation token' 
      });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    recruiter.password = hashedPassword;
    recruiter.invitationStatus = 'accepted';
    recruiter.invitationToken = undefined;
    recruiter.invitationExpires = undefined;
    recruiter.isInvited = false;
    await recruiter.save();
    
    const jwt = require('jsonwebtoken');
    const token_jwt = jwt.sign(
      { id: recruiter._id, email: recruiter.email, role: recruiter.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Account created successfully',
      data: {
        user: {
          id: recruiter._id,
          fullName: recruiter.fullName,
          email: recruiter.email,
          role: recruiter.role,
          department: recruiter.department
        },
        token: token_jwt
      }
    });
  } catch (error) {
    console.error('Error in acceptInvitation:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};