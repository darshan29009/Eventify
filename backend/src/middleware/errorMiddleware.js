const logger = require('../utils/logger');

// Not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(val => val.message);
    message = messages.join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Stripe errors
  if (err.type && err.type.includes('Stripe')) {
    statusCode = 400;
    message = err.message;
  }

  // Set locals, only providing error in development
  res.locals.message = message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Log error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(req.app.get('env') === 'development' && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };
