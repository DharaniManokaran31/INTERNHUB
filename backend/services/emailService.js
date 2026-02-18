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

module.exports = { sendPasswordResetEmail };