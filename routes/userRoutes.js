const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validationResult, body } = require('express-validator');
const {con} = require('../index')
const routes = require('./routes'); // Assuming this is in your main app file
const userRoutes = routes.userRoutes;

const secretKey = process.env.JWT_SECRET || 'your-secret-key';

// Sample users array
let users = [];

// GET all users
router.get('/', (req, res) => {
    res.json(users);
});

// POST new user
router.post('/', (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        throw new Error('Please provide name and email');
    }

    const newUser = { id: users.length + 1, name, email };
    users.push(newUser);
    res.status(201).json(newUser);
});

// Registration route
router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();

            // Store the user in the database (replace with your actual database logic)
            const sql = 'INSERT INTO authentication (user_id, name, email, password) VALUES (?, ?, ?, ?)';
            con.query(sql, [userId, name, email, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ message: 'Registration failed' });
                }

                // Generate JWT token
                const token = jwt.sign({ userId: userId, email: email }, secretKey, { expiresIn: '1h' });

                res.status(201).json({ message: 'User registered successfully', token: token });
            });


        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Registration failed' });
        }
    }
);

module.exports = router;
