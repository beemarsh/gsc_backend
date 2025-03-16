const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { RouteError } = require('../../middleware/errorMiddleware');
const { verifyToken } = require('../../middleware/verify');

router.delete('/', verifyToken, async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id || !Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
            throw new RouteError(
                new Error("Invalid event ID"),
                400,
                "Event ID must be a positive integer"
            );
        }

        const connection = await pool.getConnection();

        try {
            const sql = 'DELETE FROM events WHERE event_id = ?';
            const [result] = await connection.execute(sql, [id]);

            if (result.affectedRows === 0) {
                throw new RouteError(
                    new Error("Event not found"),
                    404,
                    "No event found with the specified ID"
                );
            }

            return res.json({ message: 'Event deleted successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
