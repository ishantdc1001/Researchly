const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initializes or retrieves the Nodemailer transporter.
 * If credentials are not set or default, generates an Ethereal test account.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const isConfigured =
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    !process.env.EMAIL_PASS.includes('secret_password');

  if (isConfigured) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Custom SMTP transporter initialized.');
  } else {
    // Generate an automatic Ethereal test account for instant testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`📧 Ethereal Test Email Account created: ${testAccount.user}`);
    } catch (err) {
      console.warn('⚠️ Could not create Ethereal account, falling back to mock transport:', err.message);
      transporter = {
        sendMail: async (opts) => {
          console.log(`[MOCK EMAIL DISPATCHED] To: ${opts.to} | Subject: ${opts.subject}`);
          return { messageId: `mock-${Date.now()}` };
        }
      };
    }
  }

  return transporter;
};

/**
 * Generates an ultra-clean, modern, responsive HTML digest email template
 */
const generateDigestHtml = ({ userName, frequency, matches = [], upcomingSubmissions = [] }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const matchesHtml = matches.length > 0
    ? matches.map(m => {
        const conf = m.conference_id || {};
        const scoreColor = conf.trust_score >= 80 ? '#10B981' : conf.trust_score >= 50 ? '#F59E0B' : '#EF4444';
        return `
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <span style="font-size: 12px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.05em; background: #e0e7ff; padding: 3px 8px; border-radius: 6px;">${conf.acronym || 'CONF'}</span>
                <h3 style="margin: 6px 0 2px 0; color: #0f172a; font-size: 18px; font-weight: 700;">${conf.name || 'Academic Conference'}</h3>
                <p style="margin: 0; color: #64748b; font-size: 13px;">Organized by: <strong style="color: #334155;">${conf.publisher || 'Verified Publisher'}</strong> &bull; Location: ${conf.location?.city || 'Virtual'}, ${conf.location?.country || ''}</p>
              </div>
              <div style="text-align: right; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 8px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase;">Trust Score</div>
                <div style="font-size: 18px; font-weight: 800; color: ${scoreColor};">${conf.trust_score || 50}<span style="font-size: 12px; font-weight: 500; color: #94a3b8;">/100</span></div>
              </div>
            </div>
            
            <div style="background-color: #f1f5f9; border-left: 4px solid #6366f1; padding: 12px 14px; border-radius: 4px; margin: 12px 0;">
              <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.5;">
                <strong style="color: #4338ca;">🤖 Agent Recommendation:</strong> ${m.match_reasoning || 'Matches your research domain and publication criteria.'}
              </p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; pt-2; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">
              <span>Fees: <strong style="color: #0f172a;">${conf.fees?.is_free ? 'Free' : `$${conf.fees?.amount || 0} ${conf.fees?.currency || 'USD'}`}</strong></span>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/inbox" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 12px;">View in Inbox &rarr;</a>
            </div>
          </div>
        `;
      }).join('')
    : `<div style="text-align: center; padding: 30px; background-color: #f8fafc; border-radius: 8px; color: #64748b;">No new unread agent matches since your last digest. Your autonomous agent is continuously monitoring new CFP feeds.</div>`;

  const submissionsHtml = upcomingSubmissions.length > 0
    ? upcomingSubmissions.map(sub => {
        const conf = sub.conference_id || {};
        const daysLeft = Math.ceil((new Date(sub.target_date) - new Date()) / (1000 * 60 * 60 * 24));
        const badgeColor = daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : '#3b82f6';
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
            <div>
              <strong style="color: #0f172a; font-size: 14px;">${sub.paper_title || conf.name}</strong>
              <div style="color: #64748b; font-size: 12px;">Pipeline Stage: <span style="font-weight: 600; color: #4338ca;">${sub.status}</span> &bull; Target: ${new Date(sub.target_date).toLocaleDateString()}</div>
            </div>
            <span style="background-color: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
              ${daysLeft <= 0 ? 'Due Today' : `${daysLeft} Days Left`}
            </span>
          </div>
        `;
      }).join('')
    : `<div style="padding: 16px; background-color: #f8fafc; border-radius: 8px; color: #64748b; font-size: 13px;">No critical deadlines within this digest window.</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Researchly.io Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 16px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); border-radius: 16px; padding: 32px 24px; color: #ffffff; text-align: left; box-shadow: 0 10px 25px -5px rgba(67, 56, 202, 0.3);">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="background: #ffffff; color: #312e81; font-weight: 900; font-size: 16px; padding: 4px 10px; border-radius: 8px; margin-right: 10px;">R</span>
        <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">Researchly<span style="color: #a5b4fc;">.io</span></span>
      </div>
      <h1 style="margin: 8px 0; font-size: 24px; font-weight: 800; color: #ffffff;">Your ${frequency.toUpperCase()} Research Intelligence Brief</h1>
      <p style="margin: 0; font-size: 13px; color: #c7d2fe;">Prepared for ${userName} &bull; ${currentDate}</p>
    </div>

    <!-- Quick Stats Bar -->
    <div style="display: flex; justify-content: space-around; background: #ffffff; border-radius: 12px; padding: 16px; margin: -16px 12px 24px 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center;">
      <div>
        <div style="font-size: 22px; font-weight: 800; color: #4338ca;">${matches.length}</div>
        <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">New Matches</div>
      </div>
      <div style="border-left: 1px solid #e2e8f0;"></div>
      <div>
        <div style="font-size: 22px; font-weight: 800; color: #0284c7;">${upcomingSubmissions.length}</div>
        <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Upcoming Deadlines</div>
      </div>
    </div>

    <!-- Approaching Deadlines Section -->
    <div style="margin-bottom: 28px;">
      <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center;">
        <span style="margin-right: 8px;">⏳</span> Approaching Submission Deadlines
      </h2>
      ${submissionsHtml}
    </div>

    <!-- Autonomous Agent Matches Section -->
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center;">
        <span style="margin-right: 8px;">🎯</span> Tailored Conference Opportunities
      </h2>
      ${matchesHtml}
    </div>

    <!-- Call to action button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
        Open Researchly Workspace &rarr;
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
      <p style="margin: 0;">You are receiving this digest based on your <strong>${frequency}</strong> notification preference on Researchly.io.</p>
      <p style="margin: 6px 0 0 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/settings" style="color: #6366f1; text-decoration: underline;">Update Notification Frequency</a> &bull;
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/settings" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a>
      </p>
      <p style="margin: 12px 0 0 0; color: #cbd5e1;">&copy; 2026 Researchly.io Academic Intelligence Systems.</p>
    </div>

  </div>
</body>
</html>
  `;
};

/**
 * Dispatches an email digest to a specific user
 */
const sendDigestEmail = async ({ user, matches = [], upcomingSubmissions = [] }) => {
  try {
    const mailer = await getTransporter();

    const subject = `[Researchly ${user.notification_preference.toUpperCase()}] ${matches.length} New Matches & ${upcomingSubmissions.length} Deadlines`;
    const html = generateDigestHtml({
      userName: user.name,
      frequency: user.notification_preference,
      matches,
      upcomingSubmissions
    });

    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"Researchly AI" <digest@researchly.io>',
      to: user.email,
      subject,
      html
    });

    console.log(`📨 Digest sent to ${user.email} (Message ID: ${info.messageId})`);
    
    // If using ethereal test account, log preview url
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null
    };
  } catch (error) {
    console.error(`❌ Failed to send email to ${user.email}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  getTransporter,
  sendDigestEmail,
  generateDigestHtml
};
