import React, { createContext, useState, useEffect, useContext } from "react";
import api from "./services/api";
import logger from "./Logger";

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInventory();
    fetchSalesHistory();
  }, []);

  const fetchInventory = async () => {
    logger.debug("Starting inventory fetch");
    try {
      setLoading(true);
      logger.debug("Fetching products from API");
      const products = await api.get("/products");
      logger.debug(`Retrieved ${products.length} products`);
      setInventory(products);
      logger.info("Inventory fetched successfully");
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      logger.error(`Error fetching inventory: ${error.message}`);
    } finally {
      setLoading(false);
      logger.debug("Completed inventory fetch");
    }
  };

  const fetchSalesHistory = async () => {
    try {
      const orders = await api.get("/invoices");
      setSalesHistory(orders);
      logger.info("Sales history fetched successfully");
    } catch (error) {
      logger.error(`Error fetching sales history: ${error.message}`);
    }
  };

  const addToInventory = async (product) => {
    logger.debug(`Adding product to inventory: ${JSON.stringify(product)}`);
    try {
      const newProduct = await api.post("/products", {
        ...product,
        createdBy: "user", // Replace with actual user ID when auth is implemented
      });
      setInventory((prev) => [...prev, newProduct]);
      logger.info(`Product added successfully: ${newProduct.id}`);
      return newProduct;
    } catch (error) {
      logger.error(`Error adding product: ${error.message}`);
      throw error;
    }
  };

  const updateInventoryItem = async (updatedProduct) => {
    try {
      const result = await api.put(`/products/${updatedProduct.id}`, {
        ...updatedProduct,
        updatedBy: "user", // Replace with actual user ID when auth is implemented
      });
      setInventory((prev) =>
        prev.map((item) => (item.id === result.id ? result : item))
      );
      logger.info(`Product updated successfully: ${result.id}`);
      return result;
    } catch (error) {
      logger.error(`Error updating product: ${error.message}`);
      throw error;
    }
  };

  const removeFromInventory = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      setInventory((prev) => prev.filter((item) => item.id !== productId));
      logger.info(`Product deleted successfully: ${productId}`);
    } catch (error) {
      logger.error(`Error deleting product: ${error.message}`);
      throw error;
    }
  };

  const addToInvoice = (product) => {
    setCurrentInvoice((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    logger.info(`Product added to invoice: ${product.id}`);
  };

  const removeFromInvoice = (productId) => {
    setCurrentInvoice((prev) => prev.filter((item) => item.id !== productId));
    logger.info(`Product removed from invoice: ${productId}`);
  };

  const clearInvoice = () => {
    setCurrentInvoice([]);
    logger.info("Invoice cleared");
  };

  const addToSalesHistory = async (invoice) => {
    try {
      const order = await api.post("/invoices", {
        products: invoice.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity,
        })),
        totalAmount: invoice.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
        totalQuantity: invoice.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        orderStatus: "completed",
        paymentStatus: "completed",
        paymentMethod: "cash",
        createdBy: "user", // Replace with actual user ID when auth is implemented
      });
      setSalesHistory((prev) => [...prev, order]);
      logger.info(`Order added to sales history: ${order.id}`);
      return order;
    } catch (error) {
      logger.error(`Error adding order to sales history: ${error.message}`);
      throw error;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        currentInvoice,
        salesHistory,
        loading,
        error,
        addToInventory,
        updateInventoryItem,
        removeFromInventory,
        addToInvoice,
        removeFromInvoice,
        clearInvoice,
        addToSalesHistory,
        refreshInventory: fetchInventory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
