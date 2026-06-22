require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Register models first before importing DB and routes
require('./models/User');
require('./models/BarberSchedule');
require('./models/Appointment');

const { connectDB } = require('./config/db');
const seedData = require('./config/seedData');
const User = require('./models/User');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// Configure CORS to allow any local React dev servers (standard ports: 5173, 3000)
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Set up WebSocket server
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Share socket.io instance with express app to access it in controller middlewares
app.set('io', io);

// Basic check route
app.get('/', (req, res) => {
  res.json({ message: 'Barber Booking API is active.' });
});

// Mount routes
app.use('/api', apiRoutes);

// Socket.io connection pipeline
io.on('connection', (socket) => {
  console.log(`WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;

// Connect to database, seed if empty, and listen
const startServer = async () => {
  await connectDB();

  // Startup Auto-Seeding: if DB is completely empty (no users), seed default accounts and profiles
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Initiating automatic setup...');
      await seedData();
    }
  } catch (err) {
    console.error('Error during automatic database seed check:', err);
  }

  server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  Barber Booking Server running on Port ${PORT}`);
    console.log(`  API Endpoints at http://localhost:${PORT}/api`);
    console.log(`=================================================`);
  });
};

startServer();
