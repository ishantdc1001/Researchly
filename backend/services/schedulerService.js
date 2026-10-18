const cron = require('node-cron');
const User = require('../models/User');
const AgentMatch = require('../models/AgentMatch');
const Submission = require('../models/Submission');
const { sendDigestEmail } = require('./emailService');

/**
 * Compiles unread AgentMatches and approaching Submissions for a user
 * based on days threshold (<7 days for daily, <14 days for weekly, <30 days for monthly)
 */
const compileUserDigestData = async (user, daysThreshold) => {
  // Fetch unread agent matches
  const unreadMatches = await AgentMatch.find({
    user_id: user._id,
    status: 'unread'
  })
    .populate('conference_id')
    .sort({ match_score: -1 })
    .limit(5);

  // Fetch approaching deadlines from user submissions
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(now.getDate() + daysThreshold);

  const upcomingSubmissions = await Submission.find({
    user_id: user._id,
    status: { $ne: 'Accepted' },
    target_date: { $gte: now, $lte: thresholdDate }
  })
    .populate('conference_id')
    .sort({ target_date: 1 });

  return {
    matches: unreadMatches,
    upcomingSubmissions
  };
};

/**
 * Executes a digest run for all users matching a specified preference
 */
const runDigestForFrequency = async (frequency, daysThreshold) => {
  console.log(`⏱️ Starting ${frequency.toUpperCase()} Email Digest Run (Deadline window: <${daysThreshold} days)...`);
  try {
    const users = await User.find({ notification_preference: frequency });
    console.log(`Found ${users.length} user(s) subscribed to ${frequency} digests.`);

    let sentCount = 0;
    for (const user of users) {
      const { matches, upcomingSubmissions } = await compileUserDigestData(user, daysThreshold);

      // Send even if zero matches to reassure user their agent is active, or if there are matches/deadlines
      const result = await sendDigestEmail({
        user,
        matches,
        upcomingSubmissions
      });

      if (result.success) {
        sentCount++;
        user.last_notified_at = new Date();
        await user.save();
      }
    }

    console.log(`✅ ${frequency.toUpperCase()} Digest Run completed: ${sentCount}/${users.length} sent.`);
    return { success: true, count: sentCount, total: users.length };
  } catch (err) {
    console.error(`❌ Error running ${frequency} digest:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Initializes node-cron schedules
 */
const initCronJobs = () => {
  console.log('⏰ Initializing Researchly background notification scheduler...');

  // 1. Daily Digest: Runs every day at 8:00 AM ('0 8 * * *')
  // For local demonstration, it is registered and ready
  cron.schedule('0 8 * * *', () => {
    runDigestForFrequency('daily', 7);
  });

  // 2. Weekly Digest: Runs every Monday at 8:00 AM ('0 8 * * 1')
  cron.schedule('0 8 * * 1', () => {
    runDigestForFrequency('weekly', 14);
  });

  // 3. Monthly Digest: Runs 1st of every month at 8:00 AM ('0 8 1 * *')
  cron.schedule('0 8 1 * *', () => {
    runDigestForFrequency('monthly', 30);
  });

  console.log('✅ Cron schedules registered: Daily (08:00), Weekly (Mon 08:00), Monthly (1st 08:00).');
};

module.exports = {
  initCronJobs,
  runDigestForFrequency,
  compileUserDigestData
};
