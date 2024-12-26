import api from "./services/api";

const Logger = {
  /**
   * Store log in database through API
   * @param {string} level - Log level (debug, info, warn, error)
   * @param {string|object} message - Log message or object
   * @param {object} context - Additional context for the log
   * @returns {Promise<void>}
   */
  async _storeLog(level, message, context = {}) {
    try {
      const logEntry = {
        level,
        message:
          typeof message === "object" ? JSON.stringify(message) : message,
        timestamp: new Date().toISOString(),
        source: "client",
        type: "log",
        context: {
          ...context,
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: localStorage.getItem("userId") || "anonymous",
        },
      };

      // await api.post("/logs", logEntry);
      console.log("Log entry:", logEntry);
    } catch (error) {
      // Fallback to console if API fails
      console.error("Failed to store log in database:", error);

      // Attempt to store in local storage for later sync
      this._storeLogLocally(level, message, context);
    }
  },

  /**
   * Store log locally when API is unavailable
   * @param {string} level - Log level
   * @param {string|object} message - Log message
   * @param {object} context - Additional context
   */
  _storeLogLocally(level, message, context) {
    try {
      const logs = JSON.parse(localStorage.getItem("pendingLogs") || "[]");
      logs.push({
        level,
        message:
          typeof message === "object" ? JSON.stringify(message) : message,
        timestamp: new Date().toISOString(),
        context,
        retryCount: 0,
      });
      localStorage.setItem("pendingLogs", JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to store log locally:", error);
    }
  },

  /**
   * Sync pending logs to server
   * @returns {Promise<void>}
   */
  async syncPendingLogs() {
    try {
      const pendingLogs = JSON.parse(
        localStorage.getItem("pendingLogs") || "[]"
      );
      if (pendingLogs.length === 0) return;

      const promises = pendingLogs.map(async (log) => {
        try {
          await api.post("/logs", {
            level: log.level,
            message: log.message,
            timestamp: log.timestamp,
            source: "client",
            type: "log",
            context: log.context,
            retryInfo: {
              count: log.retryCount,
              originalTimestamp: log.timestamp,
            },
          });
          return true;
        } catch (error) {
          log.retryCount += 1;
          return false;
        }
      });

      const results = await Promise.allSettled(promises);
      const remainingLogs = pendingLogs.filter(
        (_, index) =>
          results[index].status === "rejected" || results[index].value === false
      );

      localStorage.setItem("pendingLogs", JSON.stringify(remainingLogs));
    } catch (error) {
      console.error("Failed to sync pending logs:", error);
    }
  },

  /**
   * Debug level logging
   * @param {string|object} message - Log message
   * @param {object} context - Additional context
   */
  debug: (message, context = {}) => {
    if (process.env.REACT_APP_DEBUG === "true") {
      console.debug(`[DEBUG] ${new Date().toISOString()}: `, message);
      Logger._storeLog("debug", message, context);
    }
  },

  /**
   * Info level logging
   * @param {string|object} message - Log message
   * @param {object} context - Additional context
   */
  info: (message, context = {}) => {
    console.info(`[INFO] ${new Date().toISOString()}: `, message);
    Logger._storeLog("info", message, context);
  },

  /**
   * Warning level logging
   * @param {string|object} message - Log message
   * @param {object} context - Additional context
   */
  warn: (message, context = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()}: `, message);
    Logger._storeLog("warn", message, context);
  },

  /**
   * Error level logging
   * @param {string|object} message - Log message
   * @param {object} context - Additional context
   */
  error: (message, context = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()}: `, message);
    Logger._storeLog("error", message, {
      ...context,
      stack: message instanceof Error ? message.stack : undefined,
    });
  },

  /**
   * Performance logging
   * @param {string} label - Performance marker label
   * @param {object} metrics - Performance metrics
   */
  performance: (label, metrics) => {
    Logger._storeLog("performance", `Performance: ${label}`, {
      ...metrics,
      type: "performance",
    });
  },

  /**
   * User action logging
   * @param {string} action - User action description
   * @param {object} details - Action details
   */
  userAction: (action, details = {}) => {
    Logger._storeLog("info", `User Action: ${action}`, {
      ...details,
      type: "userAction",
    });
  },
};

// Set up periodic sync of pending logs
setInterval(() => {
  Logger.syncPendingLogs();
}, 5 * 60 * 1000); // Every 5 minutes

// Attempt to sync logs when coming back online
window.addEventListener("online", () => {
  Logger.syncPendingLogs();
});

export default Logger;
