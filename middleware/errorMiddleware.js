class RouteError extends Error {
    constructor(error, statusCode, details) {
      super(error);
      this.statusCode = statusCode;
      this.details = details;
      this.name = 'CustomError'; // Optional: Set error name
    }
  }

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { errorHandler,RouteError};
