import React, { createContext, useState, useEffect } from "react";
import Logger from "./Logger";

const logger = Logger;
export const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
  const [currentInvoice, setCurrentInvoice] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);

  // Wrap state updates with logging
  const updateCurrentInvoice = (invoice) => {
    logger.debug(`Updating current invoice: ${JSON.stringify(invoice)}`);
    setCurrentInvoice(invoice);
  };

  const updateSalesHistory = (history) => {
    logger.debug(`Updating sales history. New entries: ${history.length}`);
    setSalesHistory(history);
  };

  useEffect(() => {
    logger.debug("InvoiceProvider mounted");
    return () => {
      logger.debug("InvoiceProvider unmounted");
    };
  }, []);

  return (
    <InvoiceContext.Provider
      value={{
        currentInvoice,
        setCurrentInvoice: updateCurrentInvoice,
        salesHistory,
        setSalesHistory: updateSalesHistory,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
