const mongoose = require('mongoose');
const User = require('../models/User');
const BarberSchedule = require('../models/BarberSchedule');
const Appointment = require('../models/Appointment');

const seedData = async () => {
  try {
    console.log('Seeding database with fresh mock datasets...');
    
    // Clear collections
    await User.deleteMany({});
    await BarberSchedule.deleteMany({});
    await Appointment.deleteMany({});
    console.log('Cleared existing database entries.');

    // 1. Create Users (Customers, Barbers, Admin)
    const admin = new User({
      name: 'Marcus Vance',
      email: 'marcus@barber.com',
      passwordHash: 'password123',
      phone: '555-0100',
      role: 'admin'
    });
    await admin.save();

    const customerSarah = new User({
      name: 'Sarah Connor',
      email: 'sarah@customer.com',
      passwordHash: 'password123',
      phone: '555-0500',
      role: 'customer'
    });
    await customerSarah.save();

    const customerJohn = new User({
      name: 'John Doe',
      email: 'john@customer.com',
      passwordHash: 'password123',
      phone: '555-0600',
      role: 'customer'
    });
    await customerJohn.save();

    // Barbers
    const alex = new User({
      name: 'Alex Sterling',
      email: 'alex@barber.com',
      passwordHash: 'password123',
      phone: '555-0200',
      role: 'barber',
      barberProfile: {
        bio: 'Specialist in razor fades and modern executive styling. 10 years of experience.',
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        services: [
          { name: 'Classic Haircut', duration: 30, price: 600 },
          { name: 'Hot Towel Shave', duration: 30, price: 800 },
          { name: 'Beard Trim & Styling', duration: 15, price: 400 }
        ]
      }
    });
    await alex.save();

    const sofia = new User({
      name: 'Sofia Mendoza',
      email: 'sofia@barber.com',
      passwordHash: 'password123',
      phone: '555-0300',
      role: 'barber',
      barberProfile: {
        bio: 'Master of texture, beard sculpting, and customized scissor cuts. Creative Director.',
        image: 'https://images.unsplash.com/photo-1605497746444-ac9da5848ba7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        services: [
          { name: 'Classic Haircut', duration: 30, price: 700 },
          { name: 'Scissor Sculpt & Style', duration: 45, price: 1000 },
          { name: 'Beard Sculpting', duration: 30, price: 500 }
        ]
      }
    });
    await sofia.save();

    const jordan = new User({
      name: 'Jordan Vance',
      email: 'jordan@barber.com',
      passwordHash: 'password123',
      phone: '555-0400',
      role: 'barber',
      barberProfile: {
        bio: 'Specialist in buzz cuts, kid trims, and vibrant hair styling. High energy.',
        image: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        services: [
          { name: 'Buzz Cut', duration: 15, price: 400 },
          { name: 'Kids Cut', duration: 30, price: 500 },
          { name: 'Express Trim', duration: 15, price: 300 }
        ]
      }
    });
    await jordan.save();

    // 2. Create Barber Schedules
    const alexSchedule = new BarberSchedule({
      barberId: alex._id,
      weeklyHours: [
        { dayOfWeek: 0, isOpen: false, workingHours: [] },
        { dayOfWeek: 1, isOpen: false, workingHours: [] },
        { dayOfWeek: 2, isOpen: true, workingHours: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { dayOfWeek: 3, isOpen: true, workingHours: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { dayOfWeek: 4, isOpen: true, workingHours: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { dayOfWeek: 5, isOpen: true, workingHours: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] },
        { dayOfWeek: 6, isOpen: true, workingHours: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] }
      ],
      blockedTime: [
        {
          reason: 'Lunch Break',
          start: new Date('2026-06-16T13:00:00Z'),
          end: new Date('2026-06-16T14:00:00Z'),
          isWholeDay: false
        }
      ]
    });
    await alexSchedule.save();

    const sofiaSchedule = new BarberSchedule({
      barberId: sofia._id,
      weeklyHours: [
        { dayOfWeek: 0, isOpen: false, workingHours: [] },
        { dayOfWeek: 1, isOpen: true, workingHours: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '19:00' }] },
        { dayOfWeek: 2, isOpen: true, workingHours: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '19:00' }] },
        { dayOfWeek: 3, isOpen: true, workingHours: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '19:00' }] },
        { dayOfWeek: 4, isOpen: true, workingHours: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '19:00' }] },
        { dayOfWeek: 5, isOpen: true, workingHours: [{ start: '10:00', end: '14:00' }, { start: '15:00', end: '19:00' }] },
        { dayOfWeek: 6, isOpen: false, workingHours: [] }
      ],
      blockedTime: []
    });
    await sofiaSchedule.save();

    const jordanSchedule = new BarberSchedule({
      barberId: jordan._id,
      weeklyHours: [
        { dayOfWeek: 0, isOpen: true, workingHours: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
        { dayOfWeek: 1, isOpen: false, workingHours: [] },
        { dayOfWeek: 2, isOpen: false, workingHours: [] },
        { dayOfWeek: 3, isOpen: false, workingHours: [] },
        { dayOfWeek: 4, isOpen: true, workingHours: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
        { dayOfWeek: 5, isOpen: true, workingHours: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
        { dayOfWeek: 6, isOpen: true, workingHours: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }] }
      ],
      blockedTime: []
    });
    await jordanSchedule.save();

    // 3. Create Sample Appointments
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const yearT = tomorrow.getFullYear();
    const monthT = tomorrow.getMonth();
    const dateT = tomorrow.getDate();

    const yearH = today.getFullYear();
    const monthH = today.getMonth();
    const dateH = today.getDate();

    // Historical Completed bookings (For Analytics & Customer Dashboard)
    const pastApp1 = new Appointment({
      customerId: customerSarah._id,
      barberId: alex._id,
      service: { name: 'Classic Haircut', duration: 30, price: 600 },
      startTime: new Date(Date.UTC(yearH, monthH, dateH, 9, 30)),
      endTime: new Date(Date.UTC(yearH, monthH, dateH, 10, 0)),
      status: 'completed',
      tip: 100,
      notesFromBarber: 'Used #2 guard on sides, texture top, razor taper finish. Left part.',
      haircutImages: [
        'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80'
      ]
    });
    await pastApp1.save();

    const pastApp2 = new Appointment({
      customerId: customerJohn._id,
      barberId: alex._id,
      service: { name: 'Hot Towel Shave', duration: 30, price: 800 },
      startTime: new Date(Date.UTC(yearH, monthH, dateH, 11, 0)),
      endTime: new Date(Date.UTC(yearH, monthH, dateH, 11, 30)),
      status: 'completed',
      tip: 50,
      notesFromBarber: 'Hot towel shave with sandalwood pre-shave oil. Cold towel and balm post-shave.',
      haircutImages: [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80'
      ]
    });
    await pastApp2.save();

    const pastApp3 = new Appointment({
      customerId: customerSarah._id,
      barberId: sofia._id,
      service: { name: 'Scissor Sculpt & Style', duration: 45, price: 1000 },
      startTime: new Date(Date.UTC(yearH, monthH, dateH, 14, 0)),
      endTime: new Date(Date.UTC(yearH, monthH, dateH, 14, 45)),
      status: 'completed',
      tip: 150,
      notesFromBarber: 'All-over scissor cut, layered texturizing. Applied light styling pomade.',
      haircutImages: [
        'https://images.unsplash.com/photo-1605497746444-ac9da5848ba7?w=500&auto=format&fit=crop&q=80'
      ]
    });
    await pastApp3.save();

    const pastApp4 = new Appointment({
      customerId: customerSarah._id,
      barberId: alex._id,
      service: { name: 'Classic Haircut', duration: 30, price: 600 },
      startTime: new Date(Date.UTC(yearH, monthH, dateH - 7, 10, 0)), // 7 days ago
      endTime: new Date(Date.UTC(yearH, monthH, dateH - 7, 10, 30)),
      status: 'completed',
      tip: 100,
      notesFromBarber: 'Classic taper cut, scissor top. Client preferred guard #2 on sides.',
      haircutImages: [
        'https://images.unsplash.com/photo-1599351431247-f57949f56b75?w=500&auto=format&fit=crop&q=80'
      ]
    });
    await pastApp4.save();

    // Tomorrow Future Bookings (To test slots overlap blocking and queue views)
    const futureApp1 = new Appointment({
      customerId: customerSarah._id,
      barberId: alex._id,
      service: { name: 'Classic Haircut', duration: 30, price: 600 },
      startTime: new Date(Date.UTC(yearT, monthT, dateT, 10, 0)), // 10:00 UTC
      endTime: new Date(Date.UTC(yearT, monthT, dateT, 10, 30)),
      status: 'confirmed',
      tip: 0
    });
    await futureApp1.save();

    const futureApp2 = new Appointment({
      customerId: customerJohn._id,
      barberId: alex._id,
      service: { name: 'Beard Trim & Styling', duration: 15, price: 400 },
      startTime: new Date(Date.UTC(yearT, monthT, dateT, 11, 30)), // 11:30 UTC
      endTime: new Date(Date.UTC(yearT, monthT, dateT, 11, 45)),
      status: 'confirmed',
      tip: 0
    });
    await futureApp2.save();

    const futureApp3 = new Appointment({
      customerId: customerJohn._id,
      barberId: sofia._id,
      service: { name: 'Beard Sculpting', duration: 30, price: 500 },
      startTime: new Date(Date.UTC(yearT, monthT, dateT, 15, 0)), // 15:00 UTC
      endTime: new Date(Date.UTC(yearT, monthT, dateT, 15, 30)),
      status: 'confirmed',
      tip: 0
    });
    await futureApp3.save();

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

module.exports = seedData;
