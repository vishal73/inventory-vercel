import React, { createContext, useState, useEffect, useContext } from "react";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "./mongodb";

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

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const products = await getProducts();
      setInventory(products);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const addToInventory = (product) => {
    setInventory((prev) => [...prev, product]);
  };

  const updateInventoryItem = (updatedProduct) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === updatedProduct.id ? updatedProduct : item
      )
    );
  };

  const removeFromInventory = (productId) => {
    setInventory((prev) => prev.filter((item) => item.id !== productId));
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
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromInvoice = (productId) => {
    setCurrentInvoice((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearInvoice = () => {
    setCurrentInvoice([]);
  };

  const addToSalesHistory = (invoice) => {
    setSalesHistory((prev) => [...prev, invoice]);
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        setInventory,
        currentInvoice,
        setCurrentInvoice,
        salesHistory,
        setSalesHistory,
        addToInventory,
        updateInventoryItem,
        removeFromInventory,
        addToInvoice,
        removeFromInvoice,
        clearInvoice,
        addToSalesHistory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
