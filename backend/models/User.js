const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    supabase_uid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    institution: {
      type: String,
      default: 'Independent Academic / Faculty'
    },
    notification_preference: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'off'],
      default: 'weekly'
    },
    agent_prompt: {
      type: String,
      default: 'Find credible IEEE, ACM, or Springer conferences in Artificial Intelligence and Natural Language Processing with deadlines in the next 6 months, physical or hybrid attendance, and low fees.'
    },
    last_notified_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

module.exports = mongoose.model('User', UserSchema);
