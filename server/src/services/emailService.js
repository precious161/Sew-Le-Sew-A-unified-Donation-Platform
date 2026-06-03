import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

console.log(' EMAIL SERVICE DEBUG:');
console.log('  - EMAIL_USER:', config.emailUser ? ' Set to: ' + config.emailUser : '❌ MISSING');
console.log('  - EMAIL_PASS:', config.emailPass ? 'Set (length: ' + config.emailPass.length + ' chars)' : '❌ MISSING');
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
    family: 4,  //  FORCE IPv4 - THIS FIXES THE CONNECTION ISSUE
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });
  console.log('Email service configured - Transporter created (IPv4 forced)');
  logger.info(" Email service configured");
} else {
  console.log(' Email NOT configured - missing credentials');
  logger.warn(" Email not configured - reset links will only appear in console");
}

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
    <head><meta charset="UTF-8"><title>Reset Password</title></head>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #e74c3c;">Sew Le Sew</h2>
      <p>Hello ${firstName},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
      <hr>
      <p style="font-size: 12px; color: #666;">&copy; 2026 Sew Le Sew</p>
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
    console.log(` Password reset email sent successfully to ${email}`);
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.log(` Failed to send email to ${email}:`, error.message);
    logger.error(` Failed to send email to ${email}:`, error.message);
    return false;
  }
};