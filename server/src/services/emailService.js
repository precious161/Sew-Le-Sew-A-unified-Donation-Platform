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
console.log('  - EMAIL_FROM:', config.emailFrom);

if (config.emailUser && config.emailPass) {
  transporter = nodemailer.createTransport({
    host: config.emailHost || 'smtp.gmail.com',
    port: config.emailPort || 587,
    secure: false,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
  });
  console.log('✅ Email service configured - Transporter created');
  logger.info(" Email service configured");
} else {
  console.log('❌ Email NOT configured - missing credentials');
  logger.warn(" Email not configured - reset links will only appear in console");
}

export const sendPasswordResetEmail = async (email, firstName, token) => {
  console.log(`📧 Sending password reset email to: ${email}`);
  console.log(`  - Transporter exists: ${!!transporter}`);

  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  console.log(`  - Reset URL: ${resetUrl}`);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 PASSWORD RESET LINK FOR ${email}: ${resetUrl}`);
    logger.info(` PASSWORD RESET LINK FOR ${email}: ${resetUrl}`);
  }

  if (!transporter) {
    console.log(`❌ Email not sent to ${email} - no transporter (missing credentials)`);
    logger.warn(` Email not sent to ${email} - no email configuration`);
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #e74c3c; padding: 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; border: 1px solid #ddd; border-top: none; }
        .button {
          background: #e74c3c;
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
          margin: 20px 0;
        }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; }
        hr { margin: 20px 0; border: none; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sew Le Sew</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName},</h2>
          <p>We received a request to reset your password.</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link:</p>
          <div style="background: #f5f5f5; padding: 10px; word-break: break-all; border-radius: 5px;">${resetUrl}</div>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <hr />
          <p style="color: #666; font-size: 12px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Sew Le Sew - Ethiopia's Unified Donation Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Sew Le Sew - Password Reset
    Hello ${firstName},
    We received a request to reset your password.
    Click or copy this link to reset your password:
    ${resetUrl}
    This link will expire in 1 hour.
    If you did not request this, please ignore this email.
  `;

  try {
    const info = await transporter.sendMail({
      from: config.emailFrom || '"Sew Le Sew" <noreply@sewlesew.com>',
      to: email,
      subject: "Reset Your Password - Sew Le Sew",
      html: html,
      text: text,
    });
    console.log(`✅ Password reset email sent successfully to ${email}`);
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to send email to ${email}:`, error.message);
    console.log(`   Error details:`, error);
    logger.error(` Failed to send email to ${email}:`, error.message);
    return false;
  }
};

export const sendVerificationStatusEmail = async (email, firstName, data) => {
  const { type, status, category, reason, itemType } = data;
  const isApproved = status === 'approved';
  const isIntent = type === 'intent';
  const subject = isApproved
    ? `Your ${category} Donation ${isIntent ? 'Intent' : 'Request'} Has Been Approved`
    : `Your ${category} Donation ${isIntent ? 'Intent' : 'Request'} Requires Attention`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: ${isApproved ? '#22C55E' : '#EF4444'}; padding: 20px; text-align: center; }
        .content { padding: 30px; border: 1px solid #ddd; border-top: none; }
        .button {
          background: #e74c3c;
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
          margin: 20px 0;
        }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Sew Le Sew</h1></div>
        <div class="content">
          <h2>Hello ${firstName},</h2>
          ${isApproved ? `
            <p>Great news! Your ${category} donation ${isIntent ? 'intent' : 'request'} has been <strong>approved</strong> by the Red Cross medical team.</p>
            ${itemType ? `<p><strong>Item:</strong> ${itemType}</p>` : ''}
            <p>You will be notified when a match is found. Thank you for your willingness to help save lives!</p>
          ` : `
            <p>We regret to inform you that your ${category} donation ${isIntent ? 'intent' : 'request'} could not be approved at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>If you have questions, please contact the Red Cross support team.</p>
          `}
          <div style="text-align: center;">
            <a href="${config.frontendUrl}/dashboard" class="button">Go to Dashboard</a>
          </div>
          <hr />
          <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
        <div class="footer"><p>&copy; 2026 Sew Le Sew - Ethiopia's Unified Donation Platform</p></div>
      </div>
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
    logger.info(`Verification status email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error.message);
    return false;
  }
};

export const sendMatchNotificationEmail = async (email, firstName, matchData) => {
  const { donationType, recipientName, location, date } = matchData;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>You've Been Matched!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #e74c3c; padding: 20px; text-align: center; }
        .content { padding: 30px; border: 1px solid #ddd; border-top: none; }
        .button {
          background: #e74c3c;
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
          margin: 20px 0;
        }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Sew Le Sew</h1></div>
        <div class="content">
          <h2>Hello ${firstName},</h2>
          <p>You have been matched with a ${donationType} donation request!</p>
          <p><strong>Recipient:</strong> ${recipientName}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
          <div style="text-align: center;">
            <a href="${config.frontendUrl}/dashboard" class="button">View Details</a>
          </div>
        </div>
        <div class="footer"><p>&copy; 2026 Sew Le Sew</p></div>
      </div>
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
    return true;
  } catch (error) {
    logger.error(`Failed to send match email to ${email}:`, error.message);
    return false;
  }
};