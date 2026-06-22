const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
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
    lowercase: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'barber', 'admin'],
    default: 'customer'
  },
  // Sub-document containing barber profile information (only relevant for 'barber' role)
  barberProfile: {
    bio: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: '' // Can store a local placeholder or generated asset path
    },
    services: [{
      name: { type: String, required: true },
      duration: { type: Number, required: true }, // in minutes
      price: { type: Number, required: true },
      buffer: { type: Number, default: 0 }
    }]
  }
}, {
  timestamps: true
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Hook to hash password before saving (if modified)
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Single-field index on email is enforced by unique: true. We'll explicitly create it.
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
