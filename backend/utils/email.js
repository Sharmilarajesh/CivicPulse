
const nodemailer = require('nodemailer')
require('dotenv').config()

let transporter;

// Always use Gmail SMTP (from .env) to attempt real delivery to Mailinator/etc.
transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})
console.log('Gmail SMTP configured! Attempting real email delivery.')

const sendEmail = async (mailOptions) => {
  try {
    // Wait for transporter to initialize if it hasn't yet
    if (!transporter) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email successfully sent to:', mailOptions.to)
    console.log('---------------------------------\n')
    
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error('❌ Email failed:', err.message)
    return { success: false, error: err.message }
  }
}

//  Welcome Email 
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
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Welcome email:', error.message)
  }
}

//  Status Update Email 
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
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Status Update email:', error.message)
  }
}

//  Password Reset Email ─
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
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Password Reset email:', error.message)
  }
}

//  Invite Email 
const sendInviteEmail = async (toEmail, userName, role, inviteToken, invitedByName) => {
  const acceptUrl = `${process.env.CLIENT_URL}/accept-invite?token=${inviteToken}`
  const roleLabel = role === 'admin' ? 'Admin' : 'Area Officer'
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `You've been invited to CivicPulse as ${roleLabel}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Hello ${userName}! 👋</h2>
          <p style="color:#64748b;">${invitedByName} has invited you to join CivicPulse as <strong>${roleLabel}</strong>.</p>
          <p style="color:#64748b;margin-bottom:8px;"><strong>Role:</strong> ${roleLabel}</p>
          <p style="color:#64748b;margin-top:0;"><strong>Email:</strong> ${toEmail}</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${acceptUrl}"
               style="background:#1d4ed8;color:white;padding:14px 32px;border-radius:8px;
                      text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              Accept Invitation →
            </a>
          </div>
          <p style="color:#dc2626;font-size:14px;font-weight:bold;">
            ⚠️ This link expires in 72 hours.
          </p>
          <p style="color:#64748b;font-size:14px;">
            If you didn't expect this, ignore this email.
          </p>
        </div>
      </div>
    `
  }
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Invite email:', error.message)
  }
}

//  Issue Reported Citizen Confirmation Email ─
const sendIssueReportedCitizenEmail = async (toEmail, userName, issueTitle, category) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Issue Reported Successfully — ${issueTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Hello ${userName}! 👋</h2>
          <p style="color:#64748b;">We have received your civic issue report. Thank you for helping keep our area clean and safe!</p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">ISSUE TITLE</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:bold;">${issueTitle}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">CATEGORY</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:16px;font-weight:bold;text-transform:capitalize;">${category}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">STATUS</p>
            <span style="background:#fef3c7;color:#92400e;padding:6px 14px;border-radius:99px;font-weight:bold;font-size:14px;">
              Reported
            </span>
          </div>
          <p style="color:#64748b;">Our administration team will review this issue and assign it to an officer shortly. You will receive email notifications as the status changes.</p>
        </div>
      </div>
    `
  }
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Issue Reported Citizen email:', error.message)
  }
}

//  Issue Reported Admin Notification Email 
const sendIssueReportedAdminEmail = async (toEmail, adminName, issueTitle, category, locationStr) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `New Issue Reported — Action Required: ${issueTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Hello Admin ${adminName}, 📋</h2>
          <p style="color:#64748b;">A new civic issue has been reported in your district/area that requires review and assignment.</p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">ISSUE TITLE</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:bold;">${issueTitle}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">CATEGORY</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:16px;font-weight:bold;text-transform:capitalize;">${category}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">LOCATION / ADDRESS</p>
            <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.5;">${locationStr}</p>
          </div>
          <p style="color:#64748b;">Please login to the Admin Dashboard to review details and assign an appropriate Area Officer.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin"
               style="background:#1d4ed8;color:white;padding:14px 32px;border-radius:8px;
                      text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              Go to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  }
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Issue Reported Admin email:', error.message)
  }
}

//  Issue Assigned Officer Notification Email ─
const sendIssueAssignedOfficerEmail = async (toEmail, officerName, issueTitle, category, locationStr) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `New Issue Assigned — Action Required: ${issueTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Hello Officer ${officerName}, 🛠️</h2>
          <p style="color:#64748b;">An administrator has assigned a new issue to you for resolution.</p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">ISSUE TITLE</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:bold;">${issueTitle}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">CATEGORY</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:16px;font-weight:bold;text-transform:capitalize;">${category}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">LOCATION / ADDRESS</p>
            <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.5;">${locationStr}</p>
          </div>
          <p style="color:#64748b;">Please login to the Officer Dashboard to view more details, take action, and post updates once resolved.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/officer"
               style="background:#1d4ed8;color:white;padding:14px 32px;border-radius:8px;
                      text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              Go to Officer Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  }
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Issue Assigned Officer email:', error.message)
  }
}

//  Status Update Admin Email 
const sendStatusUpdateAdminEmail = async (toEmail, adminName, issueTitle, newStatus, district) => {
  const statusLabels = {
    under_review: 'Under Review',
    assigned: 'Assigned to Officer',
    in_progress: 'In Progress',
    resolved: 'Resolved ✅'
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Issue Status Update — ${issueTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Hello Admin ${adminName}, 👋</h2>
          <p style="color:#64748b;">An issue status has been updated in the system.</p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">ISSUE</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:bold;">${issueTitle}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">DISTRICT</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:16px;font-weight:bold;">${district || 'N/A'}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">NEW STATUS</p>
            <span style="background:#dcfce7;color:#166534;padding:6px 14px;border-radius:99px;font-weight:bold;">
              ${statusLabels[newStatus] || newStatus}
            </span>
          </div>
          <p style="color:#64748b;">Login to the Admin Dashboard to see the latest updates.</p>
        </div>
      </div>
    `
  }
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Admin Status Update email:', error.message)
  }
}

//  Issue Assigned Admin Email ─
const sendIssueAssignedAdminEmail = async (toEmail, adminName, issueTitle, officerName, district) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Issue Assigned to Officer — ${issueTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d4ed8;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;">🏙️ CivicPulse</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Hello Admin ${adminName}, 👤</h2>
          <p style="color:#64748b;">An issue has been assigned to an Area Officer.</p>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">ISSUE</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:bold;">${issueTitle}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">DISTRICT</p>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:16px;font-weight:bold;">${district || 'N/A'}</p>
            <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;">ASSIGNED OFFICER</p>
            <p style="margin:0;color:#1e293b;font-size:16px;font-weight:bold;">${officerName}</p>
          </div>
          <p style="color:#64748b;">Login to the Admin Dashboard to view more details.</p>
        </div>
      </div>
    `
  }
  try {
    await sendEmail(mailOptions)
  } catch (error) {
    console.error('Failed to send Issue Assigned Admin email:', error.message)
  }
}

module.exports = {
  sendWelcomeEmail,
  sendStatusUpdateEmail,
  sendPasswordResetEmail,
  sendInviteEmail,
  sendIssueReportedCitizenEmail,
  sendIssueReportedAdminEmail,
  sendIssueAssignedOfficerEmail,
  sendStatusUpdateAdminEmail,
  sendIssueAssignedAdminEmail
}