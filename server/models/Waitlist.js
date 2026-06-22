const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  preferredTimes: [{
    type: String // e.g. ["10:30", "14:00"]
  }],
  status: {
    type: String,
    enum: ['active', 'notified', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index to optimize lookup of active waitlists for a barber and date
WaitlistSchema.index({ barberId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Waitlist', WaitlistSchema);
