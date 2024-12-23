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
import { Loader2, Plus, Trash } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Barcode from "react-barcode";

import Logger from "./Logger";

const logger = Logger;
const CATEGORIES = [
  "earrings",
  "bracelets",
  "necklaces",
  "rings",
  "chains",
  "sets",
];

const TYPES = ["oxidized", "plated", "metallic"];

const MATERIALS = ["Material", "gold", "silver", "rose gold"];

const ProductCreator = () => {
  const { addToInventory, updateInventoryItem } = useInventory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { isDarkMode } = useTheme();
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const editingProduct = location.state?.product;

  const [product, setProduct] = useState(
    editingProduct || {
      name: "",
      description: "",
      images: [],
      codeType: "qrcode",
      code: "",
      category: CATEGORIES[0],
      type: TYPES[0],
      tags: [],
      variants: [],
      sellerId: "default-seller",
    }
  );

  const [currentVariant, setCurrentVariant] = useState({
    name: "",
    description: "",
    color: "",
    size: "",
    weight: "",
    material: MATERIALS[0],
    quantity: "",
    price: "",
    discount: "",
  });

  const [codeType, setCodeType] = useState("qrcode");
  const [generatedCode, setGeneratedCode] = useState("");

  const validateVariant = (variant) => {
    logger.debug(`Validating variant: ${JSON.stringify(variant)}`);
    const errors = {};
    if (!variant.name) errors.name = "Variant name is required";
    if (!variant.color) errors.color = "Color is required";
    if (!variant.size) errors.size = "Size is required";
    if (!variant.material) errors.material = "Material is required";
    if (variant.quantity < 0) errors.quantity = "Quantity must be positive";
    if (variant.price <= 0) errors.price = "Price must be positive";
    if (variant.discount < 0 || variant.discount > 100) {
      errors.discount = "Discount must be between 0 and 100";
    }

    if (Object.keys(errors).length > 0) {
      logger.debug(`Variant validation failed: ${JSON.stringify(errors)}`);
    } else {
      logger.debug("Variant validation passed");
    }
    return errors;
  };

  const addVariant = () => {
    logger.debug("Adding new variant");
    const errors = validateVariant(currentVariant);
    if (Object.keys(errors).length > 0) {
      const errorMessage =
        "Please fix variant errors: " + Object.values(errors).join(", ");
      logger.debug(`Variant addition failed: ${errorMessage}`);
      setError(errorMessage);
      return;
    }

    const newVariant = { ...currentVariant, id: uuidv4() };
    logger.debug(`Created new variant with ID: ${newVariant.id}`);

    setProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
    logger.debug("Variant added successfully");

    // Reset form
    setCurrentVariant({
      name: "",
      description: "",
      color: "",
      size: "",
      weight: 0,
      material: MATERIALS[0],
      quantity: 0,
      price: 0,
      discount: 0,
    });
  };

  const removeVariant = (variantId) => {
    setProduct((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v.id !== variantId),
    }));
  };

  const generateUniqueCode = (product) => {
    logger.debug("Generating unique code for product");
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const code = `SKA-${product.category
      .substring(0, 3)
      .toUpperCase()}-${timestamp.toString().slice(-6)}-${randomString}`;
    logger.debug(`Generated code: ${code}`);
    return code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    logger.debug("Starting product submission");
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      if (product.variants.length === 0) {
        throw new Error("At least one variant is required");
      }

      const uniqueCode = generateUniqueCode(product);
      const productData = {
        ...product,
        code: uniqueCode,
        codeType: codeType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingProduct) {
        await updateInventoryItem(productData);
        setSuccess(true);
        setTimeout(() => navigate("/products"), 1500);
      } else {
        const newProduct = await addToInventory({
          ...productData,
          id: uuidv4(),
        });
        setSuccess(true);
        setProduct({
          name: "",
          description: "",
          images: [],
          codeType: "qrcode",
          code: "",
          category: CATEGORIES[0],
          type: TYPES[0],
          tags: [],
          variants: [],
          sellerId: "default-seller",
        });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setProduct((prevProduct) => ({ ...prevProduct, photo: imageSrc }));
    setShowCamera(false);
  };

  const renderCode = () => {
    if (!product.name) return null;

    const value = product.code || generateUniqueCode(product);

    return (
      <div className="mt-4 p-4 border rounded-md">
        <h3 className="text-lg font-semibold mb-2">Product Code</h3>
        <div className="flex items-center space-x-4">
          <select
            value={codeType}
            onChange={(e) => setCodeType(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="qrcode">QR Code</option>
            <option value="barcode">Barcode</option>
          </select>
          <span className="text-sm font-mono">{value}</span>
        </div>
        <div className="mt-4 flex justify-center">
          {codeType === "qrcode" ? (
            <QRCodeSVG value={value} size={128} />
          ) : (
            <Barcode value={value} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`p-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}
    >
      <h2 className="text-2xl font-bold mb-4">
        {editingProduct ? "Edit Product" : "Create New Product"}
      </h2>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Product Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={product.name}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={product.category}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full p-2 rounded-md"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Type and Description */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={product.type}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full p-2 rounded-md"
              required
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={product.description}
              onChange={(e) =>
                setProduct((prev) => ({ ...prev, description: e.target.value }))
              }
              required
            />
          </div>
        </div>

        {/* Variant Form */}
        <div className="border p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Add Variant</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Variant fields */}
            <Input
              placeholder="Variant Name"
              value={currentVariant.name}
              onChange={(e) =>
                setCurrentVariant((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              placeholder="Color"
              value={currentVariant.color}
              onChange={(e) =>
                setCurrentVariant((prev) => ({
                  ...prev,
                  color: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Size"
              value={currentVariant.size}
              onChange={(e) =>
                setCurrentVariant((prev) => ({ ...prev, size: e.target.value }))
              }
            />
            <select
              value={currentVariant.material}
              onChange={(e) =>
                setCurrentVariant((prev) => ({
                  ...prev,
                  material: e.target.value,
                }))
              }
              className="w-full p-2 rounded-md"
            >
              {MATERIALS.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Weight (g)"
              value={currentVariant.weight}
              onChange={(e) =>
                setCurrentVariant((prev) => ({
                  ...prev,
                  weight: parseFloat(e.target.value),
                }))
              }
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={currentVariant.quantity}
              onChange={(e) =>
                setCurrentVariant((prev) => ({
                  ...prev,
                  quantity: parseInt(e.target.value),
                }))
              }
            />
            <Input
              type="number"
              placeholder="Price"
              value={currentVariant.price}
              onChange={(e) =>
                setCurrentVariant((prev) => ({
                  ...prev,
                  price: parseFloat(e.target.value),
                }))
              }
            />
            <Input
              type="number"
              placeholder="Discount %"
              value={currentVariant.discount}
              onChange={(e) =>
                setCurrentVariant((prev) => ({
                  ...prev,
                  discount: parseInt(e.target.value),
                }))
              }
            />
          </div>
          <Button type="button" onClick={addVariant} className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </div>

        {/* Variants List */}
        {product.variants.length > 0 && (
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Product Variants</h3>
            <div className="space-y-2">
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <span className="font-medium">{variant.name}</span>
                    <span className="mx-2">-</span>
                    <span>
                      {variant.color}, {variant.size}, {variant.material}
                    </span>
                    <span className="mx-2">-</span>
                    <span>₹{variant.price}</span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVariant(variant.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add the code generator before the submit button */}
        {renderCode()}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={product.variants.length === 0}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Product...
            </>
          ) : (
            "Create Product"
          )}
        </Button>
      </form>
    </div>
  );
};

export default ProductCreator;
