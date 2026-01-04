import db from '../utils/db.js';
import redisClient from '../utils/redis.js';

export const getSeats = async (req, res) => {
  const { eventId } = req.params;
  const cacheKey = `cache:seats:${eventId}`;

  try {
    let seats;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      seats = JSON.parse(cached);
    } else {
      const result = await db.query(
        `
        SELECT id, seat_number, status
        FROM seats
        WHERE event_id = $1
        ORDER BY seat_number
        `,
        [eventId]
      );
      seats = result.rows;

      await redisClient.set(cacheKey, JSON.stringify(seats), "EX", 120);
    }

    const lockKeys = await redisClient.keys(`seat:lock:${eventId}:*`);
    const lockedSeatIds = new Set(
      lockKeys.map(k => k.split(":").pop())
    );

    const response = seats.map(seat => ({
      id: seat.id,
      seat_number: seat.seat_number,
      status:
        seat.status === "BOOKED"
          ? "BOOKED"
          : lockedSeatIds.has(String(seat.id))
          ? "LOCKED"
          : "AVAILABLE"
    }));

    res.json(response);

  } catch (err) {
    console.error("Error fetching seats:", err);
    res.status(500).json({ error: "Failed to fetch seats" });
  }
};


export const lockSeats = async (req, res) => {
    const { event_id, seat_ids, user_id } = req.body;

    const locked=[];

    try{
        for (const seat_id of seat_ids) {
            const lockKey = `seat:lock:${event_id}:${seat_id}`;
            const result = await redisClient.set(
                lockKey,
                user_id,
                "NX",
                "EX",
                300
            );

            if(!result){
                throw new Error(`Seat ${seat_id} is already locked`);
            }

            locked.push(lockKey);
        }
        res.status(200).json({ message: 'Seats locked successfully' });
    } catch(err){
        if (locked.length) {
            await redisClient.del(...locked);
        }
        res.status(409).json({ error: err.message });
    }
};