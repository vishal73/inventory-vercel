import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useInventory } from "./InventoryContext";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useTheme } from "./ThemeContext";
import { saveInvoiceToDatabase, printInvoice } from "./InvoiceUtils";
import { PlusCircle, MinusCircle, X, Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription } from "./components/ui/alert";
import Logger from "./Logger";
import { BrowserQRCodeReader } from "@zxing/browser";

const logger = Logger;

const isScanningSupported = () => {
  return true;
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

const InvoiceGenerator = ({ isActive, savedState, onStateChange }) => {
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
  const [buyerDetails, setBuyerDetails] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const scannerRef = useRef(null);
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [isScannerSupported, setIsScannerSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Define default state
  const defaultState = {
    invoice: {
      customerName: "",
      customerAddress: "",
      customerPhone: "",
      customerEmail: "",
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      date: new Date().toISOString().split("T")[0],
      invoiceNumber: generateInvoiceNumber(), // You'll need to implement this
      notes: "",
    },
    selectedProducts: [],
    formRef: React.createRef(),
  };

  // Initialize state with savedState or default values
  const [invoiceState, setInvoiceState] = useState(() => ({
    ...defaultState,
    ...(savedState || {}),
  }));

  // Use useRef to track if this is the initial mount
  const isInitialMount = useRef(true);

  // Update parent only when invoiceState changes and not on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isActive) {
      // Debounce the state update to prevent rapid changes
      const timeoutId = setTimeout(() => {
        // Clean the state before sending it to parent
        const cleanState = { ...invoiceState };
        delete cleanState.formRef; // Remove non-serializable data
        onStateChange(cleanState);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [invoiceState, isActive, onStateChange]);

  // Initialize form state from savedState only once on mount
  useEffect(() => {
    if (savedState && isInitialMount.current) {
      setInvoiceState((prev) => ({
        ...prev,
        ...savedState,
        formRef: React.createRef(), // Rehydrate the ref
      }));
    }
  }, []); // Empty dependency array for mount-only effect

  const handleFormChange = (updates) => {
    setInvoiceState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  useEffect(() => {
    // Check browser support on mount
    setIsScannerSupported(isScanningSupported());
  }, []);

  const handleScan = async (data) => {
    if (data) {
      setScannedProduct(data);
      await addProductToInvoice(data);

      // Pause scanning briefly after successful scan
      if (isScanning) {
        setIsScanning(false);
        setTimeout(() => {
          setIsScanning(true);
        }, 1000);
      }
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
    if (isActive && isScannerSupported) {
      logger.debug("Invoice tab is active, starting scanner");
      startScanning();
    } else {
      logger.debug("Invoice tab is inactive, stopping scanner");
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive, isScannerSupported]);

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      logger.debug("Stopping QR scanner");
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        logger.debug("QR scanner stopped successfully");
      } catch (err) {
        logger.error(`Error stopping QR scanner: ${err.message}`);
      }
      scannerRef.current = null;
    }
  };

  const startScanning = async () => {
    try {
      const codeReader = new BrowserQRCodeReader();

      // Try to get available video devices
      const videoInputDevices =
        await BrowserQRCodeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        setError("No camera found");
        return;
      }

      // Use the first available camera
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Start continuous scanning
      const controls = await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScan(result.text);
          }
          if (error && error?.message?.includes("NotFound")) {
            // Ignore "NotFound" errors as they're expected during scanning
            return;
          }
        }
      );

      setIsScanning(true);

      // Store controls for cleanup
      return () => {
        controls.stop();
        setIsScanning(false);
      };
    } catch (error) {
      logger.error("Error starting scanner:", error);
      setError("Could not start scanner. Please use file upload instead.");
    }
  };

  // Handle file upload for QR code scanning
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const codeReader = new BrowserQRCodeReader();
      const img = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const result = await codeReader.decodeFromImageElement(canvas);
      if (result) {
        handleScan(result.text);
      }
    } catch (error) {
      logger.error("Error reading QR code from file:", error);
      setError(
        "Could not read QR code from image. Please try another image or enter code manually."
      );
    }

    // Reset file input
    event.target.value = "";
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

  const calculateGST = (subtotal) => {
    return subtotal * 0.18; // 18% GST
  };

  const validateForm = () => {
    const errors = {};

    if (!buyerDetails.buyerName.trim()) {
      errors.buyerName = "Buyer name is required";
    }

    if (!buyerDetails.buyerEmail.trim()) {
      errors.buyerEmail = "Buyer email is required";
    } else if (!/\S+@\S+\.\S+/.test(buyerDetails.buyerEmail)) {
      errors.buyerEmail = "Invalid email format";
    }

    if (!buyerDetails.buyerPhone.trim()) {
      errors.buyerPhone = "Buyer phone is required";
    } else if (!/^\d{10}$/.test(buyerDetails.buyerPhone)) {
      errors.buyerPhone = "Invalid phone number (10 digits required)";
    }

    if (currentInvoice.length === 0) {
      errors.invoice = "At least one item is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const retryOperation = async (operation) => {
    let lastError;
    for (let i = 0; i <= retryCount; i++) {
      try {
        const result = await operation();
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        lastError = error;
        logger.warn(
          `Retry ${i + 1}/${retryCount + 1} failed: ${error.message}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
    throw lastError;
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const generateInvoice = async () => {
    logger.debug("Starting invoice generation");

    if (!validateForm()) {
      logger.debug("Form validation failed");
      showError("Please fix the form errors before proceeding");
      return;
    }

    setLoading(true);
    try {
      logger.debug("Calculating invoice totals");
      const subtotal = currentInvoice.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      const gst = calculateGST(subtotal);
      const totalAmount = subtotal + gst;

      logger.debug(
        `Invoice totals: Subtotal=${subtotal}, GST=${gst}, Total=${totalAmount}`
      );

      const newInvoice = {
        id: uuidv4(),
        sellerId: "default-seller",
        ...buyerDetails,
        products: currentInvoice.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          discount: 0,
          totalPrice: item.price * item.quantity,
        })),
        gst,
        totalAmount,
        totalQuantity: currentInvoice.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        paymentStatus: "pending",
        paymentMethod,
        orderStatus: "processing",
      };

      logger.debug("Saving invoice to database");
      const savedInvoice = await retryOperation(() =>
        saveInvoiceToDatabase(newInvoice)
      );

      logger.debug("Updating inventory quantities");
      await Promise.all([
        retryOperation(() => addToSalesHistory(savedInvoice)),
        ...currentInvoice.map((item) => {
          const inventoryItem = inventory.find(
            (invItem) => invItem.id === item.id
          );
          if (inventoryItem) {
            return retryOperation(() =>
              updateInventoryItem({
                ...inventoryItem,
                quantity: inventoryItem.quantity - item.quantity,
              })
            );
          }
        }),
      ]);

      logger.debug("Printing invoice");
      await retryOperation(() => printInvoice(savedInvoice.id));

      clearInvoice();
      setScannedProduct(null);
      setBuyerDetails({
        buyerName: "",
        buyerEmail: "",
        buyerPhone: "",
      });

      showSuccess(`Invoice #${savedInvoice.id} generated successfully!`);
      logger.info(`Invoice generated successfully: ${savedInvoice.id}`);
    } catch (error) {
      showError(`Error: ${error.message}. Please try again.`);
      logger.error(`Error generating invoice: ${error.message}`);

      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        await generateInvoice(); // Retry the operation
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}
    >
      <h2 className="text-2xl font-bold mb-4">Generate Invoice</h2>

      {/* Scanner Support Warning */}
      {!isScannerSupported && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertDescription>
            QR scanning is not supported in this browser. Please use the manual
            input option.
          </AlertDescription>
        </Alert>
      )}

      {/* Scanner Section */}
      <div className="mb-4">
        {/* Video element for QR scanning */}
        <video
          ref={videoRef}
          className="w-full max-w-[500px] mb-4"
          hidden={!isScanning}
        />

        {/* Scanner Controls */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() =>
              isScanning ? setIsScanning(false) : startScanning()
            }
          >
            {isScanning ? "Stop Scanner" : "Start Scanner"}
          </Button>

          {/* File Upload Button */}
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload QR Code
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Success and Error Messages */}
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Manual Input Section */}
      <div className="mb-4 flex gap-2">
        <Input
          type="text"
          placeholder="Enter Product ID manually"
          value={manualProductId}
          onChange={(e) => setManualProductId(e.target.value)}
        />
        <Button onClick={handleManualAdd}>Add</Button>
      </div>

      {/* Buyer Details Form */}
      <div className="mb-4 grid gap-4">
        <div>
          <Input
            type="text"
            placeholder="Buyer Name"
            value={buyerDetails.buyerName}
            onChange={(e) =>
              setBuyerDetails((prev) => ({
                ...prev,
                buyerName: e.target.value,
              }))
            }
            className={formErrors.buyerName ? "border-red-500" : ""}
          />
          {formErrors.buyerName && (
            <p className="text-red-500 text-sm mt-1">{formErrors.buyerName}</p>
          )}
        </div>

        <div>
          <Input
            type="email"
            placeholder="Buyer Email"
            value={buyerDetails.buyerEmail}
            onChange={(e) =>
              setBuyerDetails((prev) => ({
                ...prev,
                buyerEmail: e.target.value,
              }))
            }
            className={formErrors.buyerEmail ? "border-red-500" : ""}
          />
          {formErrors.buyerEmail && (
            <p className="text-red-500 text-sm mt-1">{formErrors.buyerEmail}</p>
          )}
        </div>

        <div>
          <Input
            type="tel"
            placeholder="Buyer Phone"
            value={buyerDetails.buyerPhone}
            onChange={(e) =>
              setBuyerDetails((prev) => ({
                ...prev,
                buyerPhone: e.target.value,
              }))
            }
            className={formErrors.buyerPhone ? "border-red-500" : ""}
          />
          {formErrors.buyerPhone && (
            <p className="text-red-500 text-sm mt-1">{formErrors.buyerPhone}</p>
          )}
        </div>
        {/* <select
          className="form-select"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
        </select> */}
      </div>

      {/* Current Invoice Items */}
      {currentInvoice.length > 0 && (
        <div className="border p-4 rounded-lg mb-4">
          <h3 className="font-bold mb-2">Current Items</h3>
          {currentInvoice.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between mb-2"
            >
              <span>{item.name}</span>
              <div className="flex items-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(item.id, -1)}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span className="mx-2">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(item.id, 1)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => handlePriceChange(item.id, e.target.value)}
                  className="w-20 mx-2"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeFromInvoice(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="mt-4 text-right">
            <p className="mb-1">
              Subtotal: ₹
              {currentInvoice.reduce(
                (total, item) => total + item.price * item.quantity,
                0
              )}
            </p>
            <p className="mb-1">
              GST (18%): ₹
              {calculateGST(
                currentInvoice.reduce(
                  (total, item) => total + item.price * item.quantity,
                  0
                )
              )}
            </p>
            <p className="font-bold">
              Total: ₹
              {currentInvoice.reduce(
                (total, item) => total + item.price * item.quantity,
                0
              ) +
                calculateGST(
                  currentInvoice.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                  )
                )}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button onClick={generateInvoice} className="mr-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Invoice"
          )}
        </Button>
        <Button onClick={clearInvoice} variant="outline" disabled={loading}>
          Reset Invoice
        </Button>
      </div>
    </div>
  );
};

// Helper function to generate invoice number (implement as needed)
const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

export default InvoiceGenerator;
