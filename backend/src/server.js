import express from 'express';
import db from './utils/db.js';
import eventsRouter from './routes/events.route.js';
import seatsRouter from './routes/seats.route.js';
import bookingsRouter from './routes/bookings.route.js';
import cors from 'cors';
import redisClient from './utils/redis.js';


const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use('/events', eventsRouter);
app.use('/seats',seatsRouter);
app.use('/bookings',bookingsRouter);


app.get('/health', async (req, res) => {
  res.send('Server is healthy');
});

const startServer = async () => {
  try {
    await db.query('SELECT 1');

    const pong = await redisClient.ping();
    if (pong !== "PONG") {
      throw new Error("Redis did not respond correctly");
    }
    console.log("Redis connected");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer();
