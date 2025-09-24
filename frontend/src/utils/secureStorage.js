/**
 * Secure Storage Utility
 * Fixes: Insecure Token Storage vulnerability
 *
 * Features:
 * - Token expiration management
 * - Automatic cleanup of expired tokens
 * - Input validation and error handling
 * - Protection against storage corruption
 */

class SecureStorage {
  /**
   * Store data with automatic expiration
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} expiresIn - Expiration time in milliseconds (default: 8 hours)
   */
  static setItem(key, value, expiresIn = 8 * 60 * 60 * 1000) {
    // 8 hours default
    try {
      // SECURITY: Validate inputs
      if (!key || typeof key !== "string") {
        throw new Error("Storage key must be a non-empty string");
      }

      if (value === undefined || value === null) {
        throw new Error("Storage value cannot be null or undefined");
      }

      //SECURITY: Create item with expiration
      const item = {
        value: value,
        expiry: new Date().getTime() + expiresIn,
        timestamp: new Date().getTime(),
        version: "1.0", // For future compatibility
      };

      localStorage.setItem(key, JSON.stringify(item));

      //SECURITY: Log storage event (without sensitive data)
      console.log(
        ` SecureStorage: Item stored with key "${key}" (expires in ${Math.round(
          expiresIn / (60 * 1000)
        )} minutes)`
      );
    } catch (error) {
      console.error("SecureStorage.setItem error:", error.message);
      throw new Error(`Failed to store item: ${error.message}`);
    }
  }

  /**
   * Retrieve data with automatic expiration check
   * @param {string} key - Storage key
   * @returns {any|null} - Stored value or null if expired/not found
   */
  static getItem(key) {
    try {
      // SECURITY: Validate input
      if (!key || typeof key !== "string") {
        console.warn("SecureStorage: Invalid key provided");
        return null;
      }

      const itemStr = localStorage.getItem(key);
      if (!itemStr) {
        return null;
      }

      const item = JSON.parse(itemStr);
      if (
        !item ||
        typeof item !== "object" ||
        !item.hasOwnProperty("value") ||
        !item.hasOwnProperty("expiry")
      ) {
        console.warn(
          "SecureStorage: Invalid item structure, removing corrupted data"
        );
        localStorage.removeItem(key);
        return null;
      }

      const now = new Date().getTime();

      // ✅ SECURITY: Check expiration
      if (now > item.expiry) {
        console.log(`SecureStorage: Item "${key}" expired, removing`);
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error("SecureStorage.getItem error:", error.message);
      // ✅ SECURITY: Remove corrupted data
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Remove specific item from storage
   * @param {string} key - Storage key
   */
  static removeItem(key) {
    try {
      if (!key || typeof key !== "string") {
        console.warn("SecureStorage: Invalid key provided for removal");
        return;
      }

      localStorage.removeItem(key);
      console.log(`SecureStorage: Item "${key}" removed`);
    } catch (error) {
      console.error("SecureStorage.removeItem error:", error.message);
    }
  }

  /**
   * Clear all storage data
   */
  static clear() {
    try {
      localStorage.clear();
      console.log("SecureStorage: All items cleared");
    } catch (error) {
      console.error("SecureStorage.clear error:", error.message);
    }
  }

  /**
   * Check if an item exists and is not expired
   * @param {string} key - Storage key
   * @returns {boolean} - True if item exists and is valid
   */
  static hasItem(key) {
    return this.getItem(key) !== null;
  }

  /**
   * Get item expiration time
   * @param {string} key - Storage key
   * @returns {Date|null} - Expiration date or null if not found
   */
  static getExpiration(key) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      return item.expiry ? new Date(item.expiry) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean up expired items from storage
   */
  static cleanupExpired() {
    try {
      const keys = Object.keys(localStorage);
      let cleanedCount = 0;

      keys.forEach((key) => {
        try {
          const itemStr = localStorage.getItem(key);
          if (!itemStr) return;

          const item = JSON.parse(itemStr);
          if (item && item.expiry && new Date().getTime() > item.expiry) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Remove corrupted items
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(
          `SecureStorage: Cleaned up ${cleanedCount} expired/corrupted items`
        );
      }
    } catch (error) {
      console.error("SecureStorage.cleanupExpired error:", error.message);
    }
  }

  /**
   * Extend expiration time for an existing item
   * @param {string} key - Storage key
   * @param {number} additionalTime - Additional time in milliseconds
   * @returns {boolean} - True if successfully extended
   */
  static extendExpiration(key, additionalTime = 8 * 60 * 60 * 1000) {
    try {
      const value = this.getItem(key);
      if (value === null) {
        return false;
      }

      this.setItem(key, value, additionalTime);
      return true;
    } catch (error) {
      console.error("SecureStorage.extendExpiration error:", error.message);
      return false;
    }
  }
}

// ✅ SECURITY: Auto-cleanup on page load
if (typeof window !== "undefined") {
  // Run cleanup when the module loads
  setTimeout(() => {
    SecureStorage.cleanupExpired();
  }, 1000);

  // Run cleanup periodically (every 10 minutes)
  setInterval(() => {
    SecureStorage.cleanupExpired();
  }, 10 * 60 * 1000);
}

export default SecureStorage;
