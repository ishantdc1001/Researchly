const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

/**
 * @route   POST /api/auth/sync
 * @desc    Sync authenticated Supabase user with MongoDB
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { name, institution } = req.body;
    if (name) req.user.name = name;
    if (institution) req.user.institution = institution;
    await req.user.save();

    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 */
router.get('/me', requireAuth, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * @route   PUT /api/auth/preferences
 * @desc    Update user profile & research agent prompt
 */
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const { name, institution, notification_preference, agent_prompt } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (institution) user.institution = institution;
    if (notification_preference && ['daily', 'weekly', 'monthly', 'off'].includes(notification_preference)) {
      user.notification_preference = notification_preference;
    }
    if (agent_prompt !== undefined) {
      user.agent_prompt = agent_prompt;
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
