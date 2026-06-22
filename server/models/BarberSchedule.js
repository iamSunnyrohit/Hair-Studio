const mongoose = require('mongoose');

const WorkingHourSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true,
    match: /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/ // "HH:MM" validation
  },
  end: {
    type: String,
    required: true,
    match: /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/ // "HH:MM" validation
  }
}, { _id: false });

const WeeklyHourSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    min: 0, // 0 = Sunday
    max: 6,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  workingHours: [WorkingHourSchema]
}, { _id: false });

const BlockedTimeSchema = new mongoose.Schema({
  reason: {
    type: String,
    default: 'Personal Break'
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  isWholeDay: {
    type: Boolean,
    default: false
  }
});

const BarberScheduleSchema = new mongoose.Schema({
  barberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  weeklyHours: [WeeklyHourSchema],
  blockedTime: [BlockedTimeSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('BarberSchedule', BarberScheduleSchema);
