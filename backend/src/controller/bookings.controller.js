import db from '../utils/db.js';
import redisClient from '../utils/redis.js';


export const confirmBooking = async (req, res) => {
    const { event_id, seat_ids, user_id } = req.body;

    try {
        for (const seat_id of seat_ids) {
            const lockKey = `seat:lock:${event_id}:${seat_id}`;
            const lockOwner = await redisClient.get(lockKey);

            if (lockOwner !== String(user_id)) {
                return res.status(400).json({ error: `Seat ${seat_id} is not locked by user ${user_id}` });
            }
        }

        await db.query(`BEGIN`);

        const bookingResult = await db.query(
            `INSERT INTO bookings (event_id, user_id,status)
             VALUES ($1, $2, 'CONFIRMED')
             RETURNING id`,
            [event_id, user_id]
        )

        const bookingId = bookingResult.rows[0].id;

        for (const seat_id of seat_ids) {
            const update = await db.query(
                `UPDATE seats
                 SET status = 'BOOKED'
                 WHERE id = $1 AND event_id = $2 AND status != 'BOOKED'`,
                [seat_id, event_id]
            )

            if (update.rowCount === 0) {
                throw new Error(`Seat ${seat_id} already booked`);
            }

            await db.query(
                `INSERT INTO booking_seats (booking_id, seat_id)
                 VALUES ($1, $2)`,
                [bookingId, seat_id]
            );
        }
        await db.query('COMMIT');

        for (const seat_id of seat_ids) {
            await redisClient.del(`seat:lock:${event_id}:${seat_id}`);
        }

        await redisClient.del(`cache:seats:${event_id}`);
        res.json({ message: "Booking confirmed", bookingId });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error("Error confirming booking:", err);
        res.status(500).json({ error: "Failed to confirm booking" });
    }
};