const Appointment = require('../models/Appointment');
const BarberSchedule = require('../models/BarberSchedule');
const User = require('../models/User');
const { sendBookingConfirmation } = require('../utils/email');
const mongoose = require('mongoose');

// Helper to check if two intervals overlap
const isOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

// Dynamic pricing calculation helper (Surge vs Off-Peak)
const calculateDynamicPrice = (basePrice, dateObj) => {
  const day = dateObj.getUTCDay(); // UTC day: 0 = Sun, 6 = Sat
  const hours = dateObj.getUTCHours(); // UTC hours
  
  let price = basePrice;
  let rule = '';
  
  // +15% Surge pricing on Sat/Sun between 10:00 and 14:00 UTC
  if ((day === 6 || day === 0) && hours >= 10 && hours < 14) {
    price = Math.round(basePrice * 1.15);
    rule = 'surge';
  } 
  // -10% Off-Peak discount on Tuesdays and Wednesdays
  else if (day === 2 || day === 3) {
    price = Math.round(basePrice * 0.90);
    rule = 'discount';
  }
  
  return { price, rule };
};

// GET: Generate available slots for a barber on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { barberId, date, serviceName } = req.query; // date format: 'YYYY-MM-DD'
    if (!barberId || !date) {
      return res.status(400).json({ message: 'Barber ID and Date are required' });
    }

    const barber = await User.findById(barberId);
    if (!barber || barber.role !== 'barber') {
      return res.status(404).json({ message: 'Barber not found' });
    }

    // Find service duration & price
    let duration = 30; // default to 30 mins
    let basePrice = 0;
    if (serviceName) {
      const service = barber.barberProfile.services.find(s => s.name === serviceName);
      if (service) {
        duration = service.duration;
        basePrice = service.price;
      }
    }

    // Parse target date (local date components)
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get Barber Schedule
    const schedule = await BarberSchedule.findOne({ barberId });
    if (!schedule) {
      return res.json([]); // No schedule set up
    }

    // Find the schedule configuration for this day of the week
    const dayConfig = schedule.weeklyHours.find(wh => wh.dayOfWeek === dayOfWeek);
    if (!dayConfig || !dayConfig.isOpen || !dayConfig.workingHours.length) {
      return res.json([]); // Shop is closed or no hours defined
    }

    // Fetch existing active appointments for this barber on this day
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const appointments = await Appointment.find({
      barberId,
      status: { $in: ['confirmed', 'pending', 'completed'] },
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    // Generate candidates slots based on working hours
    const availableSlots = [];

    // Filter blocked time spans for this day
    const blockedTimes = schedule.blockedTime.filter(block => {
      return block.start <= endOfDay && block.end >= startOfDay;
    });

    // Process each working hours interval (e.g. 09:00 - 13:00, 14:00 - 17:00)
    for (const interval of dayConfig.workingHours) {
      const [startH, startM] = interval.start.split(':').map(Number);
      const [endH, endM] = interval.end.split(':').map(Number);

      let currentSlotStart = new Date(Date.UTC(year, month - 1, day, startH, startM, 0, 0));
      const workEnd = new Date(Date.UTC(year, month - 1, day, endH, endM, 0, 0));

      // Standard slots increments (e.g., 30 minutes, or 15 minutes to allow denseness)
      const slotStepMinutes = 15; // Generate slot starts every 15 minutes

      while (new Date(currentSlotStart.getTime() + duration * 60 * 1000) <= workEnd) {
        const slotEnd = new Date(currentSlotStart.getTime() + duration * 60 * 1000);
        
        // Ensure the slot does not start in the past if checking today
        const now = new Date();
        if (currentSlotStart > now) {
          let hasOverlap = false;

          // Check against active appointments (incorporate service dynamic buffer)
          for (const app of appointments) {
            const appEndTimeWithBuffer = new Date(app.endTime.getTime() + (app.service.buffer || 0) * 60 * 1000);
            if (isOverlapping(currentSlotStart, slotEnd, app.startTime, appEndTimeWithBuffer)) {
              hasOverlap = true;
              break;
            }
          }

          // Check against blocked time intervals
          if (!hasOverlap) {
            for (const block of blockedTimes) {
              if (block.isWholeDay) {
                hasOverlap = true;
                break;
              }
              if (isOverlapping(currentSlotStart, slotEnd, block.start, block.end)) {
                hasOverlap = true;
                break;
              }
            }
          }

          if (!hasOverlap) {
            const { price: dynamicPrice, rule: priceRule } = calculateDynamicPrice(basePrice, currentSlotStart);
            availableSlots.push({
              startTime: currentSlotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              timeLabel: currentSlotStart.getUTCHours().toString().padStart(2, '0') + ':' + 
                         currentSlotStart.getUTCMinutes().toString().padStart(2, '0'),
              price: dynamicPrice,
              priceRule: priceRule
            });
          }
        }

        // Advance to next candidate start
        currentSlotStart = new Date(currentSlotStart.getTime() + slotStepMinutes * 60 * 1000);
      }
    }

    res.json(availableSlots);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving availability', error: err.message });
  }
};

