const User = require('../models/User');
const BarberSchedule = require('../models/BarberSchedule');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_barber_booking_token_key_12345',
    { expiresIn: '30d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password inside the save pre-hook, we assign passwordHash
    const user = new User({
      name,
      email,
      passwordHash: password,
      phone,
      role: role || 'customer'
    });

    // If registering as barber, initialize profile and standard working hours
    if (role === 'barber') {
      user.barberProfile = {
        bio: req.body.bio || 'Professional barber ready to give you a fresh cut.',
        image: req.body.image || '',
        services: req.body.services || [
          { name: 'Classic Haircut', duration: 30, price: 600 },
          { name: 'Beard Trim', duration: 15, price: 300 }
        ]
      };
    }

    await user.save();

    // Initialize BarberSchedule document for a barber
    if (user.role === 'barber') {
      const defaultWeeklyHours = [];
      // Sunday (0) to Saturday (6)
      for (let i = 0; i <= 6; i++) {
        const isOpen = i !== 0 && i !== 1; // Open Tuesday through Saturday
        defaultWeeklyHours.push({
          dayOfWeek: i,
          isOpen,
          workingHours: isOpen ? [{ start: '09:00', end: '17:00' }] : []
        });
      }

      await BarberSchedule.create({
        barberId: user._id,
        weeklyHours: defaultWeeklyHours,
        blockedTime: []
      });
    }

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        barberProfile: user.barberProfile
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        barberProfile: user.barberProfile
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving profile', error: err.message });
  }
};
