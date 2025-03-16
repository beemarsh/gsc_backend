const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../db/db");
const { RouteError } = require("./errorMiddleware");

const secretKey = process.env.JWT_SECRET;

function generateAccessToken(user) {
  return jwt.sign({ userId: user.user_id, email: user.email }, secretKey, {
    expiresIn: "1d",
  });
}

function generateRefreshToken() {
  const refreshToken = crypto.randomBytes(64).toString("hex");
  return refreshToken;
}

async function storeRefreshToken(userId, refreshToken) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)",
      [userId, refreshToken]
    );
  } catch (err) {
    throw new RouteError(err, 401, "Database error storing refresh token");
  } finally {
    connection.release();
  }
}

const verifyToken = async (req, res, next) => {

  console.log(req.cookies?.accessToken);
  
  try {
    if (!req.cookies?.refreshToken) {
      throw new RouteError(
        new Error("No Refresh Tokens"),
        401,
        "Please log in again."
      );
    }

    if (!req.cookies?.accessToken) {
      throw new RouteError(
        new Error("No Access Tokens"),
        401,
        "Please log in."
      );
    }

    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    try {
      // Verify access token
      const decoded = jwt.verify(accessToken, secretKey);
      req.user = decoded;
      return next();
    } catch (accessError) {
      // Handle expired or invalid access token
      if (accessError.name === "TokenExpiredError" && refreshToken) {
        const connection = await pool.getConnection();
        try {
          // Verify refresh token
          const [tokens] = await connection.execute(
            "SELECT * FROM refresh_tokens WHERE token = ?",
            [refreshToken]
          );

          if (tokens.length === 0) {
            throw new RouteError(
              new Error("Invalid refresh token"),
              401,
              "Invalid refresh token"
            );
          }

          const refreshTokenData = tokens[0];
          const userId = refreshTokenData.user_id;

          // Fetch user details
          const [users] = await connection.execute(
            "SELECT * FROM auth WHERE user_id = ?",
            [userId]
          );

          if (users.length === 0) {
            throw new RouteError(
              new Error("User not found"),
              401,
              "User not found"
            );
          }

          const user = users[0];

          // Generate new tokens
          const newAccessToken = generateAccessToken(user);
          const newRefreshToken = generateRefreshToken();

          // Store new refresh token
          await storeRefreshToken(user.user_id, newRefreshToken);

          // Delete old refresh token
          await connection.execute(
            "DELETE FROM refresh_tokens WHERE token = ?",
            [refreshToken]
          );

          // Set new tokens
          res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
          });

          res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
          });

          req.user = { userId: user.user_id, email: user.email };
          return next();
        } finally {
          connection.release();
        }
      } else {
        throw new RouteError(
          new Error("Invalid access token"),
          401,
          "Invalid access token"
        );
      }
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = { verifyToken };