const express = require('express');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { notFound } = require('./middleware/notFoundMiddleware');

const app = express();

const { con } = require('./db/db'); // Import the database connection


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Handle 404
app.use(notFound);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
