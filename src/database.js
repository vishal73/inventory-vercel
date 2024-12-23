// Database CRUD operations
const CosmosClient = require("@azure/cosmos").CosmosClient;

// const logger = require("./Logger");
const endpoint = process.env.REACT_APP_COSMOS_ENDPOINT;
const key = process.env.REACT_APP_COSMOS_KEY;
const databaseId = process.env.REACT_APP_COSMOS_DATABASE;
const containerId = process.env.REACT_APP_COSMOS_CONTAINER;
const backupDatabaseId = process.env.REACT_APP_COSMOS_BACKUP_DATABASE;
const backupContainerId = process.env.REACT_APP_COSMOS_BACKUP_CONTAINER;

const client = new CosmosClient({
  endpoint,
  key,
  userAgentSuffix: "SkaiAccessories",
});

const database = client.database(databaseId);
const container = database.container(containerId);

// Add backup database configuration
const backupDatabase = client.database(backupDatabaseId);
const backupContainer = backupDatabase.container(backupContainerId);

// Schema validation helpers
const requiredFields = {
  product: [
    "name",
    "description",
    "category",
    "type",
    "variant", // At least one variant is required
    "sellerId",
  ],
  order: ["products", "totalAmount", "totalQuantity"],
  analytics: ["date", "platformMetrics"],
  user: ["name", "email", "phone"],
};

const validateVariant = (variant) => {
  const requiredVariantFields = [
    "name",
    "color",
    "size",
    "material",
    "quantity",
    "price",
  ];

  for (const field of requiredVariantFields) {
    if (!(field in variant)) {
      throw new Error(`Missing required variant field: ${field}`);
    }
  }
};

