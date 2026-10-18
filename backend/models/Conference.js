const mongoose = require('mongoose');

const DeadlineSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      default: 'Abstract Submission'
    },
    date: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

const EvidenceLogSchema = new mongoose.Schema(
  {
    rule: { type: String, required: true },
    passed: { type: Boolean, required: true },
    scoreImpact: { type: Number, default: 0 },
    message: { type: String, required: true }
  },
  { _id: false }
);

const ConferenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Conference name is required'],
      trim: true,
      index: true
    },
    acronym: {
      type: String,
      required: [true, 'Conference acronym is required'],
      uppercase: true,
      trim: true
    },
    publisher: {
      type: String,
      required: [true, 'Publisher or organizing body is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    website_url: {
      type: String,
      default: ''
    },
    location: {
      city: { type: String, default: 'Virtual' },
      country: { type: String, default: 'Online' },
      is_hybrid: { type: Boolean, default: false }
    },
    deadlines: {
      type: [DeadlineSchema],
      default: []
    },
    fees: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      is_free: { type: Boolean, default: false }
    },
    topics: {
      type: [String],
      default: []
    },
    contact_email: {
      type: String,
      default: ''
    },
    trust_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      index: true
    },
    flags: {
      type: [String],
      default: []
    },
    evidence_log: {
      type: [EvidenceLogSchema],
      default: []
    },
    verified_indexing: {
      scopus: { type: Boolean, default: false },
      wos: { type: Boolean, default: false },
      ieee_xplore: { type: Boolean, default: false },
      acm_dl: { type: Boolean, default: false }
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

ConferenceSchema.index({ name: 'text', acronym: 'text', description: 'text', publisher: 'text' });

module.exports = mongoose.model('Conference', ConferenceSchema);
