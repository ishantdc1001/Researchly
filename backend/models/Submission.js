const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    conference_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conference',
      required: true
    },
    paper_title: {
      type: String,
      default: 'Untitled Research Draft',
      trim: true
    },
    abstract: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Shortlisted', 'Preparing', 'Submitted', 'Accepted'],
      default: 'Shortlisted',
      index: true
    },
    target_date: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

module.exports = mongoose.model('Submission', SubmissionSchema);