const locks = new Map();

// POST: Create an appointment (Atomic Overlap Check + OCC)
exports.createAppointment = async (req, res) => {
  const { barberId, serviceName, startTime, tip } = req.body;
  const customerId = req.user.role === 'admin' && req.body.customerId ? req.body.customerId : req.user.id;

  if (!barberId || !serviceName || !startTime) {
    return res.status(400).json({ message: 'Barber, Service Name, and Start Time are required' });
  }

  // Application-level Mutex check
  const lockKey = `${barberId}_${startTime}`;
  if (locks.get(lockKey)) {
    return res.status(409).json({ message: 'This slot was secured by another client.' });
  }
  locks.set(lockKey, true);

  try {
    // Verify barber and service duration
    const barber = await User.findById(barberId);
    if (!barber || barber.role !== 'barber') {
      locks.delete(lockKey);
      return res.status(404).json({ message: 'Barber not found' });
    }

    const service = barber.barberProfile.services.find(s => s.name === serviceName);
    if (!service) {
      locks.delete(lockKey);
      return res.status(400).json({ message: 'Service not offered by this barber' });
    }

    // Calculate start & end times
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60 * 1000);

    // Calculate Dynamic Surge/Discount Price
    const { price: priceToCharge } = calculateDynamicPrice(service.price, start);

    // 1. ATOMIC OVERLAP CHECK IN APPOINTMENTS WITH SERVICE BUFFER RESPECTED
    const checkOverlap = await Appointment.findOne({
      barberId,
      status: { $in: ['confirmed', 'pending', 'completed'] },
      $expr: {
        $and: [
          { $lt: ["$startTime", end] },
          { $gt: [{ $add: ["$endTime", { $multiply: [{ $ifNull: ["$service.buffer", 0] }, 60, 1000] }] }, start] }
        ]
      }
    });

    if (checkOverlap) {
      locks.delete(lockKey);
      return res.status(409).json({ message: 'This slot was secured by another client.' });
    }

    // 2. CHECK BLOCKED TIMES IN SCHEDULE
    const schedule = await BarberSchedule.findOne({
      barberId,
      blockedTime: {
        $elemMatch: {
          start: { $lt: end },
          end: { $gt: start }
        }
      }
    });

    if (schedule) {
      locks.delete(lockKey);
      return res.status(409).json({ message: 'The barber is unavailable/blocked during this slot.' });
    }

    // 3. CREATE APPOINTMENT
    const appointment = new Appointment({
      customerId,
      barberId,
      service: {
        name: service.name,
        duration: service.duration,
        price: priceToCharge,
        buffer: service.buffer || 0
      },
      startTime: start,
      endTime: end,
      status: 'confirmed',
      tip: tip || 0
    });

    await appointment.save();

    // Send email confirmation asynchronously
    try {
      const customer = await User.findById(customerId);
      if (customer) {
        sendBookingConfirmation(appointment, customer, barber).catch(err => {
          console.error('Email dispatcher failed:', err);
        });
      }
    } catch (emailErr) {
      console.error('Error finding customer for email dispatch:', emailErr);
    }

    // Broadcast update via WebSocket
    const io = req.app.get('io');
    if (io) {
      // Broadcast specific booked slot
      io.emit('slotBooked', {
        barberId,
        date: start.toISOString().split('T')[0],
        startTime: start.toISOString()
      });
      // Broadcast queue updates to barbers/admins
      io.emit('queueUpdated', { barberId });
    }

    res.status(201).json(appointment);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This slot was secured by another client.' });
    }
    res.status(500).json({ message: 'Error processing appointment booking', error: err.message });
  } finally {
    locks.delete(lockKey);
  }
};

