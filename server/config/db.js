const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    // Fallback if no MONGODB_URI is provided
    if (!uri) {
      console.log('No MONGODB_URI environment variable found. Checking MongoMemoryServer...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        console.log(`In-memory MongoDB started at: ${uri}`);
      } catch (err) {
        console.warn('Could not start mongodb-memory-server. Using local default URI.');
        uri = 'mongodb://127.0.0.1:27017/saloon';
      }
    }
    
    await mongoose.connect(uri);
    console.log(`MongoDB connected to: ${uri}`);

    // Ensure models are registered before syncing indexes
    // We register them in server.js, so we can trigger index synchronization here
    setTimeout(async () => {
      try {
        const Appointment = mongoose.model('Appointment');
        const User = mongoose.model('User');
        await User.syncIndexes();
        await Appointment.syncIndexes();
        console.log('Database indexes synchronized.');
      } catch (err) {
        console.error('Error synchronizing indexes:', err);
      }
    }, 1000);

  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.log('Attempting in-memory database fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log(`MongoDB In-Memory fallback connected to: ${uri}`);
    } catch (fallbackErr) {
      console.error('In-memory fallback failed:', fallbackErr);
      process.exit(1);
    }
  }
};

module.exports = { connectDB };
