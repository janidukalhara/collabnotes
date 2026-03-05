/**
 * middleware/error.middleware.js
 *
 * Central error handling for Express.
 * All controllers can call next(err) and this handler will produce a consistent
 * JSON error response, with the stack trace stripped in production.
 */

const logger = require('../config/logger');

/** 404 handler — placed after all routes */
const notFound = (req, res, next) => {
  const err = new Error(`Not found — ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

/** Global error handler */
const errorHandler = (err, req, res, _next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `${field} already exists.` });
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for field: ${err.path}` });
  }

  const statusCode = err.statusCode || 500;
  logger.error(err.message);

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
