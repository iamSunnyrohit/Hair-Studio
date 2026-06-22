require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const BarberSchedule = require('../models/BarberSchedule');
const seedData = require('../config/seedData');

const runConcurrencyTest = async () => {
  let mongoServer;
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Starting self-contained in-memory MongoDB...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    console.log('Connecting to in-memory database...');
    await mongoose.connect(uri);

    console.log('Seeding fresh database before race-condition simulation...');
    await seedData();

    // Retrieve references
    const customer1 = await User.findOne({ email: 'sarah@customer.com' });
    const customer2 = await User.findOne({ email: 'john@customer.com' });
    const barber = await User.findOne({ email: 'alex@barber.com' });

    if (!customer1 || !customer2 || !barber) {
      throw new Error('Seed users not found. Test aborted.');
    }

    // Set up a target slot: 2:00 PM UTC on the Tuesday of next week
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (2 + 7 - targetDate.getDay()) % 7 || 7); // Next Tuesday
    targetDate.setUTCHours(14, 0, 0, 0); // 14:00 UTC

    const serviceName = 'Classic Haircut';
    const duration = 30; // 30 mins
    const endTime = new Date(targetDate.getTime() + duration * 60 * 1000);

    console.log(`Race Condition Slot: ${targetDate.toISOString()} -> ${endTime.toISOString()}`);
    console.log('Launching 2 simultaneous booking attempts...');

    // Function to run a single booking request simulation
    const simulateBooking = async (customerId, name) => {
      try {
        // Step 1: Query overlap checking
        const checkOverlap = await Appointment.findOne({
          barberId: barber._id,
          status: { $in: ['confirmed', 'pending', 'completed'] },
          startTime: { $lt: endTime },
          endTime: { $gt: targetDate }
        });

        if (checkOverlap) {
          return { success: false, client: name, status: 409, message: 'This slot was secured by another client.' };
        }

        // Simulate network / processing delay to widen race window (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Step 2: Create appointment
        const newApp = new Appointment({
          customerId,
          barberId: barber._id,
          service: {
            name: serviceName,
            duration,
            price: 30
          },
          startTime: targetDate,
          endTime: endTime,
          status: 'confirmed'
        });

        await newApp.save();
        return { success: true, client: name, status: 201, id: newApp._id };
      } catch (err) {
        return { success: false, client: name, status: 500, error: err.message };
      }
    };

    // Execute simultaneously
    const results = await Promise.all([
      simulateBooking(customer1._id, 'Sarah Connor (Client A)'),
      simulateBooking(customer2._id, 'John Doe (Client B)')
    ]);

    console.log('\n--- SIMULATION RESULTS ---');
    results.forEach(res => {
      if (res.success) {
        console.log(`✅ SUCCESS: ${res.client} secured slot. Appointment ID: ${res.id}`);
      } else {
        console.log(`❌ FAILED: ${res.client} got status ${res.status}. Reason: ${res.message || res.error}`);
      }
    });

    const successfulCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log('--------------------------');
    if (successfulCount === 1 && failedCount === 1) {
      console.log('🏆 VERDICT: Concurrency Check PASSED. Double-booking blocked successfully!');
    } else {
      console.warn('⚠️ VERDICT: Concurrency Check FAIL or unexpected output.');
    }

  } catch (err) {
    console.error('Test script crashed:', err);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('In-memory MongoDB stopped.');
    }
    console.log('Connection closed.');
  }
};

runConcurrencyTest();
