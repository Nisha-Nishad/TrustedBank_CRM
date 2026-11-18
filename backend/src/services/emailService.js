const nodemailer = require('nodemailer');

function createTransporter() {
  // 1. Direct Gmail Configuration (easiest for personal/work Gmail)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });
  }

  // 2. Enterprise SMTP Configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development fallback transporter (logs to console/test)
  return null;
}

async function sendPasswordResetEmail(toEmail, userName, resetUrl, resetToken) {
  const subject = 'TrustBank CRM — Secure Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; rounded: 12px; background-color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #1E3A8A; color: white; width: 48px; height: 48px; line-height: 48px; border-radius: 8px; font-size: 24px; font-weight: bold;">🏛️</div>
        <h2 style="color: #0F172A; margin-top: 12px; margin-bottom: 4px;">TrustBank Portal</h2>
        <p style="color: #64748B; font-size: 13px; margin: 0;">Bank-Grade Relationship Management Platform</p>
      </div>

      <div style="padding: 20px; background-color: #F8FAFC; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="color: #0F172A; font-size: 16px; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Hello <strong>${userName}</strong>,
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          A password reset was requested for your official CRM account (<strong>${toEmail}</strong>).
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Click the secure button below to choose a new password. This link is valid for <strong>1 hour</strong>.
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #1E3A8A; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Reset My Password
          </a>
        </div>

        <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin-top: 20px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          Or copy and paste this link in your browser:<br>
          <a href="${resetUrl}" style="color: #1E3A8A; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>

      <div style="text-align: center; font-size: 11px; color: #94A3B8;">
        If you did not request a password reset, please contact your System Administrator immediately.<br>
        &copy; ${new Date().getFullYear()} TrustBank Systems &bull; Confidential & Secure
      </div>
    </div>
  `;

  const transporter = createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"TrustBank Security" <no-reply@trustbank.in>',
        to: toEmail,
        subject,
        html,
      });
      console.log(`[Email] Password reset email sent via SMTP to ${toEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId, mode: 'smtp' };
    } catch (err) {
      console.error('[Email Error] Failed to send via SMTP:', err.message);
    }
  }

  // Development log simulation
  console.log(`\n======================================================`);
  console.log(`📧 [MOCK EMAIL DISPATCHED] to: ${toEmail}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Reset URL: ${resetUrl}`);
  console.log(`   Token: ${resetToken}`);
  console.log(`======================================================\n`);

  return { success: true, mode: 'simulated', resetUrl, resetToken };
}

module.exports = {
  sendPasswordResetEmail,
};
