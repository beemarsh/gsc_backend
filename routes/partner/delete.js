const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { RouteError } = require('../../middleware/errorMiddleware');
const { verifyToken } = require('../../middleware/verify');

router.delete('/', verifyToken, async (req, res, next) => {
    try {
        const { id } = req.query;

        // Validate ID
        if (!id || !Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
            throw new RouteError(
                new Error("Invalid partner ID"),
                400,
                "Partner ID must be a positive integer"
            );
        }

        const connection = await pool.getConnection();

        try {
            const sql = 'DELETE FROM partners WHERE partner_id = ?';
            const [result] = await connection.execute(sql, [id]);

            if (result.affectedRows === 0) {
                throw new RouteError(
                    new Error("Partner not found"),
                    404,
                    "No partner found with the specified ID"
                );
            }

            return res.json({ message: 'Partner deleted successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
