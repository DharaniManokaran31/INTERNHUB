// services/emailService.js - UPDATED WITH RESEND
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Send password reset email using Resend
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'InternHub <onboarding@resend.dev>',
      to: email,
      subject: '🔐 Password Reset Request - InternHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #2440F0, #0B1DC1); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; background: #f9fafc; }
            .button { 
              display: inline-block;
              background: linear-gradient(135deg, #2440F0, #0B1DC1);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 25px 0;
              border: none;
              cursor: pointer;
            }
            .footer {
              margin-top: 40px;
              text-align: center; 
              color: #666;
              font-size: 13px;
              padding: 20px;
              border-top: 1px solid #eee;
            }
            .code-box {
              background: #f0f4ff;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #2440F0;        
              margin: 20px 0;
              word-break: break-all;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: #2440F0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              color: #856404;
              padding: 15px;
              border-radius: 6px; 
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">InternHub</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>

            <div class="content">
              <h2 style="color: #2440F0; margin-top: 0;">Hello,</h2>

              <p>We received a request to reset your password for your InternHub account associated with <strong>${email}</strong>.</p>

              <p>Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button" style="color: white; text-decoration: none;">Reset Your Password</a>
              </div>

              <p>If the button doesn't work, copy and paste this link into your browser:</p>

              <div class="code-box">
                ${resetUrl}
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p style="margin: 8px 0 0;">If you didn't request this password reset, please ignore this email. Your account security is important to us.</p> 
              </div>

              <p style="margin-top: 30px;">Best regards,<br>
              <strong>The InternHub Team</strong></p>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} InternHub. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
              <p style="font-size: 12px; color: #999; margin-top: 10px;">
                Need help? Contact our support team at support@internhub.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email via Resend:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully via Resend to:', email);
    return {
      success: true,
      data,
      previewUrl: `https://resend.com/emails/${data.id || 'sent'}` // Dummy/placeholder
    };

  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPasswordResetEmail };