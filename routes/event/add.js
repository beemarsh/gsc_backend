const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { RouteError } = require('../../middleware/errorMiddleware');
const { verifyToken } = require('../../middleware/verify');
const { validateEventInput } = require('../../utils/validation');

router.post('/', verifyToken, async (req, res, next) => {
    try {
        const {
            eventName,
            eventDateTime,
            organizer,
            address,
            notes
        } = req.body;

        
        // Validate input
        validateEventInput(req.body);

        const connection = await pool.getConnection();

        try {
            const sql = `
                INSERT INTO events 
                (event_name, event_datetime, organizer, address, notes) 
                VALUES (?, ?, ?, ?, ?)
            `;
            await connection.execute(sql, [
                eventName,
                eventDateTime,
                organizer,
                address,
                notes
            ]);

            return res.status(201).json({ message: "Event added successfully" });
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
