const supabase = require('../config/supabase');
const User = require('../models/User');

/**
 * Authentication middleware verifying Supabase JWT or handling demo sessions
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token missing or malformed. Format: Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];

    let supabaseUid = null;
    let email = null;
    let name = null;

    // Check if token is a demo/dev token
    if (token.startsWith('demo-token-')) {
      const parts = token.replace('demo-token-', '').split('-');
      email = parts[0] ? decodeURIComponent(parts[0]) : 'faculty@stanford.edu';
      supabaseUid = `demo-${email.replace(/[@.]/g, '_')}`;
      name = 'Dr. Elena Rostova';
    } else {
      // Real Supabase verification
      if (supabase && supabase.auth) {
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (error || !data || !data.user) {
            // Attempt fallback decoding or error
            console.warn('Supabase token verification failed or expired:', error?.message);
            return res.status(401).json({
              success: false,
              error: 'Invalid or expired session token.'
            });
          }
          supabaseUid = data.user.id;
          email = data.user.email;
          name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0];
        } catch (supaErr) {
          console.error('Supabase auth check error:', supaErr);
          return res.status(401).json({ success: false, error: 'Authentication service error.' });
        }
      } else {
        // Fallback for offline testing
        supabaseUid = 'default-user-uid';
        email = 'faculty@university.edu';
        name = 'Prof. Academic';
      }
    }

    // Sync or retrieve user from MongoDB
    let user = await User.findOne({
      $or: [{ supabase_uid: supabaseUid }, { email }]
    });

    if (!user) {
      user = await User.create({
        supabase_uid: supabaseUid,
        email: email || 'faculty@university.edu',
        name: name || 'Academic Researcher',
        institution: 'Institute of AI & Computing',
        notification_preference: 'weekly',
        agent_prompt: 'Find credible IEEE, ACM, and Springer conferences in Machine Learning, NLP, and Robotics with deadlines in the next 6 months.'
      });
      console.log(`Created new MongoDB User record for: ${user.email}`);
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('requireAuth Middleware Error:', err);
    return res.status(500).json({ success: false, error: 'Internal authentication error.' });
  }
};

/**
 * Middleware to protect scraper ingestion endpoints via API key
 */
const requireIngestionApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const configuredKey = process.env.INGESTION_API_KEY || 'researchly-scraper-auth-secret-key-9988';

  if (!apiKey || apiKey !== configuredKey) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Valid x-api-key required for conference ingestion.'
    });
  }
  next();
};

module.exports = {
  requireAuth,
  requireIngestionApiKey
};
