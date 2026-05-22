const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// ─── Welcome Email ─────────────────────────────────────────
const sendWelcomeEmail = async (toEmail, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Welcome to CivicPulse! 🏙️',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Welcome, ${userName}! 🎉</h2>
          <p style="color:#64748b;">Thank you for joining CivicPulse — India's crowdsourced civic issue platform.</p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
            <h3 style="color:#1e293b;margin-top:0;">What you can do:</h3>
            <ul style="color:#64748b;font-size:15px;line-height:2;">
              <li>📍 Report civic issues near you</li>
              <li>🗺️ View issues on a live map</li>
              <li>👍 Upvote important issues</li>
              <li>🔔 Get real-time status updates</li>
            </ul>
          </div>
          <p style="color:#64748b;">Together, let's make our cities better!</p>
        </div>
      </div>
    `
  }
  await transporter.sendMail(mailOptions)
}

// ─── Status Update Email ───────────────────────────────────
const sendStatusUpdateEmail = async (toEmail, userName, issueTitle, newStatus) => {
  const statusLabels = {
    under_review: 'Under Review',
    assigned: 'Assigned to Officer',
    in_progress: 'In Progress',
    resolved: 'Resolved ✅'
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Your Issue Status Updated — ${issueTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Hello ${userName}! 👋</h2>
          <p style="color:#64748b;">Your reported issue has been updated.</p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">ISSUE</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:bold;">${issueTitle}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">NEW STATUS</p>
            <span style="background:#dcfce7;color:#166534;padding:6px 14px;border-radius:99px;font-weight:bold;">
              ${statusLabels[newStatus] || newStatus}
            </span>
          </div>
          <p style="color:#64748b;">Login to CivicPulse to track your issue progress in real-time.</p>
        </div>
      </div>
    `
  }
  await transporter.sendMail(mailOptions)
}

// ─── Password Reset Email ──────────────────────────────────
const sendPasswordResetEmail = async (toEmail, userName, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Password Reset Request — CivicPulse',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Password Reset Request 🔐</h2>
          <p style="color:#64748b;">Hello ${userName}, we received a request to reset your password.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}"
               style="background:#1d4ed8;color:white;padding:14px 32px;border-radius:8px;
                      text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="color:#64748b;font-size:14px;">
            This link expires in <strong>1 hour</strong>.
            If you did not request this, ignore this email.
          </p>
        </div>
      </div>
    `
  }
  await transporter.sendMail(mailOptions)
}

module.exports = {
  sendWelcomeEmail,
  sendStatusUpdateEmail,
  sendPasswordResetEmail
}