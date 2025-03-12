const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { con } = require("../db/db"); // Import the database connection
const { RouteError } = require("../middleware/errorMiddleware"); // Import RouteError

// Registration route
router.post(
  "/",

  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      // Validate input
      const validationErrors = validateInput(name, email, password);
      if (validationErrors.length > 0) {
        throw new RouteError(validationErrors, 400, "Validation error");
      }

      await validationResult(req);

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Store the user in the database
      const sql =
        "INSERT INTO auth (user_id, name, email, password) VALUES (?, ?, ?, ?)";
      con.query(sql, [userId, name, email, hashedPassword], (err, result) => {
        if (err) {
          throw new RouteError(err, 500, "Registration failed: Database error");
        }

        return res
          .status(201)
          .json({ message: "User registered successfully" });
      });
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
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new RouteError(
      new Error("Invalid email address"),
      400,
      "Invalid email address"
    );
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new RouteError(
      new Error(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase"
      ),
      400,
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase"
    );
  }

  return true;
}

module.exports = router;
