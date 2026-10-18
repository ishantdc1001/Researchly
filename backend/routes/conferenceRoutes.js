const express = require('express');
const router = express.Router();
const Conference = require('../models/Conference');
const { requireIngestionApiKey } = require('../middleware/auth');
const credibilityMiddleware = require('../middleware/credibilityEngine');
const { evaluateCredibility } = require('../services/credibilityService');

/**
 * @route   GET /api/conferences
 * @desc    Get conferences with search, filtering, and sorting
 */
router.get('/', async (req, res) => {
  try {
    const {
      search,
      publisher,
      minTrustScore,
      topic,
      flag,
      upcomingOnly,
      sort = 'trust_score',
      order = 'desc',
      limit = 50,
      page = 1
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { acronym: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } }
      ];
    }

    if (publisher) {
      filter.publisher = { $regex: publisher, $options: 'i' };
    }

    if (minTrustScore) {
      filter.trust_score = { $gte: Number(minTrustScore) };
    }

    if (topic) {
      filter.topics = { $in: [new RegExp(topic, 'i')] };
    }

    if (flag) {
      filter.flags = { $in: [flag] };
    }

    if (upcomingOnly === 'true') {
      filter['deadlines.date'] = { $gte: new Date() };
    }

    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [conferences, total] = await Promise.all([
      Conference.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Conference.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: conferences,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching conferences:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/conferences/stats/summary
 * @desc    Get dashboard metrics regarding credibility and catalog volume
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Conference.countDocuments();
    const verifiedTier1 = await Conference.countDocuments({ trust_score: { $gte: 80 } });
    const flaggedPredatory = await Conference.countDocuments({ flags: 'SUSPECTED_PREDATORY_ORGANIZER' });
    const avgScoreAgg = await Conference.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$trust_score' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalConferences: total,
        verifiedTier1,
        flaggedPredatory,
        averageTrustScore: avgScoreAgg[0] ? Math.round(avgScoreAgg[0].avgScore) : 75
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/conferences/:id
 * @desc    Get a single conference by ID with full evidence log
 */
router.get('/:id', async (req, res) => {
  try {
    const conference = await Conference.findById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, error: 'Conference not found' });
    }
    res.json({ success: true, data: conference });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/conferences/ingest
 * @desc    Ingest external CFP data with automatic Credibility Engine evaluation
 * @access  Protected via x-api-key
 */
router.post('/ingest', requireIngestionApiKey, credibilityMiddleware, async (req, res) => {
  try {
    const payload = req.body;
    let created;

    if (Array.isArray(payload)) {
      created = await Conference.insertMany(payload);
    } else {
      created = await Conference.create(payload);
    }

    res.status(201).json({
      success: true,
      message: `Successfully ingested and scored ${Array.isArray(created) ? created.length : 1} conference(s).`,
      data: created
    });
  } catch (err) {
    console.error('Ingestion error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/conferences/evaluate-preview
 * @desc    Preview credibility scoring for draft conference payload without saving
 */
router.post('/evaluate-preview', (req, res) => {
  try {
    const evaluation = evaluateCredibility(req.body);
    res.json({
      success: true,
      evaluation
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
