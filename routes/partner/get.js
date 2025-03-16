const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { RouteError } = require('../../middleware/errorMiddleware');
const { verifyToken } = require('../../middleware/verify');

router.get('/', verifyToken, async (req, res, next) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [partners] = await connection.execute('SELECT * FROM partners');
            return res.json({ partners });
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || !Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
            throw new RouteError(
                new Error("Invalid partner ID"),
                400,
                "Partner ID must be a positive integer"
            );
        }

        const connection = await pool.getConnection();

        try {
            const [partners] = await connection.execute(
                'SELECT * FROM partners WHERE id = ?',
                [id]
            );

            if (partners.length === 0) {
                throw new RouteError(
                    new Error("Partner not found"),
                    404,
                    "No partner found with the specified ID"
                );
            }

            return res.json(partners[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
