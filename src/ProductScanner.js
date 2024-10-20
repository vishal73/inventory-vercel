import React, { useState, useContext, useRef, useEffect } from "react";
import { useInventory } from "./InventoryContext";
import { Html5Qrcode } from "html5-qrcode";

const ProductScanner = () => {
  const [scannedData, setScannedData] = useState("No data scanned");
  const { inventory, setInventory } = useInventory();
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const isScannerRunningRef = useRef(false);

  const handleScan = (data) => {
    if (data) {
      setScannedData(data);
      const existingProductIndex = inventory.findIndex(
        (item) => item.id === data
      );
      if (existingProductIndex !== -1) {
        const updatedInventory = [...inventory];
        updatedInventory[existingProductIndex].quantity += 1;
        setInventory(updatedInventory);
      } else {
        setInventory([
          ...inventory,
          { id: data, name: `Product ${data}`, quantity: 1 },
        ]);
      }
    }
  };

  useEffect(() => {
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
        isScannerRunningRef.current = true;
      })
      .catch((err) => {
        setError(err);
        console.error("Unable to start scanning", err);
      });

    return () => {
      if (isScannerRunningRef.current) {
        scanner
          .stop()
          .catch((err) => console.error("Unable to stop scanning", err));
      }
    };
  }, []);

  return (
    <>
      <h2>Scan Product</h2>
      <div id="qr-reader" className="w-full aspect-[4/3] mb-4" />
      <p>Scanned Data: {scannedData}</p>
    </>
  );
};

export default ProductScanner;
