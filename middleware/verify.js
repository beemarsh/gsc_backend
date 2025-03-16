const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { con } = require("../db/db");
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
  const sql = "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)";
  return new Promise((resolve, reject) => {
    con.query(sql, [userId, refreshToken], (err, result) => {
      if (err) {
        reject(
          new RouteError(err, 401, "Database error storing refresh token")
        );
      } else {
        resolve(result);
      }
    });
  });
}

const verifyToken = async (req, res, next) => {

  console.log(req.cookies);
  
  if(!req.cookies?.refreshToken){
    return next(
      new RouteError(new Error("No Refresh Tokens"), 401, "Please log in again. ")
    ); 
  }

  if(!req.cookies?.accessToken){
    return next(
      new RouteError(new Error("No Access Tokens"), 401, "Please log in. ")
    ); 
  }

  const accessToken = req.cookies.accessToken; // Assuming token is in Authorization header
  const refreshToken = req.cookies.refreshToken;
  try {


    if (!accessToken) {
      throw RouteError(
        new Error("Unauthorized: Access token missing"),
        401,
        "Unauthorized: Access token missing"
      );
    }

    // Verify access token
    const decoded = jwt.verify(accessToken, secretKey);
    req.user = decoded; // Attach user information to the request object
    return next(); // Access token is valid, proceed to the next middleware/route
  } catch (accessError) {
    // Access token has expired or is invalid
    if (accessError.name === "TokenExpiredError" && refreshToken) {
      try {
        // Verify refresh token
        const sql = "SELECT * FROM refresh_tokens WHERE token = ?";
        con.query(sql, [refreshToken], async (err, results) => {
          if (err) {
            return next(
              new RouteError(err, 401, "Database error verifying refresh token")
            );
          }

          if (results.length === 0) {
            return next(new Error("Unauthorized: Invalid refresh token"));
          }

          const refreshTokenData = results[0];
          const userId = refreshTokenData.user_id;

          // Fetch user details
          const userSql = "SELECT * FROM auth WHERE user_id = ?";
          con.query(userSql, [userId], async (err, userResults) => {
            if (err) {
              return next(
                new RouteError(err, 401, "Database error fetching user details")
              );
            }

            if (userResults.length === 0) {
              return next(new RouteError("Unauthorized: User not found", 401));
            }

            const user = userResults[0];

            // Generate new tokens
            const newAccessToken = generateAccessToken(user);
            const newRefreshToken = generateRefreshToken(user);

            // Store new refresh token
            try {
              await storeRefreshToken(user.user_id, newRefreshToken);
            } catch (storeError) {
              return next(storeError); // Pass RouteError from storeRefreshToken
            }

            // Delete old refresh token
            const deleteSql = "DELETE FROM refresh_tokens WHERE token = ?";
            con.query(deleteSql, [refreshToken], (deleteErr, deleteResult) => {
              if (deleteErr) {
                console.error("Error deleting old refresh token:", deleteErr);
                // Log the error but don't interrupt the flow
              }
            });

            // Set new refresh token as HttpOnly cookie
            res.cookie("refreshToken", newRefreshToken, {
              httpOnly: true,
              secure: true, // Only send over HTTPS
              sameSite: "strict", // Prevent CSRF attacks
            });

            // Attach user information to the request object
            req.user = { userId: user.user_id, email: user.email };

            // Set new access token in the authorization header
            res.setHeader("Authorization", `Bearer ${newAccessToken}`);

            return next(); // Proceed to the next middleware/route with new tokens
          });
        });
      } catch (refreshError) {
        return next(new RouteError("Unauthorized: Invalid refresh token", 401));
      }
    } else {
      return next(new RouteError("Unauthorized: Invalid access token", 401));
    }
  }
};

module.exports = { verifyToken };
