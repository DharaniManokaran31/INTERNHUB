// services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service is ready to send emails');
  }
});

// ============================================
// EXISTING PASSWORD RESET EMAIL - KEPT EXACTLY THE SAME
// ============================================
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    console.log(`📧 Attempting to send password reset email to: ${email}`);

    const mailOptions = {
      from: `"InternHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset Request - InternHub',
      html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - InternHub</title>
    <style>
      /* Reset styles */
      body, p, h1, h2, h3, h4, h5, h6 {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      
      /* Main container */
      .email-wrapper {
        background-color: #f4f7fc;
        padding: 40px 20px;
      }
      
      .email-container {
        max-width: 560px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      }
      
      /* Header with gradient */
      .email-header {
        background: linear-gradient(135deg, #2440F0 0%, #0a1a7a 100%);
        padding: 40px 30px;
        text-align: center;
      }
      
      .logo {
        font-size: 36px;
        font-weight: 800;
        color: white;
        letter-spacing: -0.5px;
        margin-bottom: 8px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .header-subtitle {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
      }
      
      /* Content area */
      .email-content {
        padding: 40px 35px;
        background: #ffffff;
      }
      
      .greeting {
        font-size: 24px;
        font-weight: 700;
        color: #1a1f36;
        margin-bottom: 15px;
      }
      
      .message {
        font-size: 16px;
        line-height: 1.6;
        color: #4a5568;
        margin-bottom: 25px;
      }
      
      .email-highlight {
        background: #f0f4fe;
        border-radius: 12px;
        padding: 16px 20px;
        margin: 25px 0;
        border-left: 4px solid #2440F0;
      }
      
      .email-highlight p {
        margin: 5px 0;
        color: #1e293b;
      }
      
      .email-highlight .label {
        font-size: 13px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }
      
      .email-highlight .value {
        font-size: 16px;
        font-weight: 600;
        color: #0a1a7a;
        word-break: break-all;
      }
      
      /* BUTTON - ENHANCED VERSION */
      .button-container {
        text-align: center;
        margin: 35px 0;
      }
      
      .reset-button {
        display: inline-block;
        background: #FF6B6B !important;  /* Bright coral red - very visible */
        color: #FFFFFF !important;        /* Pure white text */
        font-weight: 700;
        font-size: 18px;
        padding: 16px 42px;
        text-decoration: none;
        border-radius: 50px;
        box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
        border: 2px solid #FFFFFF;        /* White border for contrast */
        letter-spacing: 0.5px;
        transition: all 0.2s ease;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        /* Force styles */
        background-color: #FF6B6B !important;
        border-color: #FFFFFF !important;
      }
      
      .reset-button:hover {
        background: #FF5252 !important;
        box-shadow: 0 12px 28px rgba(255, 107, 107, 0.5);
        transform: translateY(-2px);
      }
      
      /* Alternative button colors - choose one */
      /* Option 2: Bright Green */
      .reset-button-green {
        background: #10B981 !important;
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
      }
      
      /* Option 3: Bright Orange */
      .reset-button-orange {
        background: #F97316 !important;
        box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4);
      }
      
      /* Option 4: Bright Purple */
      .reset-button-purple {
        background: #8B5CF6 !important;
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
      }
      
      /* Fallback link section */
      .fallback-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 20px;
        margin: 30px 0;
      }
      
      .fallback-title {
        font-size: 14px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .fallback-link {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 14px 16px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #0a1a7a;
        word-break: break-all;
        line-height: 1.6;
        margin: 10px 0;
        border-left: 3px solid #FF6B6B;
      }
      
      .fallback-note {
        font-size: 13px;
        color: #64748b;
        margin-top: 12px;
        font-style: italic;
      }
      
      /* Security notice */
      .security-notice {
        background: #fff9ed;
        border: 1px solid #fed7aa;
        border-radius: 12px;
        padding: 16px 20px;
        margin: 30px 0;
      }
      
      .security-title {
        font-size: 14px;
        font-weight: 700;
        color: #9a3412;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .security-text {
        font-size: 14px;
        color: #7b341e;
        line-height: 1.5;
      }
      
      /* Footer */
      .email-footer {
        background: #f8fafc;
        padding: 30px 35px;
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }
      
      .footer-text {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 8px;
      }
      
      .footer-text a {
        color: #2440F0;
        text-decoration: none;
        font-weight: 500;
      }
      
      .copyright {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 15px;
      }
      
      hr {
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 20px 0;
      }
      
      @media (max-width: 600px) {
        .email-content {
          padding: 30px 20px;
        }
        .reset-button {
          display: block;
          padding: 16px 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <!-- Header -->
        <div class="email-header">
          <div class="logo">InternHub</div>
          <div class="header-subtitle">Password Reset Request</div>
        </div>
        
        <!-- Content -->
        <div class="email-content">
          <h2 class="greeting">Hello,</h2>
          
          <p class="message">
            We received a request to reset the password for your InternHub account. 
            Click the button below to create a new password. For your security, 
            this link will expire in <strong>15 minutes</strong>.
          </p>
          
          <!-- Email highlight -->
          <div class="email-highlight">
            <div class="label">Account Email</div>
            <div class="value">${email}</div>
          </div>
          
          <!-- CTA Button - BRIGHT BLUE with White Text -->
<div style="text-align: center; margin: 35px 0;">
  <!-- Table-based button for maximum email client compatibility -->
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td align="center" bgcolor="#2463EB" style="background: #2463EB; padding: 18px 36px; border-radius: 60px; box-shadow: 0 6px 16px rgba(36, 99, 235, 0.4);">
        <a href="${resetUrl}" 
           style="color: #FFFFFF; 
                  font-family: Arial, Helvetica, sans-serif; 
                  font-size: 20px; 
                  font-weight: 800; 
                  text-decoration: none; 
                  line-height: 1.5;
                  display: inline-block;
                  letter-spacing: 0.5px;">
          ⚡ RESET YOUR PASSWORD ⚡
        </a>
      </td>
    </tr>
  </table>
  
  <!-- Plain text fallback link (always visible) -->
  <p style="margin-top: 20px; font-size: 15px; color: #333333; font-family: Arial, sans-serif;">
    <a href="${resetUrl}" style="color: #2463EB; font-weight: bold; text-decoration: underline; font-size: 16px;">
      ➡️ Click here to reset your password (if button doesn't work)
    </a>
  </p>
</div>
          
          <!-- Alternative colors - uncomment one if you prefer -->
          <!-- 
          <div class="button-container">
            <a href="${resetUrl}" class="reset-button" 
               style="color: #FFFFFF !important; background: #10B981 !important; border: 2px solid #FFFFFF !important;">
              🔐 RESET YOUR PASSWORD NOW
            </a>
          </div>
          -->
          
          <!-- Fallback link section -->
          <div class="fallback-section">
            <div class="fallback-title">
              <span>🔗</span> Link not working?
            </div>
            <p style="font-size: 14px; color: #475569; margin-bottom: 12px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <div class="fallback-link">
              ${resetUrl}
            </div>
            <div class="fallback-note">
              The link will expire in 15 minutes for security reasons.
            </div>
          </div>
          
          <!-- Security notice -->
          <div class="security-notice">
            <div class="security-title">
              <span>⚠️</span> Didn't request this?
            </div>
            <div class="security-text">
              If you didn't request a password reset, you can safely ignore this email. 
              Your account is secure and no changes have been made.
            </div>
          </div>
          
          <p style="font-size: 15px; color: #1e293b; margin: 30px 0 10px;">
            Best regards,<br>
            <strong style="color: #2440F0;">The InternHub Team</strong>
          </p>
        </div>
        
        <!-- Footer -->
        <div class="email-footer">
          <div class="footer-text">
            Need help? Contact us at 
            <a href="mailto:support@internhub.com">support@internhub.com</a>
          </div>
          <div class="footer-text">
            This is an automated message, please do not reply to this email.
          </div>
          <hr>
          <div class="copyright">
            © ${new Date().getFullYear()} InternHub. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully!');
    console.log('📧 To:', email);
    console.log('📧 Message ID:', info.messageId);

    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// NEW: INVITATION EMAIL FOR RECRUITERS
// ============================================
const sendInvitationEmail = async (email, name, inviteLink) => {
  try {
    console.log(`📧 Sending invitation email to: ${email}`);

    const mailOptions = {
      from: `"Zoyaraa HR" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 You\'re invited to join Zoyaraa as a Recruiter!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join Zoyaraa as a Recruiter</title>
          <style>
            body, p, h1, h2, h3, h4, h5, h6 {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            .email-wrapper {
              background-color: #f4f7fc;
              padding: 40px 20px;
            }
            .email-container {
              max-width: 560px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            }
            .email-header {
              background: linear-gradient(135deg, #2440F0 0%, #0a1a7a 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              font-size: 36px;
              font-weight: 800;
              color: white;
              letter-spacing: -0.5px;
              margin-bottom: 8px;
            }
            .header-subtitle {
              font-size: 16px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 400;
            }
            .email-content {
              padding: 40px 35px;
              background: #ffffff;
            }
            .greeting {
              font-size: 24px;
              font-weight: 700;
              color: #1a1f36;
              margin-bottom: 15px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              color: #4a5568;
              margin-bottom: 25px;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .invite-button {
              display: inline-block;
              background: linear-gradient(135deg, #2440F0, #0B1DC1);
              color: #FFFFFF !important;
              font-weight: 700;
              font-size: 18px;
              padding: 16px 42px;
              text-decoration: none;
              border-radius: 50px;
              box-shadow: 0 8px 20px rgba(36, 64, 240, 0.4);
              border: 2px solid #FFFFFF;
              letter-spacing: 0.5px;
              transition: all 0.2s ease;
            }
            .invite-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 28px rgba(36, 64, 240, 0.5);
            }
            .invite-link {
              background: #ffffff;
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 14px 16px;
              font-family: 'Courier New', monospace;
              font-size: 13px;
              color: #0a1a7a;
              word-break: break-all;
              line-height: 1.6;
              margin: 10px 0;
            }
            .email-footer {
              background: #f8fafc;
              padding: 30px 35px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text {
              font-size: 13px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .copyright {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <div class="logo">Zoyaraa</div>
                <div class="header-subtitle">Recruiter Invitation</div>
              </div>
              
              <div class="email-content">
                <h2 class="greeting">Hello ${name},</h2>
                
                <p class="message">
                  You have been invited to join <strong>Zoyaraa</strong> as a Recruiter! 
                  We'd love for you to be part of our team and help shape the future of our internship program.
                </p>
                
                <div class="button-container">
                  <a href="${inviteLink}" class="invite-button">
                    🎯 ACCEPT INVITATION
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin: 20px 0 10px;">
                  Or copy this link:
                </p>
                <div class="invite-link">
                  ${inviteLink}
                </div>
                
                <p style="color: #888; font-size: 13px; margin-top: 30px;">
                  This invitation link will expire in 7 days. If you weren't expecting this invitation, you can safely ignore this email.
                </p>
              </div>
              
              <div class="email-footer">
                <div class="footer-text">
                  This is an automated message from Zoyaraa HR
                </div>
                <div class="copyright">
                  © ${new Date().getFullYear()} Zoyaraa. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Invitation email sent successfully to:', email);
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// NEW: LOG REMINDER EMAIL
// ============================================
const sendLogReminderEmail = async (email, name, internshipTitle, type) => {
  try {
    let subject, message, actionText;

    if (type === 'daily_reminder') {
      subject = `📝 Reminder: Submit your Daily Log for ${internshipTitle}`;
      message = `This is a gentle reminder to submit your daily work log for your ${internshipTitle} internship today. Regular logs help your mentor track your progress and provide valuable feedback.`;
      actionText = `SUBMIT TODAY'S LOG`;
    } else if (type === 'missed_days_warning') {
      subject = `⚠️ Warning: Missed Daily Logs for ${internshipTitle}`;
      message = `We noticed you've missed submitting your daily logs for the past 3 days. Consistent logging is a requirement for the internship program. Please catch up on your logs or contact your mentor if you're facing any issues.`;
      actionText = `GO TO DASHBOARD`;
    }

    console.log(`📧 Sending log reminder email to: ${email}`);

    const mailOptions = {
      from: `"Zoyaraa Internship Program" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            .email-wrapper { background-color: #f4f7fc; padding: 40px 20px; font-family: sans-serif; }
            .email-container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; }
            .email-header { background: linear-gradient(135deg, #2440F0 0%, #0a1a7a 100%); padding: 30px; text-align: center; color: white; }
            .email-content { padding: 40px 35px; color: #1a1f36; }
            .greeting { font-size: 22px; font-weight: bold; margin-bottom: 20px; }
            .message { font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 30px; }
            .btn { display: inline-block; background: #2440F0; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <h2>Zoyaraa Daily Logs</h2>
              </div>
              <div class="email-content">
                <div class="greeting">Hello ${name},</div>
                <div class="message">${message}</div>
                <div style="text-align: center;">
                  <a href="http://localhost:3000/student/active-internship" class="btn">${actionText}</a>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Log reminder email sent successfully to:', email);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending log reminder email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// NEW: INTERVIEW RESULT EMAIL
// ============================================
const sendResultEmail = async (email, studentName, internshipTitle, result, roundType) => {
  try {
    const isPass = result === 'pass' || result === 'selected';
    const isReject = result === 'reject' || result === 'fail';
    const isSelected = result === 'selected';

    let subject, emoji, message, nextSteps, color;

    if (isSelected) {
      // Final selection after all rounds
      subject = `🎉 Congratulations! You've been selected for ${internshipTitle} at Zoyaraa!`;
      emoji = '🎉';
      message = `We are thrilled to inform you that you have been <strong>selected</strong> for the <strong>${internshipTitle}</strong> internship at Zoyaraa!`;
      nextSteps = 'Our HR team will contact you shortly with the offer letter and onboarding details.';
      color = '#10b981'; // Green
    } else if (isPass) {
      // Passed a round, moving to next
      subject = `✅ Great job! You've cleared the ${roundType} for ${internshipTitle}`;
      emoji = '✅';
      message = `Congratulations! You have successfully cleared the <strong>${roundType}</strong> round for the <strong>${internshipTitle}</strong> position.`;
      nextSteps = 'You will be receiving details about the next round soon. Keep up the great work!';
      color = '#10b981'; // Green
    } else if (isReject) {
      // Rejected after a round
      subject = `📧 Update on your application for ${internshipTitle}`;
      emoji = '📧';
      message = `Thank you for your interest in the <strong>${internshipTitle}</strong> position at Zoyaraa.`;
      nextSteps = 'We appreciate the time and effort you invested in the interview process. We encourage you to apply for future opportunities that match your skills.';
      color = '#dc2626'; // Red
    }

    console.log(`📧 Sending result email to: ${email} (${result})`);

    const mailOptions = {
      from: `"Zoyaraa Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Interview Result - Zoyaraa</title>
          <style>
            body, p, h1, h2, h3, h4, h5, h6 {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            .email-wrapper {
              background-color: #f4f7fc;
              padding: 40px 20px;
            }
            .email-container {
              max-width: 560px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            }
            .email-header {
              background: linear-gradient(135deg, #2440F0 0%, #0a1a7a 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              font-size: 36px;
              font-weight: 800;
              color: white;
              letter-spacing: -0.5px;
              margin-bottom: 8px;
            }
            .header-subtitle {
              font-size: 16px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 400;
            }
            .email-content {
              padding: 40px 35px;
              background: #ffffff;
            }
            .greeting {
              font-size: 24px;
              font-weight: 700;
              color: #1a1f36;
              margin-bottom: 15px;
            }
            .result-badge {
              display: inline-block;
              padding: 8px 20px;
              border-radius: 50px;
              font-weight: 700;
              font-size: 18px;
              margin: 20px 0;
              background: ${color}20;
              color: ${color};
              border: 2px solid ${color};
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              color: #4a5568;
              margin-bottom: 25px;
            }
            .next-steps {
              background: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
              border-left: 4px solid ${color};
            }
            .next-steps-title {
              font-size: 16px;
              font-weight: 700;
              color: #1a1f36;
              margin-bottom: 10px;
            }
            .next-steps-text {
              font-size: 15px;
              color: #4a5568;
              line-height: 1.6;
            }
            .email-footer {
              background: #f8fafc;
              padding: 30px 35px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text {
              font-size: 13px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .copyright {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <div class="logo">Zoyaraa</div>
                <div class="header-subtitle">Interview Result</div>
              </div>
              
              <div class="email-content">
                <h2 class="greeting">Hello ${studentName},</h2>
                
                <div style="text-align: center;">
                  <span class="result-badge">
                    ${emoji} ${isSelected ? 'SELECTED' : isPass ? 'PASSED' : 'UPDATE'}
                  </span>
                </div>
                
                <p class="message">
                  ${message}
                </p>
                
                <div class="next-steps">
                  <div class="next-steps-title">📋 What's Next?</div>
                  <div class="next-steps-text">
                    ${nextSteps}
                  </div>
                </div>
                
                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  Thank you for your interest in Zoyaraa. We appreciate your time and effort.
                </p>
              </div>
              
              <div class="email-footer">
                <div class="footer-text">
                  This is an automated message from Zoyaraa Recruitment
                </div>
                <div class="copyright">
                  © ${new Date().getFullYear()} Zoyaraa. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Result email sent successfully to: ${email}`);
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending result email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// NEW: INTERVIEW SCHEDULED EMAIL
// ============================================
const sendInterviewEmail = async (email, studentName, internshipTitle, round) => {
  try {
    console.log(`📧 Sending interview schedule email to: ${email}`);

    const mailOptions = {
      from: `"Zoyaraa Recruitment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎯 Interview Scheduled: ${round.roundType} for ${internshipTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2440F0; margin: 0;">Zoyaraa</h1>
            <p style="color: #666; margin: 5px 0 0;">Interview Schedule</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${studentName},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
            Your <strong>${round.roundType}</strong> for <strong>${internshipTitle}</strong> has been scheduled.
          </p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #2440F0;">📅 Interview Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px;">📌 Round:</td>
                <td style="padding: 8px 0; font-weight: 500;">${round.roundType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">📅 Date:</td>
                <td style="padding: 8px 0; font-weight: 500;">${new Date(round.scheduledDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">⏰ Time:</td>
                <td style="padding: 8px 0; font-weight: 500;">${round.scheduledTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">⏱️ Duration:</td>
                <td style="padding: 8px 0; font-weight: 500;">${round.duration}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">💻 Mode:</td>
                <td style="padding: 8px 0; font-weight: 500;">${round.mode}</td>
              </tr>
            </table>
            
            ${round.mode === 'online' && round.onlineDetails ? `
              <div style="margin-top: 20px; padding: 15px; background: #EEF2FF; border-radius: 8px;">
                <p style="margin: 0 0 10px; font-weight: 600;">🔗 Meeting Link:</p>
                <a href="${round.onlineDetails.meetingLink}" style="color: #2440F0; word-break: break-all;">${round.onlineDetails.meetingLink}</a>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">Platform: ${round.onlineDetails.platform}</p>
                ${round.onlineDetails.instructions ? `<p style="margin: 10px 0 0; color: #666;">📝 Instructions: ${round.onlineDetails.instructions}</p>` : ''}
              </div>
            ` : ''}
            
            ${round.mode === 'offline' && round.offlineDetails ? `
              <div style="margin-top: 20px; padding: 15px; background: #EEF2FF; border-radius: 8px;">
                <p style="margin: 0 0 10px; font-weight: 600;">📍 Venue:</p>
                <p style="margin: 5px 0;"><strong>${round.offlineDetails.venue}</strong></p>
                <p style="margin: 5px 0; color: #666;">${round.offlineDetails.address}</p>
                <p style="margin: 10px 0 0; font-weight: 600;">Contact:</p>
                <p style="margin: 5px 0;">${round.offlineDetails.contactPerson?.name}</p>
                <p style="margin: 5px 0;">📞 ${round.offlineDetails.contactPerson?.phone}</p>
                ${round.offlineDetails.entryInstructions ? `<p style="margin: 10px 0 0; color: #666;">📝 ${round.offlineDetails.entryInstructions}</p>` : ''}
              </div>
            ` : ''}
            
            ${round.mode === 'assignment' && round.assignmentDetails ? `
              <div style="margin-top: 20px; padding: 15px; background: #EEF2FF; border-radius: 8px;">
                <p style="margin: 0 0 10px; font-weight: 600;">📝 Assignment:</p>
                <p style="margin: 5px 0;"><strong>${round.assignmentDetails.title}</strong></p>
                <p style="margin: 5px 0; color: #666;">${round.assignmentDetails.description}</p>
                <p style="margin: 10px 0 0; font-weight: 600;">Submission Platform:</p>
                <p style="margin: 5px 0;">${round.assignmentDetails.submissionPlatform}</p>
                ${round.deadline ? `<p style="margin: 10px 0 0; color: #dc2626;">⏰ Deadline: ${new Date(round.deadline).toLocaleString()}</p>` : ''}
              </div>
            ` : ''}
          </div>
          
          <div style="background: #fff9ed; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              ⚠️ Please be available 10 minutes before the scheduled time. 
              If you need to reschedule, please contact the recruiter at least 24 hours in advance.
            </p>
          </div>
          
          <p style="color: #888; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            This is an automated message from Zoyaraa. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Interview schedule email sent successfully to:', email);
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending interview email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendInvitationEmail,
  sendResultEmail,
  sendInterviewEmail,
  sendLogReminderEmail
};