import React, { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useInventory } from "./InventoryContext";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
import { useTheme } from "./ThemeContext";
import { QRCodeSVG } from "qrcode.react";
import Webcam from "react-webcam";

const ProductCreator = () => {
  const { inventory, addToInventory } = useInventory();
  const [product, setProduct] = useState({
    id: "",
    name: "",
    price: "",
    quantity: "",
    codeType: "qrcode",
    photo: null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { isDarkMode } = useTheme();
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!product.name.trim()) {
      setError("Product name is required");
      return false;
    }
    if (isNaN(parseFloat(product.price)) || parseFloat(product.price) <= 0) {
      setError("Please enter a valid price");
      return false;
    }
    if (isNaN(parseInt(product.quantity)) || parseInt(product.quantity) < 0) {
      setError("Please enter a valid quantity");
      return false;
    }
    if (
      inventory.some(
        (item) => item.name.toLowerCase() === product.name.trim().toLowerCase()
      )
    ) {
      setError("A product with this name already exists");
      return false;
    }
    return true;
  };

  const createProduct = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) return;

    const newProduct = {
      id: uuidv4(),
      name: product.name.trim(),
      price: parseFloat(product.price),
      quantity: parseInt(product.quantity),
      codeType: product.codeType,
      photo: product.photo,
    };

    try {
      await addToInventory(newProduct);
      setProduct({
        name: "",
        price: "",
        quantity: "",
        codeType: "qrcode",
        photo: null,
      });
      setSuccess(true);
    } catch (error) {
      setError("Failed to create product. Please try again.");
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setProduct((prevProduct) => ({ ...prevProduct, photo: imageSrc }));
    setShowCamera(false);
  };

  const renderProductCode = () => {
    const value = product.name || "Product Name";
    switch (product.codeType) {
      case "qrcode":
        return <QRCodeSVG value={value} size={128} />;
      case "code128":
        return (
          <QRCodeSVG value={value} size={128} renderAs="svg" type="code128" />
        );
      case "ean13":
        return (
          <QRCodeSVG
            value={value.padEnd(13, "0").slice(0, 13)}
            size={128}
            renderAs="svg"
            type="ean13"
          />
        );
      default:
        return <QRCodeSVG value={value} size={128} />;
    }
  };

  return (
    <div
      className={`p-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}
    >
      <h2 className="text-2xl font-bold mb-4">Create New Product</h2>
      <form onSubmit={createProduct}>
        <div className="mb-4">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            value={product.name}
            onChange={handleChange}
            placeholder="Enter product name"
            className={isDarkMode ? "bg-gray-700 text-white" : "bg-white"}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            name="price"
            type="number"
            value={product.price}
            onChange={handleChange}
            placeholder="Enter product price"
            min="0.01"
            step="0.01"
            className={isDarkMode ? "bg-gray-700 text-white" : "bg-white"}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={product.quantity}
            onChange={handleChange}
            placeholder="Enter product quantity"
            min="0"
            step="1"
            className={isDarkMode ? "bg-gray-700 text-white" : "bg-white"}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="codeType">Code Type</Label>
          <select
            id="codeType"
            name="codeType"
            value={product.codeType}
            onChange={handleChange}
            className={`w-full p-2 rounded-md ${
              isDarkMode ? "bg-gray-700 text-white" : "bg-white"
            }`}
          >
            <option value="qrcode">QR Code</option>
            <option value="code128">Code 128</option>
            <option value="ean13">EAN-13</option>
          </select>
        </div>
        <div className="mb-4">
          <Label>Product Code Preview</Label>
          <div className="mt-2">{renderProductCode()}</div>
        </div>
        <div className="mb-4">
          <Label>Product Photo</Label>
          {showCamera ? (
            <div>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full"
              />
              <Button onClick={capturePhoto} className="mt-2">
                Capture Photo
              </Button>
            </div>
          ) : (
            <div>
              {product.photo ? (
                <img
                  src={product.photo}
                  alt="Product"
                  className="w-full mb-2"
                />
              ) : (
                <Button onClick={() => setShowCamera(true)} className="mt-2">
                  Take Photo
                </Button>
              )}
            </div>
          )}
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>Product created successfully!</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full">
          Create Product
        </Button>
      </form>
    </div>
  );
};

export default ProductCreator;
