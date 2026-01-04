import db from '../utils/db.js';

export const getEvents = async (req,res) => {
    const events = await db.query('SELECT * FROM events');
    res.send(events.rows);
}

export const getEventById = async (req,res) => {
    const eventId = req.params.id;
    const event = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    res.send(event.rows);
}