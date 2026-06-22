require('dotenv').config();
const mongoose = require('mongoose');
const seedData = require('../config/seedData');

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saloon';
  try {
    await mongoose.connect(uri);
    console.log(`Connected to database at ${uri} for seeding.`);
    await seedData();
  } catch (err) {
    console.error('Seeding process encountered an error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

run();