// GET: Retrieve customer's appointments (Customer personal list)
exports.getMyAppointments = async (req, res) => {
  try {
    const customerId = req.user.id;
    const appointments = await Appointment.find({ customerId })
      .populate('barberId', 'name phone email')
      .sort({ startTime: -1 });
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving appointments', error: err.message });
  }
};

// GET: Retrieve barber's schedule/queue (Barber schedule list)
exports.getBarberQueue = async (req, res) => {
  try {
    const barberId = req.user.role === 'admin' && req.query.barberId ? req.query.barberId : req.user.id;
    
    // Sort appointments: upcoming and completed
    const appointments = await Appointment.find({ barberId })
      .populate('customerId', 'name phone email')
      .sort({ startTime: 1 });
      
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving queue list', error: err.message });
  }
};

// GET: Retrieve admin master calendar
exports.getShopAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('customerId', 'name phone email')
      .populate('barberId', 'name phone email')
      .sort({ startTime: -1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving master calendar', error: err.message });
  }
};

// PUT: Cancel appointment (Customer validation: must be > 2 hours)
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Role-based validation
    if (req.user.role === 'customer') {
      // Validate customer owns appointment
      if (appointment.customerId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You do not own this appointment' });
      }

      // Check 2-hour cancellation buffer
      const now = new Date();
      const startTime = new Date(appointment.startTime);
      const diffHours = (startTime - now) / (1000 * 60 * 60);

      if (diffHours < 2) {
        return res.status(400).json({
          message: 'Appointments can only be cancelled up to 2 hours before the service schedule.'
        });
      }
    } else if (req.user.role === 'barber') {
      // Validate barber owns appointment
      if (appointment.barberId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: This appointment is not assigned to you' });
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Trigger Waitlist notification
    try {
      const Waitlist = require('../models/Waitlist');
      const dateString = appointment.startTime.toISOString().split('T')[0];
      const waitlists = await Waitlist.find({
        barberId: appointment.barberId,
        date: dateString,
        status: 'active'
      }).populate('customerId', 'name email');
      
      if (waitlists.length > 0) {
        console.log(`[WAITLIST NOTIFICATION] Slot opened on ${dateString} at ${appointment.startTime.toISOString()}. Notifying ${waitlists.length} customers.`);
        await Waitlist.updateMany(
          { _id: { $in: waitlists.map(w => w._id) } },
          { status: 'notified' }
        );
      }
    } catch (waitErr) {
      console.error('Waitlist trigger error:', waitErr);
    }

    // Broadcast cancellation
    const io = req.app.get('io');
    if (io) {
      io.emit('slotCancelled', {
        barberId: appointment.barberId,
        date: appointment.startTime.toISOString().split('T')[0],
        startTime: appointment.startTime.toISOString()
      });
      io.emit('queueUpdated', { barberId: appointment.barberId });
    }

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling appointment', error: err.message });
  }
};

// PUT: Update status of booking (completed, no-show)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tip } = req.body;

    if (!['completed', 'no-show', 'confirmed', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update option' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Enforce Barber or Admin ownership checks
    if (req.user.role === 'barber' && appointment.barberId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You cannot edit this appointment' });
    }

    appointment.status = status;
    if (tip !== undefined) {
      appointment.tip = tip;
    }
    
    await appointment.save();

    // Broadcast update
    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated', { barberId: appointment.barberId });
    }

    res.json({ message: `Appointment status updated to ${status}`, appointment });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};

// GET: Get schedule configuration
exports.getBarberSchedule = async (req, res) => {
  try {
    const barberId = req.user.role === 'admin' && req.query.barberId ? req.query.barberId : req.user.id;
    const schedule = await BarberSchedule.findOne({ barberId });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule configuration not found' });
    }
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving schedule configuration', error: err.message });
  }
};

