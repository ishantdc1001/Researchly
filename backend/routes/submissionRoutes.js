const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Submission = require('../models/Submission');
const Conference = require('../models/Conference');

/**
 * @route   GET /api/submissions
 * @desc    Get user's submission pipeline cards populated with conference info
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const submissions = await Submission.find({ user_id: req.user._id })
      .populate('conference_id')
      .sort({ target_date: 1, created_at: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   POST /api/submissions
 * @desc    Add a conference to the Kanban pipeline
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { conference_id, paper_title, abstract, status = 'Shortlisted', target_date, notes } = req.body;

    if (!conference_id) {
      return res.status(400).json({ success: false, error: 'conference_id is required' });
    }

    const conf = await Conference.findById(conference_id);
    if (!conf) {
      return res.status(404).json({ success: false, error: 'Conference not found' });
    }

    // Default target_date to first upcoming deadline if not provided
    let calculatedTargetDate = target_date;
    if (!calculatedTargetDate && conf.deadlines && conf.deadlines.length > 0) {
      calculatedTargetDate = conf.deadlines[0].date;
    }

    const submission = await Submission.create({
      user_id: req.user._id,
      conference_id,
      paper_title: paper_title || `Paper for ${conf.acronym}`,
      abstract: abstract || '',
      status,
      target_date: calculatedTargetDate,
      notes: notes || ''
    });

    const populated = await Submission.findById(submission._id).populate('conference_id');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   PATCH /api/submissions/:id
 * @desc    Update submission pipeline stage (Kanban drag-and-drop) or paper details
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status, paper_title, abstract, target_date, notes } = req.body;

    const updates = {};
    if (status && ['Shortlisted', 'Preparing', 'Submitted', 'Accepted'].includes(status)) {
      updates.status = status;
    }
    if (paper_title !== undefined) updates.paper_title = paper_title;
    if (abstract !== undefined) updates.abstract = abstract;
    if (target_date !== undefined) updates.target_date = target_date;
    if (notes !== undefined) updates.notes = notes;

    const submission = await Submission.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { $set: updates },
      { new: true }
    ).populate('conference_id');

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission item not found' });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   DELETE /api/submissions/:id
 * @desc    Remove an item from Kanban pipeline
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const result = await Submission.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    res.json({
      success: true,
      message: 'Submission item removed from pipeline'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
