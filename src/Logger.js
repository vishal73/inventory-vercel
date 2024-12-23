const { addItem } = require("./database");

const Logger = {
  async _storeLog(level, message) {
    try {
      await addItem(
        {
          level,
          message,
          timestamp: new Date().toISOString(),
          source: "client",
          type: "log",
        },
        "log",
        true
      ); // true flag indicates to store in backup DB
    } catch (error) {
      console.error("Failed to store log in database:", error);
    }
  },

  debug: (message) => {
    if (process.env.REACT_APP_DEBUG === "true") {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`);
      Logger._storeLog("debug", message);
    }
  },

  info: (message) => {
    console.info(`[INFO] ${new Date().toISOString()}: ${message}`);
    Logger._storeLog("info", message);
  },

  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    Logger._storeLog("warn", message);
  },

  error: (message) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    Logger._storeLog("error", message);
  },
};

export default Logger;
