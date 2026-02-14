import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'dharani31082005@gmail.com',
      subject: 'Hello World - From Environment Variables!',
      html: '<p>Congrats on sending email <strong>securely</strong> with .env!</p>'
    });
    
    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Run the function
sendTestEmail();