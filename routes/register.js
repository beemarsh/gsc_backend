const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../db/db"); // Import the connection pool
const { RouteError } = require("../middleware/errorMiddleware"); // Import RouteError
const validator = require("validator");

// Registration route
router.post(
  "/",

  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      // Validate input
      validateInput(name, email, password);

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      const connection = await pool.getConnection();

      try {
        // Store the user in the database
        const sql =
          "INSERT INTO auth (user_id, name, email, password) VALUES (?, ?, ?, ?)";
        await connection.execute(sql, [userId, name, email, hashedPassword]);

        return res
          .status(201)
          .json({ message: "User registered successfully" });
      } finally {
        // Release the connection back to the pool
        connection.release();
      }
    } catch (error) {
      return next(error); // Pass error to middleware
    }
  }
);

function validateInput(name, email, password) {
  if (typeof name !== "string" || name.length < 2) {
    throw new RouteError(
      new Error("Name must be a string with at least 2 characters"),
      400,
      "Name must be a string with at least 2 characters"
    );
  } else {
    // Character whitelisting and length validation
    const sanitizedName = validator.whitelist(name, "a-zA-Z0-9\\s"); // Allow alphanumeric and space

    if (sanitizedName.length !== name.length) {
      throw new RouteError(
        new Error(
          "Name contains invalid characters. Only alphanumeric characters and spaces are allowed."
        ),
        400,
        "Name contains invalid characters. Only alphanumeric characters and spaces are allowed."
      );
    }

    if (name.length > 20) {
      new Error(
        "Name cannot be longer than 20 characters",
        400,
        "Name cannot be longer than 20 characters"
      );
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new RouteError(
      new Error("Invalid email address"),
      400,
      "Invalid email address"
    );
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\s\S]).{8,}$/;

  if (!passwordRegex.test(password)) {
    throw new RouteError(
      new Error(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase and a sepcial character"
      ),
      400,
      "An uppercase letter, a lowercase and a special character is required for passwords."
    );
  }

  return true;
}

module.exports = router;
