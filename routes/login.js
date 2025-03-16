const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../db/db"); // Import the connection pool
const { RouteError } = require("../middleware/errorMiddleware"); // Import RouteError

const secretKey = process.env.JWT_SECRET || "your-secret-key";
const refreshTokenSecret =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

const refreshTokenExpiryDays = 30; // Set the refresh token expiry to 30 days

function generateAccessToken(user) {
  return jwt.sign({ userId: user.user_id, email: user.email }, secretKey, {
    expiresIn: "1d",
  });
}

function generateRefreshToken(user) {
  const refreshToken = crypto.randomBytes(64).toString("hex");
  return refreshToken;
}

async function storeRefreshToken(userId, refreshToken) {
    const sql = `
    INSERT INTO refresh_tokens (user_id, token, expiry_date)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
    token = VALUES(token),
    expiry_date = VALUES(expiry_date);
    `;
    try {
        const connection = await pool.getConnection();
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + refreshTokenExpiryDays); // Add expiry days

            await connection.execute(sql, [userId, refreshToken, expiryDate]);
        } finally {
            connection.release();
        }
    } catch (err) {
        throw new RouteError(err, 500, 'Database error storing refresh token');
    }
}

router.post("/", async (req, res, next) => {
  try {
    // Validate input
    validateInput(req.body?.email, req.body?.password);

    const { email, password } = req.body;

    // Retrieve user from database
    const sql = "SELECT * FROM auth WHERE email = ?";

    const connection = await pool.getConnection();

    try {
      const [results] = await connection.execute(sql, [email]);

      if (results.length === 0) {
        throw new RouteError(
          new Error("Invalid credentials"),
          401,
          "Login failed: Invalid credentials"
        );
      }

      const user = results[0];

      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        throw new RouteError(
          new Error("Invalid credentials"),
          401,
          "Login failed: Invalid credentials"
        );
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token in database
      await storeRefreshToken(user.user_id, refreshToken);

      // Set refresh token as HttpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true, // Only send over HTTPS
        sameSite: "None", // Prevent CSRF attacks
        maxAge: refreshTokenExpiryDays * 24 * 60 * 60 * 1000, // 30 days
      });

      // Send access token in response
      // Set access token as HttpOnly cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true, // Only send over HTTPS
        sameSite: "None", // Prevent CSRF attacks
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      // Send success message in response
      return res.status(200).json({ message: "Login successful" });
    } finally {
      connection.release();
    }
  } catch (error) {
    return next(error); // Pass RouteError to middleware
  }
});

function validateInput(email, password) {
  if (!email) {
    throw new RouteError(
      new Error("Please enter a valid email address"),
      400,
      "Please enter a valid email address"
    );
  }

  if (!password) {
    throw new RouteError(
      new Error("Please enter a valid password"),
      400,
      "Please enter a valid password"
    );
  }

  return true;
}

module.exports = router;
