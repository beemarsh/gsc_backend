const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { con } = require('../db/db'); // Import the database connection
const { RouteError } = require('../middleware/errorMiddleware'); // Import RouteError

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

function generateAccessToken(user) {
    return jwt.sign({ userId: user.user_id, email: user.email }, secretKey, { expiresIn: '1d' });
}

function generateRefreshToken(user) {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    return refreshToken;
}

async function storeRefreshToken(userId, refreshToken) {
    const sql = 'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
        con.query(sql, [userId, refreshToken], (err, result) => {
            if (err) {
                reject(new RouteError('Database error storing refresh token', 500, { dbError: err }));
            } else {
                resolve(result);
            }
        });
    });
}

router.post('/', async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Validate input
        const validationErrors = validateInput(email, password);
        if (validationErrors.length > 0) {
            return next(new RouteError('Validation error', 400, validationErrors));
        }

        // Retrieve user from database
        const sql = 'SELECT * FROM auth WHERE email = ?';
        con.query(sql, [email], async (err, results) => {
            if (err) {
                return next(new RouteError('Login failed: Database error', 500, { dbError: err }));
            }

            if (results.length === 0) {
                return next(new RouteError('Login failed: Invalid credentials', 401));
            }

            const user = results[0];

            // Compare passwords
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return next(new RouteError('Login failed: Invalid credentials', 401));
            }

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            // Store refresh token in database
            try {
                await storeRefreshToken(user.user_id, refreshToken);
            } catch (error) {
                return next(error); // Pass RouteError from storeRefreshToken
            }

            // Set refresh token as HttpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true, // Only send over HTTPS
                sameSite: 'strict', // Prevent CSRF attacks
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            // Send access token in response
            return res.status(200).json({ message: 'Login successful', accessToken: accessToken });
        });
    } catch (error) {
        return next(error); // Pass RouteError to middleware
    }
});

function validateInput(email, password) {
    const errors = [];

    if (!email) {
        errors.push('Email is required');
    }

    if (!password) {
        errors.push('Password is required');
    }

    return errors;
}

module.exports = router;