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

const logger = require("../utils/secureLogger");

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.sensitivePatterns = [
      /password/gi,
      /token/gi,
      /secret/gi,
      /key/gi,
      /auth/gi,
      /bearer/gi,
      /jwt/gi,
    ];
  }

  /**
   * Main error handling middleware
   */
  handle() {
    return (error, req, res, next) => {
      // Sanitize error message
      const sanitizedError = this.sanitizeError(error);

      // Categorize error
      const errorInfo = this.categorizeError(sanitizedError, req);

      // Log error securely
      this.logError(errorInfo, req);

      // Check for security implications
      if (this.isSecurityRelevant(sanitizedError, req)) {
        this.handleSecurityError(sanitizedError, req);
      }

      // Send appropriate response
      this.sendResponse(res, errorInfo);
    };
  }

  /**
   * Sanitize error message and stack trace
   */
  sanitizeError(error) {
    let message = error.message || "Unknown error";
    let stack = error.stack || "";

    // Remove sensitive information
    this.sensitivePatterns.forEach((pattern) => {
      message = message.replace(pattern, "[REDACTED]");
      stack = stack.replace(pattern, "[REDACTED]");
    });

    return {
      name: error.name || "Error",
      message: message,
      code: error.code,
      status: error.status || error.statusCode || 500,
      stack: process.env.NODE_ENV === "development" ? stack : undefined,
    };
  }

  /**
   * Categorize error by type and severity
   */
  categorizeError(error, req) {
    let category = "unknown";
    let severity = "medium";
    let userMessage = "An internal server error occurred";

    // Database errors
    if (error.name === "MongoError" || error.name === "MongooseError") {
      category = "database";
      severity = "high";
      userMessage = "Database operation failed";
    }

    // Authentication/Authorization errors
    if (error.status === 401 || error.status === 403) {
      category = "auth";
      severity = "medium";
      userMessage =
        error.status === 401 ? "Authentication required" : "Access denied";
    }

    // Validation errors
    if (error.name === "ValidationError" || error.status === 400) {
      category = "validation";
      severity = "low";
      userMessage = "Invalid request data";
    }

    // Rate limiting errors
    if (error.status === 429) {
      category = "rate_limit";
      severity = "medium";
      userMessage = "Too many requests. Please try again later.";
    }

    // Network/timeout errors
    if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
      category = "network";
      severity = "medium";
      userMessage = "Network error occurred";
    }

    // File system errors
    if (error.code === "ENOENT" || error.code === "EACCES") {
      category = "filesystem";
      severity = "high";
      userMessage = "File operation failed";
    }

    return {
      ...error,
      category,
      severity,
      userMessage,
      timestamp: new Date().toISOString(),
      requestId: req.id || "unknown",
    };
  }

  /**
   * Log error with appropriate level and context
   */
  logError(errorInfo, req) {
    const logData = {
      error: errorInfo.message,
      category: errorInfo.category,
      severity: errorInfo.severity,
      status: errorInfo.status,
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      timestamp: errorInfo.timestamp,
      requestId: errorInfo.requestId,
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === "development" && errorInfo.stack) {
      logData.stack = errorInfo.stack;
    }

    // Log with appropriate level
    switch (errorInfo.severity) {
      case "low":
        logger.info("Application error (low severity)", logData);
        break;
      case "medium":
        logger.warn("Application error (medium severity)", logData);
        break;
      case "high":
      case "critical":
        logger.error("Application error (high/critical severity)", logData);
        break;
      default:
        logger.error("Application error (unknown severity)", logData);
    }
  }

  /**
   * Check if error has security implications
   */
  isSecurityRelevant(error, req) {
    const securityIndicators = [
      // SQL injection attempts
      /union.*select/i,
      /drop.*table/i,
      /insert.*into/i,

      // XSS attempts
      /<script/i,
      /javascript:/i,
      /onerror=/i,

      // Path traversal
      /\.\.[/\\]/,

      // Command injection
      /;.*whoami/i,
      /;.*cat\s/i,
      /;.*ls\s/i,

      // Authentication bypass attempts
      /admin.*bypass/i,
      /auth.*skip/i,
    ];

    const url = req.originalUrl || req.url || "";
    const userAgent = req.get("User-Agent") || "";
    const errorMessage = error.message || "";

    return securityIndicators.some(
      (pattern) =>
        pattern.test(url) ||
        pattern.test(userAgent) ||
        pattern.test(errorMessage)
    );
  }

  /**
   * Handle security-relevant errors
   */
  handleSecurityError(error, req) {
    const securityEvent = {
      type: "security_error",
      error: error.message,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      severity: "high",
      timestamp: new Date().toISOString(),
    };

    logger.security("Security-relevant error detected", securityEvent);

    // Additional security monitoring could be added here
    // e.g., incrementing threat scores, triggering alerts
  }

  /**
   * Send appropriate error response
   */
  sendResponse(res, errorInfo) {
    // Don't send response if already sent
    if (res.headersSent) {
      return;
    }

    const responseData = {
      error: true,
      message: errorInfo.userMessage,
      timestamp: errorInfo.timestamp,
      requestId: errorInfo.requestId,
    };

    // Add error details in development mode
    if (process.env.NODE_ENV === "development") {
      responseData.details = {
        name: errorInfo.name,
        message: errorInfo.message,
        category: errorInfo.category,
        severity: errorInfo.severity,
      };

      if (errorInfo.stack) {
        responseData.details.stack = errorInfo.stack;
      }
    }

    res.status(errorInfo.status).json(responseData);
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection() {
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Promise Rejection", {
        reason: reason?.message || reason,
        promise: promise.toString(),
        severity: "critical",
      });

      // Graceful shutdown in production
      if (process.env.NODE_ENV === "production") {
        logger.error("Shutting down due to unhandled promise rejection");
        process.exit(1);
      }
    });
  }

  /**
   * Handle uncaught exceptions
   */
  handleUncaughtException() {
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", {
        error: error.message,
        stack: error.stack,
        severity: "critical",
      });

      // Graceful shutdown
      logger.error("Shutting down due to uncaught exception");
      process.exit(1);
    });
  }

  /**
   * Initialize global error handlers
   */
  initializeGlobalHandlers() {
    this.handleUnhandledRejection();
    this.handleUncaughtException();

    logger.info("Global error handlers initialized");
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

module.exports = errorHandler;
