import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

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

  logger.info(" Email service configured");
} else {
  logger.warn(" Email not configured - reset links will only appear in console");
}

export const sendPasswordResetEmail = async (email, firstName, token) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  if (process.env.NODE_ENV !== 'production') {
    logger.info(` PASSWORD RESET LINK FOR ${email}: ${resetUrl}`);
  }

  if (!transporter) {
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
        .link {
          background: #f5f5f5;
          padding: 10px;
          word-break: break-all;
          font-size: 12px;
          border-radius: 5px;
        }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 30px; }
        hr { margin: 20px 0; border: none; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sew Le Sew</h1>
          <p style="color: white; margin: 5px 0 0;">Unified Donation Platform</p>
        </div>
        <div class="content">
          <h2>Hello ${firstName},</h2>
          <p>We received a request to reset your password for your Sew Le Sew account.</p>
          <p>Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <div class="link">${resetUrl}</div>
          <p><strong> This link will expire in 1 hour.</strong></p>
          <hr />
          <p style="color: #666; font-size: 12px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
          <p style="color: #666; font-size: 12px;">For security reasons, never share this link with anyone.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Sew Le Sew - Ethiopia's Unified Donation Platform</p>
          <p>Connecting donors with those in need</p>
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
    © 2026 Sew Le Sew - Ethiopia's Unified Donation Platform
  `;

  try {
    const info = await transporter.sendMail({
      from: config.emailFrom || '"Sew Le Sew" <noreply@sewlesew.com>',
      to: email,
      subject: "Reset Your Password - Sew Le Sew",
      html: html,
      text: text,
    });

    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(` Failed to send email to ${email}:`, error.message);
    return false;
  }
};