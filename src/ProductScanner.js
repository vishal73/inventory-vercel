import React, { useState, useContext, useRef, useEffect } from "react";
import { useInventory } from "./InventoryContext";
import { Html5Qrcode } from "html5-qrcode";
import Logger from "./Logger";

const logger = Logger;
const ProductScanner = () => {
  const [scannedData, setScannedData] = useState("No data scanned");
  const { inventory, setInventory } = useInventory();
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const isScannerRunningRef = useRef(false);

  const handleScan = (data) => {
    logger.debug(`New scan detected: ${data}`);
    if (data) {
      setScannedData(data);
      const existingProductIndex = inventory.findIndex(
        (item) => item.id === data
      );
      if (existingProductIndex !== -1) {
        logger.debug(`Updating existing product quantity: ${data}`);
        const updatedInventory = [...inventory];
        updatedInventory[existingProductIndex].quantity += 1;
        setInventory(updatedInventory);
      } else {
        logger.debug(`Adding new scanned product: ${data}`);
        setInventory([
          ...inventory,
          { id: data, name: `Product ${data}`, quantity: 1 },
        ]);
      }
    }
  };

  useEffect(() => {
    logger.debug("Initializing QR scanner");
    const scanner = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    scanner
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScan(decodedText);
          setError(null);
          logger.debug("Successfully decoded QR code");
        },
        (err) => {
          setError(err);
          logger.error(`Scanner error: ${err.message}`);
        }
      )
      .catch((err) => {
        setError(err);
        logger.error(`Unable to start scanning: ${err.message}`);
      });

    return () => {
      logger.debug("Cleaning up scanner");
      if (isScannerRunningRef.current) {
        scanner.stop().catch((err) => {
          logger.error(`Error stopping scanner: ${err.message}`);
        });
      }
    };
  }, []);

  useEffect(() => {
    logger.debug(`Scanned data updated: ${scannedData}`);
  }, [scannedData]);

  return (
    <>
      <h2>Scan Product</h2>
      <div id="qr-reader" className="w-full aspect-[4/3] mb-4" />
      <p>Scanned Data: {scannedData}</p>
      {error && (
        <p className="text-red-500">
          {logger.error(`Scanner display error: ${error.message}`)}
          Error: {error.message}
        </p>
      )}
    </>
  );
};

export default ProductScanner;