const validateSchema = (item, type) => {
  const fields = requiredFields[type];
  if (!fields) {
    throw new Error(`Invalid type: ${type}`);
  }

  for (const field of fields) {
    if (!(field in item)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate variants for products
  if (type === "product" && item.variant) {
    validateVariant(item.variant);
  }
};

// Generic CRUD operations
async function addItem(item, type, logsOnly = false) {
  // logger.debug(`Adding new ${type}: ${JSON.stringify(item)}`);
  validateSchema(item, type);

  const itemToAdd = {
    ...item,
    id: item.id || generateId(),
    partitionKey: type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: item.createdBy || "system",
    updatedBy: item.updatedBy || "system",
    deleted: false,
  };

  try {
    // For logs, only store in backup database
    if (type === "log") {
      const { resource } = await backupContainer.items.upsert(itemToAdd);
      // logger.info(
      //   `Created ${type} in backup database with id: ${itemToAdd.id}`
      // );
      return resource;
    }

    // For all other items, store in both databases
    const [mainResult, backupResult] = await Promise.all([
      container.items.upsert(itemToAdd),
      backupContainer.items.upsert(itemToAdd),
    ]);

    // logger.info(`Created ${type} with id: ${itemToAdd.id} in both databases`);
    return mainResult.resource;
  } catch (error) {
    // logger.error(`Error creating ${type}: ${error.message}`);
    throw error;
  }
}

async function getItem(id, type) {
  try {
    const { resource } = await container.item(id, type).read();
    if (!resource || resource.deleted) {
      throw new Error(`${type} not found: ${id}`);
    }
    return resource;
  } catch (error) {
    // logger.error(`Error getting ${type}: ${error.message}`);
    throw error;
  }
}

async function queryItems(type, querySpec = null) {
  const defaultQuery = {
    query:
      "SELECT * FROM c WHERE c.partitionKey = @type AND c.deleted = @deleted",
    parameters: [
      { name: "@type", value: type },
      { name: "@deleted", value: false },
    ],
  };

  try {
    const { resources } = await container.items
      .query(querySpec || defaultQuery)
      .fetchAll();
    return resources;
  } catch (error) {
    // logger.error(`Error querying ${type}s: ${error.message}`);
    // throw error;
    console.error(`Error querying ${type}s: ${error.message}`);
    return [];
  }
}

async function deleteItem(id, type, userId = "system") {
  try {
    const item = await getItem(id, type);
    const updatedItem = {
      ...item,
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    // Delete (soft) in both databases
    await Promise.all([
      container.item(id, type).replace(updatedItem),
      backupContainer.item(id, type).replace(updatedItem),
    ]);

    // logger.info(`Deleted ${type} with id: ${id} in both databases`);
  } catch (error) {
    // logger.error(`Error deleting ${type}: ${error.message}`);
    throw error;
  }
}

async function updateItem(id, type, updates, userId = "system") {
  try {
    const item = await getItem(id, type);
    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    validateSchema(updatedItem, type);

    // Update in both databases
    await Promise.all([
      container.item(id, type).replace(updatedItem),
      backupContainer.item(id, type).replace(updatedItem),
    ]);

    // logger.info(`Updated ${type} with id: ${id} in both databases`);
    return updatedItem;
  } catch (error) {
    // logger.error(`Error updating ${type}: ${error.message}`);
    throw error;
  }
}

// Product operations
async function addProduct(product) {
  // logger.debug(`Adding new product: ${JSON.stringify(product)}`);

  try {
    validateProductCode(product.code);

    // Check if code already exists
    const { resources } = await container.items
      .query({
        query:
          "SELECT * FROM c WHERE c.partitionKey = 'product' AND c.code = @code",
        parameters: [{ name: "@code", value: product.code }],
      })
      .fetchAll();

    if (resources.length > 0) {
      // logger.error(`Product code already exists: ${product.code}`);
      throw new Error("Product code must be unique");
    }

    const productToAdd = {
      ...product,
      partitionKey: "product",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    const { resource } = await container.items.create(productToAdd);
    // logger.info(`Product added successfully: ${resource.id}`);
    return resource;
  } catch (error) {
    // logger.error(`Error adding product: ${error.message}`);
    throw error;
  }
}

async function getProduct(id) {
  return getItem(id, "product");
}

async function getProducts() {
  return queryItems("product");
}

async function updateProduct(id, updates, userId) {
  return updateItem(id, "product", updates, userId);
}

async function deleteProduct(id, userId) {
  return deleteItem(id, "product", userId);
}

// Order operations
async function addOrder(order) {
  return addItem(order, "order");
}

async function getOrder(id) {
  return getItem(id, "order");
}

async function getOrders() {
  return queryItems("order");
}

async function updateOrder(id, updates, userId) {
  return updateItem(id, "order", updates, userId);
}

async function deleteOrder(id, userId) {
  return deleteItem(id, "order", userId);
}

// Analytics operations
async function addAnalytics(analytics) {
  return addItem(analytics, "analytics");
}

async function getAnalytics(id) {
  return getItem(id, "analytics");
}

async function getAnalyticsByDate(startDate, endDate) {
  const querySpec = {
    query:
      "SELECT * FROM c WHERE c.partitionKey = 'analytics' AND c.date >= @startDate AND c.date <= @endDate",
    parameters: [
      { name: "@startDate", value: startDate },
      { name: "@endDate", value: endDate },
    ],
  };
  return queryItems("analytics", querySpec);
}

// User operations
async function addUser(user) {
  return addItem(user, "user");
}

async function getUser(id) {
  return getItem(id, "user");
}

async function getUserByEmail(email) {
  const querySpec = {
    query:
      "SELECT * FROM c WHERE c.partitionKey = 'user' AND c.email = @email AND c.deleted = @deleted",
    parameters: [
      { name: "@email", value: email },
      { name: "@deleted", value: false },
    ],
  };
  const users = await queryItems("user", querySpec);
  return users[0];
}

// Invoice operations
async function addInvoice(invoice) {
  return addItem(
    {
      ...invoice,
      type: "invoice",
      status: invoice.status || "pending",
      paymentStatus: invoice.paymentStatus || "pending",
      date: new Date().toISOString(),
    },
    "invoice"
  );
}

async function getInvoice(id) {
  return getItem(id, "invoice");
}

async function getInvoices() {
  return queryItems("invoice");
}

async function updateInvoice(id, updates, userId) {
  return updateItem(id, "invoice", updates, userId);
}

async function deleteInvoice(id, userId) {
  return deleteItem(id, "invoice", userId);
}

async function getInvoicesByDateRange(startDate, endDate) {
  // logger.debug(`Fetching invoices for date range: ${startDate} to ${endDate}`);

  const querySpec = {
    query:
      "SELECT * FROM c WHERE c.partitionKey = 'invoice' AND c.date >= @startDate AND c.date <= @endDate AND c.deleted = @deleted",
    parameters: [
      { name: "@startDate", value: startDate },
      { name: "@endDate", value: endDate },
      { name: "@deleted", value: false },
    ],
  };

  try {
    const results = await queryItems("invoice", querySpec);
    // logger.debug(`Retrieved ${results.length} invoices`);
    return results;
  } catch (error) {
    // logger.error(`Error fetching invoices by date range: ${error.message}`);
    throw error;
  }
}

// Helper function to generate unique IDs
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add validation for product codes
function validateProductCode(code) {
  // logger.debug(`Validating product code: ${code}`);

  // Check format (SKA-CAT-XXXXXX-XXXXXX)
  const codeRegex = /^SKA-[A-Z]{3}-\d{6}-[a-z0-9]{6}$/;
  if (!codeRegex.test(code)) {
    // logger.error(`Invalid code format: ${code}`);
    throw new Error("Invalid product code format");
  }

  return true;
}

module.exports = {
  // Product operations
  addProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,

  // Order operations
  addOrder,
  getOrder,
  getOrders,
  updateOrder,
  deleteOrder,

  // Analytics operations
  addAnalytics,
  getAnalytics,
  getAnalyticsByDate,

  // User operations
  addUser,
  getUser,
  getUserByEmail,

  // Invoice operations
  addInvoice,
  getInvoice,
  getInvoices,
  updateInvoice,
  deleteInvoice,
  getInvoicesByDateRange,

  // Generic operations
  addItem,
  getItem,
  queryItems,
  updateItem,
  deleteItem,
};
