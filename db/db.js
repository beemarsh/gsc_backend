const mysql = require('mysql');
require('dotenv').config(); // Load environment variables from .env file

const con = mysql.createConnection({
  host: process.env.DB_HOST ,  // Default to localhost if not set
  user: process.env.DB_USER, // Default to yourusername if not set
  password: process.env.DB_PASSWORD , // Default to yourpassword if not set
  database: process.env.DB_DATABASE // Default to yourdatabase if not set
});

con.connect(function(err) {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }

  console.log('Connected to database as id ' + con.threadId);
});

module.exports = { con };