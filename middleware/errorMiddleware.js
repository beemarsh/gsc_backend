class RouteError extends Error {
    constructor(error, statusCode, details) {
      super(error);
      this.statusCode = statusCode;
      this.details = details;
      this.name = 'CustomError'; // Optional: Set error name
    }
  }

const errorHandler = (err, req, res, next) => {
    const statusCode = err?.statusCode ? err.statusCode : 500;
    console.log(err);
    return res.status(statusCode).json({
        details: err?.details,
        stack: process.env.DEBUG === 'False' ? null : err.stack
    });
};

module.exports = { errorHandler,RouteError};
