const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
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
  service: {
    name: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // In minutes
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    buffer: {
      type: Number,
      default: 0
    }
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'confirmed' // Standard appointments default to confirmed
  },
  tip: {
    type: Number,
    default: 0
  },
  notesFromBarber: {
    type: String
  },
  haircutImages: [{
    type: String
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String
  }
}, {
  timestamps: true
});

// Index to optimize chronological lookup of a customer's history
AppointmentSchema.index({ customerId: 1, startTime: -1 });

// Compound index to speed up slot search and overlap checks
AppointmentSchema.index({ barberId: 1, startTime: 1, endTime: 1 });

// Unique index to prevent duplicate confirmed bookings on database level
AppointmentSchema.index(
  { barberId: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

module.exports = mongoose.model('Appointment', AppointmentSchema);
