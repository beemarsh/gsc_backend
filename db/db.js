const mysql = require('mysql2/promise'); // Use promise-based API for async/await
require('dotenv').config(); // Load environment variables from .env file

const pool = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_DATABASE,
  connectionLimit: 10 // Adjust the connection limit as needed
});

module.exports = { pool };