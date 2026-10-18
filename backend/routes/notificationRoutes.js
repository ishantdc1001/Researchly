const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const { sendDigestEmail } = require('../services/emailService');
const { compileUserDigestData, runDigestForFrequency } = require('../services/schedulerService');

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user's notification preferences and last dispatch date
 */
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        notification_preference: req.user.notification_preference,
        email: req.user.email,
        last_notified_at: req.user.last_notified_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/notifications/preferences
 * @desc    Update notification preference ('daily', 'weekly', 'monthly', 'off')
 */
router.post('/preferences', requireAuth, async (req, res) => {
  try {
    const { notification_preference } = req.body;
    if (!['daily', 'weekly', 'monthly', 'off'].includes(notification_preference)) {
      return res.status(400).json({ success: false, error: 'Invalid preference. Must be daily, weekly, monthly, or off.' });
    }

    req.user.notification_preference = notification_preference;
    await req.user.save();

    res.json({
      success: true,
      message: `Notification frequency updated to: ${notification_preference}`,
      notification_preference: req.user.notification_preference
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/notifications/test-digest
 * @desc    Dispatches a real-time test digest email to the current user
 */
router.post('/test-digest', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const pref = user.notification_preference === 'off' ? 'weekly' : user.notification_preference;
    const daysThreshold = pref === 'daily' ? 7 : pref === 'weekly' ? 14 : 30;

    const { matches, upcomingSubmissions } = await compileUserDigestData(user, daysThreshold);

    const emailResult = await sendDigestEmail({
      user,
      matches,
      upcomingSubmissions
    });

    if (emailResult.success) {
      user.last_notified_at = new Date();
      await user.save();

      res.json({
        success: true,
        message: `Digest dispatched successfully to ${user.email}`,
        previewUrl: emailResult.previewUrl,
        matchesIncluded: matches.length,
        deadlinesIncluded: upcomingSubmissions.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Email delivery failed: ${emailResult.error}`
      });
    }
  } catch (err) {
    console.error('Test digest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
