import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of email
 * @param {string} [from='onboarding@resend.dev'] - Sender email
 * @returns {Promise} - Resend API response
 */
export async function sendEmail(to, subject, html, from = 'onboarding@resend.dev') {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    
    console.log(`Email sent to ${to}: ${subject}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userEmail, userName) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to InternHub, ${userName}! 👋</h2>
      <p>We're excited to have you join our platform for internships and career opportunities.</p>
      <p>Get started by:</p>
      <ul>
        <li>Completing your profile</li>
        <li>Browsing available internships</li>
        <li>Connecting with companies</li>
      </ul>
      <p>Best regards,<br>The InternHub Team</p>
    </div>
  `;
  
  return await sendEmail(
    userEmail,
    'Welcome to InternHub! Start Your Journey',
    html
  );
}