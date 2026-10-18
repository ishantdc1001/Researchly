const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Conference = require('../models/Conference');
const AgentMatch = require('../models/AgentMatch');

/**
 * Fallback semantic & heuristic evaluator if Python microservice is offline
 */
const runInternalAgentEvaluation = async (userPrompt, conferences) => {
  const promptLower = (userPrompt || '').toLowerCase();
  const keywords = promptLower.split(/\W+/).filter(w => w.length > 2);

  const scored = conferences.map(conf => {
    let score = 50;
    const desc = (conf.description || '').toLowerCase();
    const name = (conf.name || '').toLowerCase();
    const publisher = (conf.publisher || '').toLowerCase();
    const city = (conf.location?.city || '').toLowerCase();
    const country = (conf.location?.country || '').toLowerCase();
    const topics = (conf.topics || []).map(t => t.toLowerCase());

    // Check keyword hits
    let matchedKeywords = [];
    keywords.forEach(kw => {
      if (desc.includes(kw) || name.includes(kw) || publisher.includes(kw) || topics.some(t => t.includes(kw))) {
        score += 8;
        matchedKeywords.push(kw);
      }
    });

    // Check constraints in prompt
    let reasons = [];
    if (promptLower.includes('ieee') && publisher.includes('ieee')) {
      score += 15;
      reasons.push('Directly matches requested IEEE publisher requirement.');
    }
    if (promptLower.includes('acm') && publisher.includes('acm')) {
      score += 15;
      reasons.push('Meets requested ACM publishing society criteria.');
    }
    if (promptLower.includes('low fee') || promptLower.includes('affordable')) {
      if (conf.fees?.is_free || (conf.fees?.amount && conf.fees?.amount <= 400)) {
        score += 10;
        reasons.push(`Budget-friendly registration (${conf.fees.is_free ? 'Free' : '$' + conf.fees.amount}).`);
      }
    }
    if (promptLower.includes('europe') && ['germany', 'france', 'spain', 'italy', 'uk', 'netherlands', 'switzerland', 'austria'].some(c => country.includes(c))) {
      score += 12;
      reasons.push(`Physical venue in Europe (${conf.location.city}, ${conf.location.country}).`);
    }
    if (promptLower.includes('asia') && ['japan', 'singapore', 'korea', 'china', 'india', 'taiwan'].some(c => country.includes(c))) {
      score += 12;
      reasons.push(`Physical venue in Asia (${conf.location.city}, ${conf.location.country}).`);
    }

    // Trust penalty
    if (conf.trust_score < 60) {
      score -= 30;
    } else if (conf.trust_score >= 85) {
      score += 15;
      reasons.push(`High institutional trust score of ${conf.trust_score}/100.`);
    }

    const finalScore = Math.max(10, Math.min(99, score));
    const explanation = reasons.length > 0
      ? `Selected by Research Assistant: ${reasons.join(' ')} Alignment detected for domain topics [${matchedKeywords.slice(0, 4).join(', ')}].`
      : `Selected based on topical keyword overlap with your research profile and high credibility metrics (${conf.trust_score}/100).`;

    return {
      conference_id: conf._id,
      match_score: finalScore,
      match_reasoning: explanation,
      criteria_alignment: {
        topic_relevance: matchedKeywords.length > 2 ? 'Very High' : 'Moderate',
        reputation_rating: conf.trust_score >= 80 ? 'Tier-1 Verified' : 'Standard',
        location_fit: `${conf.location?.city || 'Virtual'}, ${conf.location?.country || ''}`,
        deadline_urgency: conf.deadlines?.length ? 'Active Deadlines' : 'Open'
      }
    };
  });

  // Filter top matches
  return scored.filter(s => s.match_score >= 65).sort((a, b) => b.match_score - a.match_score);
};

/**
 * @route   POST /api/agent/configure
 * @desc    Save user's agent persona and natural language criteria
 */
