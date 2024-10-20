import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useInventory } from "./InventoryContext";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Html5Qrcode } from "html5-qrcode";
import { useTheme } from "./ThemeContext";
import { saveInvoiceToDatabase, printInvoice } from "./invoice";
import { PlusCircle, MinusCircle, X } from "lucide-react";

const InvoiceGenerator = () => {
  const {
    inventory,
    currentInvoice,
    addToInvoice,
    removeFromInvoice,
    clearInvoice,
    addToSalesHistory,
    updateInventoryItem,
  } = useInventory();
  const [scannedProduct, setScannedProduct] = useState(null);
  const [error, setError] = useState(null);
  const [manualProductId, setManualProductId] = useState("");
  const scannerRef = useRef(null);
  const { isDarkMode } = useTheme();

  const handleScan = (data) => {
    if (data) {
      setScannedProduct(data);
      addProductToInvoice(data);
      setTimeout(() => {
        scannerRef.current.pause();
      }, 1000);
      scannerRef.current.resume();
    }
  };

  const addProductToInvoice = (productId) => {
    const product = inventory?.find(
      (item) => item.name === productId || item.id === productId
    );
    if (product) {
      addToInvoice(product);
    }
  };

  const handleManualAdd = () => {
    if (manualProductId) {
      addProductToInvoice(manualProductId);
      setManualProductId("");
    }
  };

  useEffect(() => {
    startScanning();
  }, []);

  const startScanning = () => {
    const scanner = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    scanner
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScan(decodedText);
          setError(null);
        },
        (err) => {
          setError(err);
        }
      )
      .then(() => {
        scannerRef.current = scanner;
      })
      .catch((err) => {
        setError(err);
        console.error("Unable to start scanning", err);
      });
  };

  const handleQuantityChange = (id, change) => {
    const updatedInvoice = currentInvoice.map((item) => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    clearInvoice();
    updatedInvoice.forEach((item) => addToInvoice(item));
  };

  const handlePriceChange = (id, newPrice) => {
    const updatedInvoice = currentInvoice.map((item) => {
      if (item.id === id) {
        return { ...item, price: parseFloat(newPrice) || 0 };
      }
      return item;
    });
    clearInvoice();
    updatedInvoice.forEach((item) => addToInvoice(item));
  };

  const generateInvoice = async () => {
    if (!currentInvoice || currentInvoice.length === 0) {
      alert("Cannot generate an empty invoice");
      return;
    }

    const invoiceTotal = currentInvoice.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const newInvoice = {
      id: uuidv4(),
      items: currentInvoice,
      total: invoiceTotal,
      date: new Date().toISOString(),
    };

    try {
      await saveInvoiceToDatabase(newInvoice);
      addToSalesHistory(newInvoice);

      currentInvoice.forEach((item) => {
        const inventoryItem = inventory.find(
          (invItem) => invItem.id === item.id
        );
        if (inventoryItem) {
          updateInventoryItem({
            ...inventoryItem,
            quantity: inventoryItem.quantity - item.quantity,
          });
        }
      });

      await printInvoice(newInvoice);
      clearInvoice();
      setScannedProduct(null);
      startScanning();

      alert("Invoice generated, saved, and sent for printing!");
    } catch (error) {
      console.error("Error processing invoice:", error);
      alert("Error processing invoice. Please try again.");
    }
  };

  return (
    <div
      className={`p-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}
    >
      <h2 className="text-2xl font-bold mb-4">Generate Invoice</h2>
      <div id="qr-reader" className="w-full aspect-[4/3] mb-4" />
      <p className="mb-2">Scanned Product: {scannedProduct}</p>
      <div className="flex mb-4">
        <Input
          type="text"
          value={manualProductId}
          onChange={(e) => setManualProductId(e.target.value)}
          placeholder="Enter product name"
          className={`mr-2 ${
            isDarkMode ? "bg-gray-700 text-white" : "bg-white"
          }`}
        />
        <Button onClick={handleManualAdd} className="mr-2">
          Add to Invoice
        </Button>
        {/* <Button onClick={startScanning} disabled={isScanning}>
          {isScanning ? "Scanning..." : "Scan Item"}
        </Button> */}
      </div>
      <h3 className="text-xl font-semibold mb-2">Current Invoice</h3>
      {currentInvoice && currentInvoice.length > 0 ? (
        <div>
          {currentInvoice.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between mb-2 p-2 bg-gray-100 rounded"
            >
              <span>{item.name}</span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleQuantityChange(item.id, -1)}
                >
                  <MinusCircle size={16} />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(
                      item.id,
                      parseInt(e.target.value) - item.quantity
                    )
                  }
                  className="w-16 text-center"
                />
                <Button
                  size="sm"
                  onClick={() => handleQuantityChange(item.id, 1)}
                >
                  <PlusCircle size={16} />
                </Button>
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => handlePriceChange(item.id, e.target.value)}
                  className="w-24 text-right"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeFromInvoice(item.id)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
          <p className="text-lg font-semibold mb-4">
            Total: Rs.
            {currentInvoice.reduce(
              (total, item) => total + item.price * item.quantity,
              0
            )}
          </p>
        </div>
      ) : (
        <p className="mb-4">No items in the invoice.</p>
      )}
      <div className="flex space-x-2 mt-4">
        <Button onClick={generateInvoice} className="mr-2">
          Generate Invoice
        </Button>
        <Button onClick={clearInvoice} variant="outline">
          Reset Invoice
        </Button>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
