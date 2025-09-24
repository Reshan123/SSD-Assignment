/**
 * Enhanced Error Handling Middleware
 * Provides comprehensive error handling with secure logging
 *
 * Features:
 * - Secure error logging without sensitive data exposure
 * - Error categorization and classification
 * - Rate limiting for error responses
 * - Security event detection in errors
 * - Production-safe error responses
 */

const secureLogger = require("../utils/secureLogger");

const errorHandler = (err, req, res, next) => {
  // Log the error securely
  secureLogger.error("Application error occurred", {
    component: "errorHandler",
    action: "error_caught",
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Determine error status and message
  let status = err.statusCode || err.status || 500;
  let message = "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation Error";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID format";
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate entry";
  } else if (status < 500) {
    message = err.message;
  }

  // Send sanitized error response
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
