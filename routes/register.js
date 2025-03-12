const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { validationResult, body } = require('express-validator');
const { con } = require('../db/db'); // Import the database connection
const { RouteError } = require('../middleware/errorMiddleware'); // Import RouteError

// Registration route
router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().isEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new RouteError('Validation error', 400, errors.array());
        }

        const { name, email, password } = req.body;

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();

            // Store the user in the database
            const sql = 'INSERT INTO auth (user_id, name, email, password) VALUES (?, ?, ?, ?)';
            con.query(sql, [userId, name, email, hashedPassword], (err, result) => {
                if (err) {
                    throw new RouteError(err, 500, 'Registration failed: Database error');
                }

                return res.status(201).json({ message: 'User registered successfully' });
            });
        } catch (error) {
            next(error); // Pass error to middleware
        }
    }
);

module.exports = router;
