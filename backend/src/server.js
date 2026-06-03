import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import db, { query } from './utils/db.js';
import redisClient from './utils/redis.js';

// Load environment variables
dotenv.config();

import authRouter from './routes/auth.route.js';
import eventsRouter from './routes/events.route.js';
import seatsRouter from './routes/seats.route.js';
import bookingsRouter from './routes/bookings.route.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================
// MIDDLEWARE
// ============================================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ============================================
// ROUTES
// ============================================

app.use('/auth', authRouter);
app.use('/events', eventsRouter);
app.use('/seats', seatsRouter);
app.use('/bookings', bookingsRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await query('SELECT 1');
    console.log('✓ Database connected');

    // Test Redis connection
    console.log('Testing Redis connection...');
    const pong = await redisClient.ping();
    if (pong !== "PONG") {
      throw new Error("Redis did not respond correctly");
    }
    console.log('✓ Redis connected');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Frontend URL: ${FRONTEND_URL}`);
    });
  } catch (err) {
    console.error('✗ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