// PUT: Edit weekly hours or add blocked times
exports.updateBarberSchedule = async (req, res) => {
  try {
    const barberId = req.user.role === 'admin' && req.body.barberId ? req.body.barberId : req.user.id;
    const { weeklyHours, blockedTime } = req.body;

    const schedule = await BarberSchedule.findOne({ barberId });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule configuration not found' });
    }

    if (weeklyHours) schedule.weeklyHours = weeklyHours;
    if (blockedTime) schedule.blockedTime = blockedTime;

    await schedule.save();

    // Broadcast schedule update so clients refresh slot calendars
    const io = req.app.get('io');
    if (io) {
      io.emit('scheduleUpdated', { barberId });
    }

    res.json({ message: 'Schedule updated successfully', schedule });
  } catch (err) {
    res.status(500).json({ message: 'Error updating schedule', error: err.message });
  }
};

// GET: Retrieve customer dashboard stats and timeline
exports.getCustomerDashboardData = async (req, res) => {
  const customerId = req.user.id;

  try {
    const dashboardData = await Appointment.aggregate([
      // 1. Match all completed appointments for this specific customer
      { 
        $match: { 
          customerId: new mongoose.Types.ObjectId(customerId), 
          status: 'completed' 
        } 
      },
      
      // 2. Sort by newest first to establish the history timeline
      { $sort: { startTime: -1 } },
      
      // 3. Lookup Barber details (name, avatar) from the users collection
      {
        $lookup: {
          from: 'users',
          localField: 'barberId',
          foreignField: '_id',
          as: 'barberInfo'
        }
      },
      { $unwind: '$barberInfo' },
      
      // 4. Project/Format the exact data structure the frontend needs
      {
        $project: {
          _id: 1,
          date: '$startTime',
          serviceName: '$service.name',
          price: '$service.price',
          duration: '$service.duration',
          barberId: '$barberInfo._id',
          barberName: '$barberInfo.name',
          barberAvatar: '$barberInfo.barberProfile.image',
          notes: '$notesFromBarber',
          images: '$haircutImages'
        }
      }
    ]);

    // Calculate regular cut: most frequented combination of barberId & serviceName
    let regularCut = null;
    if (dashboardData.length > 0) {
      const frequencies = {};
      let maxCount = 0;
      let maxKey = '';
      
      dashboardData.forEach(item => {
        const key = `${item.barberId}_${item.serviceName}`;
        frequencies[key] = (frequencies[key] || 0) + 1;
        if (frequencies[key] > maxCount) {
          maxCount = frequencies[key];
          maxKey = key;
        }
      });
      
      if (maxKey) {
        const matchingItem = dashboardData.find(item => `${item.barberId}_${item.serviceName}` === maxKey);
        if (matchingItem) {
          regularCut = {
            barberId: matchingItem.barberId,
            barberName: matchingItem.barberName,
            barberAvatar: matchingItem.barberAvatar,
            serviceName: matchingItem.serviceName,
            price: matchingItem.price,
            duration: matchingItem.duration || 30
          };
        }
      }
    }

    res.status(200).json({
      success: true,
      count: dashboardData.length,
      history: dashboardData,
      regularCut: regularCut
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST: Join waitlist for a fully booked date
exports.joinWaitlist = async (req, res) => {
  const Waitlist = require('../models/Waitlist');
  try {
    const { barberId, date, preferredTimes } = req.body;
    const customerId = req.user.id;

    if (!barberId || !date) {
      return res.status(400).json({ message: 'Barber ID and Date are required to join waitlist' });
    }

    const waitlistEntry = new Waitlist({
      customerId,
      barberId,
      date,
      preferredTimes: preferredTimes || [],
      status: 'active'
    });

    await waitlistEntry.save();
    res.status(201).json({ message: 'Successfully joined the waitlist!', waitlistEntry });
  } catch (err) {
    res.status(500).json({ message: 'Error joining waitlist', error: err.message });
  }
};

// POST: Submit a rating & review for completed appointments
exports.submitReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const customerId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Star rating (1 to 5) is required' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment reservation not found' });
    }

    if (appointment.customerId.toString() !== customerId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this appointment' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed appointments can be reviewed' });
    }

    appointment.rating = rating;
    appointment.review = review || '';
    await appointment.save();

    res.json({ message: 'Review submitted successfully. Thank you!', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Error saving feedback review', error: err.message });
  }
};
