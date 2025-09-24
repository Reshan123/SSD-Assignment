/**
 * Secure Logging and Monitoring Utility
 * Fixes: Information Exposure Through Log Files (CWE-532)
 * Fixes: Improper Output Neutralization for Logs (CWE-117)
 *
 * Security Features:
 * - Sensitive data sanitization
 * - Log level management
 * - Rate limiting for error logs
 * - Security event tracking
 * - Production-safe logging
 */

const fs = require("fs");
const path = require("path");

class SecureLogger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.environment = process.env.NODE_ENV || "development";
    this.logDirectory = process.env.LOG_DIR || "./logs";

    // Create logs directory if it doesn't exist
    this.ensureLogDirectory();

    // Rate limiting for repeated errors
    this.errorCounts = new Map();
    this.resetInterval = 60000; // 1 minute

    // Security event tracking
    this.securityEvents = [];

    // Start periodic cleanup
    this.startCleanupInterval();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.error("Failed to create log directory:", error.message);
    }
  }

  /**
   * Sanitize sensitive data from log messages
   */
  sanitizeData(data) {
    if (!data) return data;

    const sensitivePatterns = [
      // Passwords
      /password["\s]*[:=]["\s]*[^,}\s]+/gi,
      /pwd["\s]*[:=]["\s]*[^,}\s]+/gi,

      // Tokens and Keys
      /token["\s]*[:=]["\s]*[^,}\s]+/gi,
      /jwt["\s]*[:=]["\s]*[^,}\s]+/gi,
      /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
      /api[_-]?key["\s]*[:=]["\s]*[^,}\s]+/gi,
      /secret["\s]*[:=]["\s]*[^,}\s]+/gi,

      // Credit Cards
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,

      // Social Security Numbers
      /\b\d{3}-?\d{2}-?\d{4}\b/g,

      // Email addresses (partial sanitization)
      /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,

      // Phone numbers
      /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
    ];

    let sanitized =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);

    sensitivePatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, (match) => {
        if (match.includes("@")) {
          // Partial email masking
          return match.replace(/^([^@]{2})[^@]*(@.*)$/, "$1***$2");
        }
        return "[REDACTED]";
      });
    });

    // Additional sanitization for objects
    if (typeof data === "object" && data !== null) {
      try {
        const obj = JSON.parse(sanitized);
        this.sanitizeObject(obj);
        return JSON.stringify(obj, null, 2);
      } catch (error) {
        return sanitized;
      }
    }

    return sanitized;
  }

  /**
   * Recursively sanitize object properties
   */
  sanitizeObject(obj) {
    const sensitiveKeys = [
      "password",
      "pwd",
      "token",
      "jwt",
      "secret",
      "key",
      "apikey",
      "api_key",
      "auth",
      "authorization",
      "bearer",
      "ssn",
      "social",
      "credit",
      "card",
      "ccn",
    ];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();

        if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
          obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          this.sanitizeObject(obj[key]);
        }
      }
    }
  }

  /**
   * Rate limiting for error messages
   */
  isRateLimited(message) {
    const now = Date.now();
    const key = this.hashMessage(message);

    if (!this.errorCounts.has(key)) {
      this.errorCounts.set(key, { count: 1, firstSeen: now, lastSeen: now });
      return false;
    }

    const errorInfo = this.errorCounts.get(key);

    // Reset count if enough time has passed
    if (now - errorInfo.firstSeen > this.resetInterval) {
      this.errorCounts.set(key, { count: 1, firstSeen: now, lastSeen: now });
      return false;
    }

    errorInfo.count++;
    errorInfo.lastSeen = now;

    // Rate limit after 5 occurrences within the interval
    return errorInfo.count > 5;
  }

  /**
   * Simple hash for message deduplication
   */
  hashMessage(message) {
    let hash = 0;
    const str = message.substring(0, 100); // Use first 100 chars for efficiency
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Format log message with metadata
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitizeData(message);
    const sanitizedMetadata = this.sanitizeData(metadata);

    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message: sanitizedMessage,
      environment: this.environment,
      pid: process.pid,
      ...sanitizedMetadata,
    });
  }

  /**
   * Write log to file (production only)
   */
  writeToFile(level, message) {
    if (this.environment === "production") {
      try {
        const logFile = path.join(this.logDirectory, `${level}.log`);
        const logEntry = `${message}\n`;

        fs.appendFileSync(logFile, logEntry);
      } catch (error) {
        console.error("Failed to write to log file:", error.message);
      }
    }
  }

  /**
   * Log info message
   */
  info(message, metadata = {}) {
    const formatted = this.formatMessage("info", message, metadata);

    if (this.environment === "development") {
      console.log(`${formatted}`);
    }

    this.writeToFile("info", formatted);
  }

  /**
   * Log warning message
   */
  warn(message, metadata = {}) {
    const formatted = this.formatMessage("warn", message, metadata);

    console.warn(`⚠️  ${formatted}`);
    this.writeToFile("warn", formatted);
  }

  /**
   * Log error message with rate limiting
   */
  error(message, metadata = {}) {
    const sanitizedMessage = this.sanitizeData(message);

    if (this.isRateLimited(sanitizedMessage)) {
      // Log rate limiting message occasionally
      if (Math.random() < 0.1) {
        const rateLimitMsg = this.formatMessage(
          "warn",
          "Error message rate limited (similar errors occurring frequently)",
          { originalMessage: sanitizedMessage.substring(0, 100) }
        );
        console.warn(`${rateLimitMsg}`);
      }
      return;
    }

    const formatted = this.formatMessage("error", sanitizedMessage, metadata);
    console.error(`❌ ${formatted}`);
    this.writeToFile("error", formatted);
  }

  /**
   * Log security event
   */
  security(event, details = {}) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      event,
      details: this.sanitizeData(details),
      severity: details.severity || "medium",
    };

    // Store for analysis
    this.securityEvents.push(securityEvent);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    const formatted = this.formatMessage(
      "security",
      `Security Event: ${event}`,
      securityEvent
    );
    console.warn(`${formatted}`);
    this.writeToFile("security", formatted);
  }

  /**
   * Log debug message (development only)
   */
  debug(message, metadata = {}) {
    if (this.environment === "development" && this.logLevel === "debug") {
      const formatted = this.formatMessage("debug", message, metadata);
      console.log(`🐛 ${formatted}`);
    }
  }

  /**
   * Log HTTP request (with sanitization)
   */
  request(req, res) {
    const sanitizedReq = {
      method: req.method,
      url: this.sanitizeData(req.originalUrl || req.url),
      ip: req.ip || req.connection?.remoteAddress || "unknown",
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      responseStatus: res.statusCode,
      responseTime: res.get("X-Response-Time") || "unknown",
    };

    this.info("HTTP Request", sanitizedReq);

    // Log suspicious activity
    if (this.isSuspiciousRequest(req)) {
      this.security("Suspicious Request Detected", {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        severity: "high",
      });
    }
  }

  /**
   * Detect potentially suspicious requests
   */
  isSuspiciousRequest(req) {
    const suspiciousPatterns = [
      /[<>'"&]/g, // Potential XSS
      /union.*select/i, // SQL injection
      /script.*src/i, // Script injection
      /javascript:/i, // JS protocol injection
      /\.\.\/\.\.\//g, // Path traversal
    ];

    const url = req.originalUrl || req.url || "";
    const userAgent = req.get("User-Agent") || "";

    return suspiciousPatterns.some(
      (pattern) => pattern.test(url) || pattern.test(userAgent)
    );
  }

  /**
   * Get security events summary
   */
  getSecuritySummary() {
    const summary = {
      totalEvents: this.securityEvents.length,
      recentEvents: this.securityEvents.slice(-10),
      eventTypes: {},
    };

    this.securityEvents.forEach((event) => {
      summary.eventTypes[event.event] =
        (summary.eventTypes[event.event] || 0) + 1;
    });

    return summary;
  }

  /**
   * Start periodic cleanup
   */
  startCleanupInterval() {
    setInterval(() => {
      // Clear old rate limiting data
      const now = Date.now();
      for (const [key, errorInfo] of this.errorCounts.entries()) {
        if (now - errorInfo.lastSeen > this.resetInterval * 5) {
          this.errorCounts.delete(key);
        }
      }

      // Log cleanup status (debug only)
      this.debug("Logger cleanup completed", {
        errorCountsSize: this.errorCounts.size,
        securityEventsCount: this.securityEvents.length,
      });
    }, 300000); // 5 minutes
  }
}

// Create singleton instance
const logger = new SecureLogger();

module.exports = logger;
