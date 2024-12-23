const config = {
  endpoint: process.env.ACCOUNT_HOST,
  key: process.env.ACCOUNT_KEY,
  database: {
    id: process.env.COSMOS_DATABASE,
    backupId: process.env.COSMOS_BACKUP_DATABASE,
  },
  container: {
    id: process.env.COSMOS_CONTAINER,
    backupId: process.env.COSMOS_BACKUP_CONTAINER,
  },
};

module.exports = config;
