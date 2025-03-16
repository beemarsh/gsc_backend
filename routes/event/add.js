const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { RouteError } = require('../../middleware/errorMiddleware');
const { verifyToken } = require('../../middleware/verify');

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
        validateEventInput(eventName, eventDateTime, organizer, address, notes);

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

function validateEventInput(eventName, eventDateTime, organizer, address, notes) {
    // Event name validation
    if (!eventName || typeof eventName !== 'string' || eventName.length < 3) {
        throw new RouteError(
            new Error("Event name must be at least 3 characters long"),
            400,
            "Event name must be at least 3 characters long"
        );
    }

    // Event date and time validation
    const dateTime = new Date(eventDateTime);
    if (isNaN(dateTime.getTime())) {
        throw new RouteError(
            new Error("Invalid date and time format"),
            400,
            "Invalid date and time format. Use ISO 8601 format"
        );
    }

    if (dateTime < new Date()) {
        throw new RouteError(
            new Error("Event date must be in the future"),
            400,
            "Event date must be in the future"
        );
    }

    // Organizer validation
    if (!organizer || typeof organizer !== 'string' || organizer.length < 2) {
        throw new RouteError(
            new Error("Organizer name must be at least 2 characters long"),
            400,
            "Organizer name must be at least 2 characters long"
        );
    }

    // Address validation
    const addressRegex = /^[A-Za-z0-9\s.,#-]+$/;
    if (!addressRegex.test(address)) {
        throw new RouteError(
            new Error("Invalid address format"),
            400,
            "Invalid address format"
        );
    }

    // Notes validation (optional field)
    if (notes && (typeof notes !== 'string' || notes.length > 500)) {
        throw new RouteError(
            new Error("Notes must be a string with maximum 500 characters"),
            400,
            "Notes must be a string with maximum 500 characters"
        );
    }

    return true;
}

module.exports = router;