router.post('/configure', requireAuth, async (req, res) => {
  try {
    const { agent_prompt } = req.body;
    if (!agent_prompt) {
      return res.status(400).json({ success: false, error: 'agent_prompt is required' });
    }

    req.user.agent_prompt = agent_prompt;
    await req.user.save();

    res.json({
      success: true,
      message: 'Agent research persona updated successfully',
      agent_prompt: req.user.agent_prompt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/agent/trigger
 * @desc    Trigger autonomous agent scan to evaluate catalog against user's prompt
 */
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const prompt = user.agent_prompt || 'Find high-impact peer-reviewed computer science conferences';

    // Get conferences from database
    const conferences = await Conference.find().lean();
    if (!conferences || conferences.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No conferences in database to evaluate yet.',
        matchesCount: 0,
        matches: []
      });
    }

    let evaluatedMatches = [];
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // 1. Attempt to delegate to Python microservice
    try {
      console.log(`🤖 Invoking Python Agentic Microservice at ${aiServiceUrl}/evaluate-agent...`);
      const response = await axios.post(
        `${aiServiceUrl}/evaluate-agent`,
        {
          user_id: user._id.toString(),
          agent_prompt: prompt,
          conferences: conferences.map(c => ({
            id: c._id.toString(),
            name: c.name,
            acronym: c.acronym,
            publisher: c.publisher,
            description: c.description,
            trust_score: c.trust_score,
            location: c.location,
            fees: c.fees,
            topics: c.topics,
            deadlines: c.deadlines
          }))
        },
        { timeout: 7000 }
      );

      if (response.data && response.data.matches) {
        evaluatedMatches = response.data.matches.map(m => ({
          conference_id: m.conference_id || m.id,
          match_score: m.match_score || 85,
          match_reasoning: m.match_reasoning || m.reasoning,
          criteria_alignment: m.criteria_alignment || {
            topic_relevance: 'High',
            reputation_rating: 'Verified',
            location_fit: 'Optimal',
            deadline_urgency: 'Active'
          }
        }));
        console.log(`✅ Python microservice returned ${evaluatedMatches.length} autonomous matches.`);
      }
    } catch (aiErr) {
      console.warn(`ℹ️ Python AI Microservice not reachable (${aiErr.message}). Using native semantic agent fallback.`);
      evaluatedMatches = await runInternalAgentEvaluation(prompt, conferences);
    }

    // 2. Persist matches into MongoDB AgentMatches collection
    let insertedOrUpdated = [];
    for (const item of evaluatedMatches) {
      const match = await AgentMatch.findOneAndUpdate(
        { user_id: user._id, conference_id: item.conference_id },
        {
          user_id: user._id,
          conference_id: item.conference_id,
          match_score: item.match_score,
          match_reasoning: item.match_reasoning,
          criteria_alignment: item.criteria_alignment,
          $setOnInsert: { status: 'unread' }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).populate('conference_id');

      insertedOrUpdated.push(match);
    }

    res.json({
      success: true,
      message: `Agent evaluation complete. ${insertedOrUpdated.length} conference matches identified.`,
      matchesCount: insertedOrUpdated.length,
      matches: insertedOrUpdated
    });
  } catch (err) {
    console.error('Agent trigger error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/agent/matches
 * @desc    Get user's AgentMatches with optional status filter
 */
router.get('/matches', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user_id: req.user._id };

    if (status && ['unread', 'saved', 'dismissed'].includes(status)) {
      filter.status = status;
    }

    const matches = await AgentMatch.find(filter)
      .populate('conference_id')
      .sort({ match_score: -1, created_at: -1 });

    res.json({
      success: true,
      data: matches
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   PATCH /api/agent/matches/:id
 * @desc    Update status of an AgentMatch (e.g., mark as saved or dismissed)
 */
router.patch('/matches/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['unread', 'saved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const match = await AgentMatch.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { status },
      { new: true }
    ).populate('conference_id');

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
