import { Resend } from 'resend';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

const resend = new Resend(config.RESEND_API_KEY);

console.log('📧 EMAIL SERVICE: Using Resend');
console.log('  - RESEND_API_KEY:', config.RESEND_API_KEY ? '✅ Set' : '❌ MISSING');

export const sendPasswordResetEmail = async (email, firstName, token) => {
  console.log(`📧 Sending password reset email to: ${email} via Resend`);

  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset Your Password - Sew Le Sew',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <h2 style="color: #e74c3c;">Sew Le Sew</h2>
          <p>Hello ${firstName},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link expires in 1 hour.</p>
          <hr>
          <p style="font-size: 12px;">&copy; 2026 Sew Le Sew</p>
        </body>
        </html>
      `
    });
    console.log(`✅ Password reset email sent to ${email} via Resend`);
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Resend error:`, error.message);
    logger.error(`Failed to send email:`, error.message);
    return false;
  }
};

export const sendVerificationStatusEmail = async (email, firstName, data) => {
  console.log(`📧 Sending verification email to: ${email}`);

  const { category, status, reason } = data;
  const isApproved = status === 'approved';

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: isApproved ? '✅ Donation Approved - Sew Le Sew' : '📋 Donation Update - Sew Le Sew',
      html: `
        <h2 style="color: #e74c3c;">Sew Le Sew</h2>
        <p>Hello ${firstName},</p>
        ${isApproved
          ? `<p>Great news! Your ${category} donation has been <strong>approved</strong>.</p>`
          : `<p>Your ${category} donation requires attention. ${reason ? `Reason: ${reason}` : ''}</p>`
        }
        <a href="${config.frontendUrl}/dashboard">Go to Dashboard</a>
      `
    });
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Resend error:`, error.message);
    return false;
  }
};

export const sendMatchNotificationEmail = async (email, firstName, matchData) => {
  console.log(`📧 Sending match notification to: ${email}`);

  const { donationType, recipientName, location, date } = matchData;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: '🎉 You Have a Match! - Sew Le Sew',
      html: `
        <h2 style="color: #e74c3c;">Sew Le Sew</h2>
        <p>Hello ${firstName},</p>
        <p>You have been matched with a ${donationType} donation!</p>
        <p><strong>Recipient:</strong> ${recipientName}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
        <a href="${config.frontendUrl}/dashboard">View Details</a>
      `
    });
    console.log(`✅ Match email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Resend error:`, error.message);
    return false;
  }
};