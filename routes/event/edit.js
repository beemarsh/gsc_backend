const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { RouteError } = require('../../middleware/errorMiddleware');
const { verifyToken } = require('../../middleware/verify');

router.put('/', verifyToken, async (req, res, next) => {
    try {
        const { id } = req.query;
        const {
            eventName,
            eventDateTime,
            organizer,
            address,
            notes
        } = req.body;

        // Validate ID
        if (!id || !Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
            throw new RouteError(
                new Error("Invalid event ID"),
                400,
                "Event ID must be a positive integer"
            );
        }

        // Validate input
        validateEventInput(eventName, eventDateTime, organizer, address, notes);

        const connection = await pool.getConnection();

        try {
            const sql = `
                UPDATE events 
                SET event_name = ?, 
                    event_datetime = ?, 
                    organizer = ?, 
                    address = ?, 
                    notes = ?
                WHERE event_id = ?
            `;
            const [result] = await connection.execute(sql, [
                eventName,
                eventDateTime,
                organizer,
                address,
                notes,
                id
            ]);

            if (result.affectedRows === 0) {
                throw new RouteError(
                    new Error("Event not found"),
                    404,
                    "No event found with the specified ID"
                );
            }

            return res.json({ message: 'Event updated successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

// ...same validateEventInput function as in add.js...

module.exports = router;
