const express = require("express");
const routes = require("./routes");
const { errorHandler } = require("./middleware/errorMiddleware");
const { notFound } = require("./middleware/notFoundMiddleware");
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser()); // Middleware to parse cookies

const cors = require('cors');
app.use(cors({
    origin: ['https://api.gulfsouth.info', 'api.gulfsouth.info', 'www.gulfsouth.info', 'gulfsouth.info', 'https://www.gulfsouth.info','https://gulfsouth.info'], // Update with your frontend URL
    credentials: true
}));

// Routes
app.use("/", routes);

// Handle 404
app.use(notFound);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});