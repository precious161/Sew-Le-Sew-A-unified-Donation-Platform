import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

// DEBUG: Log email configuration on startup
console.log('📧 EMAIL SERVICE DEBUG:');
console.log('  - EMAIL_USER:', config.emailUser ? '✅ Set to: ' + config.emailUser : '❌ MISSING');
console.log('  - EMAIL_PASS:', config.emailPass ? '✅ Set (length: ' + config.emailPass.length + ' chars)' : '❌ MISSING');
console.log('  - EMAIL_HOST:', config.emailHost);
console.log('  - EMAIL_PORT:', config.emailPort);

if (config.emailUser && config.emailPass) {
  transporter = nodemailer.createTransport({
    host: config.emailHost || 'smtp.gmail.com',
    port: config.emailPort || 587,
    secure: false,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
    // ✅ FORCE IPv4 - This fixes the connection timeout
    family: 4,
    connectionTimeout: 80000,
    greetingTimeout: 80000,
    socketTimeout: 80000,
  });
  console.log('✅ Email service configured - Transporter created (IPv4 forced)');
  logger.info(" Email service configured");
} else {
  console.log('❌ Email NOT configured - missing credentials');
  logger.warn(" Email not configured - reset links will only appear in console");
}

// ============================================
// 1. PASSWORD RESET EMAIL
// ============================================
export const sendPasswordResetEmail = async (email, firstName, token) => {
  console.log(`📧 Sending password reset email to: ${email}`);
  console.log(`  - Transporter exists: ${!!transporter}`);

  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  console.log(`  - Reset URL: ${resetUrl}`);

  if (!transporter) {
    console.log(`❌ Email not sent to ${email} - no transporter`);
    logger.warn(` Email not sent to ${email} - no email configuration`);
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Reset Your Password</title></head>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #e74c3c;">Sew Le Sew</h2>
      <p>Hello ${firstName},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <a href="${resetUrl}" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="background: #f4f4f4; padding: 10px; word-break: break-all;">${resetUrl}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <hr>
      <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
      <p style="font-size: 12px; color: #666;">&copy; 2026 Sew Le Sew - Ethiopia's Unified Donation Platform</p>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.emailFrom || '"Sew Le Sew" <noreply@sewlesew.com>',
      to: email,
      subject: "Reset Your Password - Sew Le Sew",
      html: html,
    });
    console.log(`✅ Password reset email sent successfully to ${email}`);
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to send email to ${email}:`, error.message);
    logger.error(` Failed to send email to ${email}:`, error.message);
    return false;
  }
};

// ============================================
// 2. VERIFICATION STATUS EMAIL
// ============================================
export const sendVerificationStatusEmail = async (email, firstName, data) => {
  console.log(`📧 Sending verification status email to: ${email}`);

  if (!transporter) {
    console.log(`❌ Verification email not sent - no transporter`);
    return false;
  }

  const { type, status, category, reason, itemType } = data;
  const isApproved = status === 'approved';
  const isIntent = type === 'intent';
  const actionText = isIntent ? 'Intent' : 'Request';

  const subject = isApproved
    ? `Your ${category} Donation ${actionText} Has Been Approved`
    : `Your ${category} Donation ${actionText} Requires Attention`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>${subject}</title></head>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #e74c3c;">Sew Le Sew</h2>
      <p>Hello ${firstName},</p>
      ${isApproved ? `
        <p>Great news! Your ${category} donation ${isIntent ? 'intent' : 'request'} has been <strong>approved</strong> by the Red Cross medical team.</p>
        ${itemType ? `<p><strong>Item:</strong> ${itemType}</p>` : ''}
        <p>You will be notified when a match is found. Thank you for your willingness to help save lives!</p>
      ` : `
        <p>We regret to inform you that your ${category} donation ${isIntent ? 'intent' : 'request'} could not be approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have questions or believe this decision was made in error, please contact the Red Cross support team.</p>
      `}
      <a href="${config.frontendUrl}/dashboard" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
      <hr>
      <p style="font-size: 12px; color: #666;">&copy; 2026 Sew Le Sew</p>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.emailFrom,
      to: email,
      subject,
      html,
    });
    console.log(`✅ Verification status email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, error.message);
    return false;
  }
};

// ============================================
// 3. MATCH NOTIFICATION EMAIL
// ============================================
export const sendMatchNotificationEmail = async (email, firstName, matchData) => {
  console.log(`📧 Sending match notification email to: ${email}`);

  if (!transporter) {
    console.log(`❌ Match email not sent - no transporter`);
    return false;
  }

  const { donationType, recipientName, location, date } = matchData;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>You've Been Matched!</title></head>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #e74c3c;">Sew Le Sew</h2>
      <p>Hello ${firstName},</p>
      <p>You have been matched with a ${donationType} donation request!</p>
      <p><strong>Recipient:</strong> ${recipientName}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
      <a href="${config.frontendUrl}/dashboard" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>
      <hr>
      <p style="font-size: 12px; color: #666;">&copy; 2026 Sew Le Sew</p>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: config.emailFrom,
      to: email,
      subject: "🎉 You've Been Matched! - Sew Le Sew",
      html,
    });
    console.log(`✅ Match notification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send match email to ${email}:`, error.message);
    return false;
  }
};