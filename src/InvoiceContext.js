import React, { createContext, useState } from "react";

export const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
  const [currentInvoice, setCurrentInvoice] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);

  return (
    <InvoiceContext.Provider
      value={{
        currentInvoice,
        setCurrentInvoice,
        salesHistory,
        setSalesHistory,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
