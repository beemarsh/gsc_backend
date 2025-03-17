const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { RouteError } = require('../../middleware/errorMiddleware');
const { verifyToken } = require('../../middleware/verify');


router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
            throw new RouteError(
                new Error("Invalid event ID"),
                400,
                "Event ID must be a positive integer"
            );
        }

        const connection = await pool.getConnection();

        try {
            const [events] = await connection.execute(
                'SELECT * FROM events WHERE event_id = ?',
                [id]
            );

            if (events.length === 0) {
                throw new RouteError(
                    new Error("Event not found"),
                    404,
                    "No event found with the specified ID"
                );
            }

            return res.json(events[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [events] = await connection.execute('SELECT * FROM events ORDER BY event_datetime');
            return res.json({ events });
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
