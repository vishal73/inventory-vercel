import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useInventory } from "./InventoryContext";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription } from "./components/ui/alert";
import { useTheme } from "./ThemeContext";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Plus, Trash, Camera, Upload } from "lucide-react";
import Barcode from "react-barcode";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import Logger from "./Logger";
import { useLocation, useNavigate } from "react-router-dom";

const logger = Logger;
const CATEGORIES = [
  "Earrings",
  "Bracelets",
  "Rings",
  "Chains",
  "Necklaces",
  "Sets",
];

const STYLES = [
  "Officewear",
  "Casualwear",
  "Partywear",
  "Sportswear",
  "Classic",
  "Modern",
  "Vintage",
  "Ethnic",
  "Minimalist",
];

const MATERIALS = [
  "Material",
  "Gold",
  "Silver",
  "Rose Gold",
  "Oxidized",
  "Plated",
  "Metallic",
];

const TYPES = {
  Earrings: ["Stud", "Drop", "Hoop", "Earring", "Earring Set"],
  Bracelets: ["Bangle", "Cuff", "Chain", "Tennis", "Bracelet Set"],
  Rings: ["Band", "Band Set", "Stone", "Pearl", "Gemstone"],
  Chains: ["Short", "Medium", "Long", "Choker"],
  Necklaces: ["Short", "Medium", "Long", "Choker"],
  Sets: ["Set"],
};

const uploadImage = async (file) => {
  // Implement your image upload logic here
  // This is a placeholder - replace with your actual upload implementation
  throw new Error("Image upload not implemented");
};

const ProductCreator = ({ isActive, savedState, onStateChange }) => {
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

  // Define default state
  const defaultState = {
    product: {
      name: "",
      description: "",
      images: [],
      codeType: "qrcode",
      code: "",
      category: CATEGORIES[0],
      type: TYPES[CATEGORIES[0]][0],
      styles: [],
      tags: [],
      variants: [],
      sellerId: "default-seller",
    },
    currentVariant: {
      id: uuidv4(),
      name: "",
      description: "",
      color: "",
      size: "",
      weight: "",
      material: MATERIALS[0],
      quantity: "",
      price: "",
      discount: "",
      images: [],
      code: "",
      tags: [],
      tagInput: "",
    },
    codeType: "qrcode",
    generatedCode: "",
    tags: [],
    tagInput: "",
    fileInputRef: React.createRef(),
  };

  // Initialize state only once with savedState or default values
  const [formState, setFormState] = useState(() => ({
    ...defaultState,
    ...(savedState || {}),
  }));

  // Use useRef to track if this is the initial mount
  const isInitialMount = useRef(true);

  // Update parent only when formState changes and not on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isActive) {
      // Debounce the state update to prevent rapid changes
      const timeoutId = setTimeout(() => {
        onStateChange(formState);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [formState, isActive, onStateChange]);

  // Initialize form state from savedState only once on mount
  useEffect(() => {
    if (savedState && isInitialMount.current) {
      setFormState((prev) => ({
        ...prev,
        ...savedState,
      }));
    }
  }, []); // Empty dependency array for mount-only effect

  const handleTagInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = formState.tagInput.trim();
      if (newTag && !formState.tags.includes(newTag)) {
        setFormState((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
          tagInput: "",
        }));
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormState((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = async (files) => {
    try {
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          // Implement your image upload logic here
          // Return the URL of the uploaded image
          return await uploadImage(file);
        })
      );

      setFormState((prev) => ({
        ...prev,
        currentVariant: {
          ...prev.currentVariant,
          images: [...prev.currentVariant.images, ...uploadedUrls],
        },
      }));
    } catch (error) {
      setError("Failed to upload images");
      Logger.error("Image upload failed:", error);
    }
  };

  const generateVariantCode = (variant) => {
    const randomString = Math.random().toString(36).substring(2, 8);
    return `SKA-${formState.product.category
      .substring(0, 2)
      .toUpperCase()}-${variant.name
      .substring(0, 2)
      .toUpperCase()}-${randomString}`;
  };

  const addVariant = () => {
    const errors = validateVariant(formState.currentVariant);
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join(", "));
      return;
    }

    const variantCode = generateVariantCode(formState.currentVariant);
    const newVariant = {
      ...formState.currentVariant,
      id: uuidv4(),
      code: variantCode,
    };

    setFormState((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        variants: [...prev.product.variants, newVariant],
      },
      currentVariant: {
        id: uuidv4(),
        name: "",
        description: "",
        color: "",
        size: "",
        weight: "",
        material: MATERIALS[0],
        quantity: "",
        price: "",
        discount: "",
        images: [],
        code: "",
      },
    }));
  };

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

  const removeVariant = (variantId) => {
    setFormState((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        variants: prev.product.variants.filter((v) => v.id !== variantId),
      },
    }));
  };

  const generateUniqueCode = (product) => {
    logger.debug("Generating unique code for product");
    const randomString = Math.random().toString(36).substring(2, 8);
    const timestamp = new Date().getTime().toString(36).substring(2, 8);
    const code = `SKA-${product.category
      .substring(0, 4)
      .toUpperCase()}-${randomString}-${timestamp}`;
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
      if (formState.product.variants.length === 0) {
        throw new Error("At least one variant is required");
      }

      const uniqueCode = generateUniqueCode(formState.product);
      const productData = {
        ...formState.product,
        code: uniqueCode,
        codeType: formState.codeType,
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
        setFormState({
          product: {
            name: "",
            description: "",
            images: [],
            codeType: "qrcode",
            code: "",
            category: CATEGORIES[0],
            type: TYPES[CATEGORIES[0]][0],
            styles: [],
            tags: [],
            variants: [],
            sellerId: "default-seller",
          },
          currentVariant: {
            id: uuidv4(),
            name: "",
            description: "",
            color: "",
            size: "",
            weight: "",
            material: MATERIALS[0],
            quantity: "",
            price: "",
            discount: "",
            images: [],
            code: "",
          },
          codeType: "qrcode",
          generatedCode: "",
          tags: [],
          tagInput: "",
          fileInputRef: React.createRef(),
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
    setFormState((prevProduct) => ({ ...prevProduct, photo: imageSrc }));
    setShowCamera(false);
  };

  const renderCode = () => {
    if (!formState.product.name) return null;

    const value =
      formState.currentVariant.code || generateUniqueCode(formState.product);
    formState.currentVariant.code = value;
    return (
      <div className="mt-4 p-4 border rounded-md">
        <h3 className="text-lg font-semibold mb-2">Product Code</h3>
        <div className="flex items-center space-x-4">
          <select
            value={formState.codeType}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, codeType: e.target.value }))
            }
            className="p-2 border rounded"
          >
            <option value="qrcode">QR Code</option>
            <option value="barcode">Barcode</option>
          </select>
          <span className="text-sm font-mono">{value}</span>
        </div>
        <div className="mt-4 flex justify-center">
          {formState.codeType === "qrcode" ? (
            <QRCodeSVG value={value} size={128} />
          ) : (
            <Barcode value={value} />
          )}
        </div>
      </div>
    );
  };

  const handleFormChange = (updates) => {
    setFormState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleVariantTagInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = formState.currentVariant.tagInput.trim();
      if (newTag && !formState.currentVariant.tags.includes(newTag)) {
        setFormState((prev) => ({
          ...prev,
          currentVariant: {
            ...prev.currentVariant,
            tags: [...prev.currentVariant.tags, newTag],
            tagInput: "",
          },
        }));
      }
    }
  };

  const removeVariantTag = (tagToRemove) => {
    setFormState((prev) => ({
      ...prev,
      currentVariant: {
        ...prev.currentVariant,
        tags: prev.currentVariant.tags.filter((tag) => tag !== tagToRemove),
      },
    }));
  };

  const handleStylesChange = (e) => {
    const selectedStyles = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormState((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        styles: selectedStyles,
      },
    }));
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setFormState((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        category: newCategory,
        type: TYPES[newCategory][0],
      },
    }));
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
              value={formState.product?.name}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  product: {
                    ...prev.product,
                    name: e.target.value,
                  },
                }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formState.product?.category}
              onChange={handleCategoryChange}
              className="w-full p-2 rounded-md border"
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

        {/* Product Type and Styles */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={formState.product?.type}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  product: {
                    ...prev.product,
                    type: e.target.value,
                  },
                }))
              }
              className="w-full p-2 rounded-md border"
              required
            >
              {TYPES[formState.product?.category]?.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="styles">Styles (Multiple)</Label>
            <select
              id="styles"
              multiple
              value={formState.product?.styles || []}
              onChange={handleStylesChange}
              className="w-full p-2 rounded-md border min-h-[100px]"
            >
              {STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple styles
            </span>
          </div>
        </div>

        {/* Display selected styles */}
        {formState.product?.styles?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formState.product.styles.map((style) => (
              <Badge key={style} variant="secondary">
                {style}
              </Badge>
            ))}
          </div>
        )}

        {/* Product Description */}
        <div className="mb-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.product?.description}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  product: {
                    ...prev.product,
                    description: e.target.value,
                  },
                }))
              }
              className="min-h-[100px]"
              rows={Math.min(
                10,
                formState.product?.description?.split("\n").length + 1
              )}
            />
          </div>
        </div>

        {/* Tags Input */}
        <div className="mb-4">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formState.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-xs hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <Input
            id="tags"
            value={formState.tagInput}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, tagInput: e.target.value }))
            }
            onKeyDown={handleTagInput}
            placeholder="Add tags (press Enter or comma to add)"
          />
        </div>

        {/* Variant Form with Images */}
        <div className="border p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Add Variant</h3>

          {/* Variant Images */}
          <div className="mb-4">
            <Label>Variant Images</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formState.currentVariant?.images?.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Variant ${index + 1}`}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <button
                    onClick={() => {
                      setFormState((prev) => ({
                        ...prev,
                        currentVariant: {
                          ...prev.currentVariant,
                          images: prev.currentVariant.images.filter(
                            (_, i) => i !== index
                          ),
                        },
                      }));
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => formState.fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </Button>
              <input
                ref={formState.fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  /* Implement camera capture */
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </div>

          {/* Variant fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Variant Name"
              value={formState.currentVariant?.name}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    name: e.target.value,
                  },
                }))
              }
            />
            <Input
              placeholder="Color"
              value={formState.currentVariant?.color}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    color: e.target.value,
                  },
                }))
              }
            />
            <Input
              placeholder="Size"
              value={formState.currentVariant?.size}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    size: e.target.value,
                  },
                }))
              }
            />
            <select
              value={formState.currentVariant?.material}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    material: e.target.value,
                  },
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
              value={formState.currentVariant?.weight}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    weight: parseFloat(e.target.value),
                  },
                }))
              }
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={formState.currentVariant?.quantity}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    quantity: parseInt(e.target.value),
                  },
                }))
              }
            />
            <Input
              type="number"
              placeholder="Price"
              value={formState.currentVariant?.price}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    price: parseFloat(e.target.value),
                  },
                }))
              }
            />
            <Input
              type="number"
              placeholder="Discount %"
              value={formState.currentVariant?.discount}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    discount: parseInt(e.target.value),
                  },
                }))
              }
            />
          </div>

          {/* Variant Description */}
          <div className="mb-4">
            <Label htmlFor="variantDescription">Variant Description</Label>
            <Textarea
              id="variantDescription"
              value={formState.currentVariant?.description}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    description: e.target.value,
                  },
                }))
              }
              className="min-h-[100px]"
              rows={Math.min(
                5,
                formState.currentVariant?.description?.split("\n").length + 1
              )}
            />
          </div>

          {/* Variant Tags Input */}
          <div className="mb-4">
            <Label htmlFor="variantTags">Variant Tags (comma-separated)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formState.currentVariant.tags?.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeVariantTag(tag)}
                    className="ml-1 text-xs hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              id="variantTags"
              value={formState.currentVariant.tagInput}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  currentVariant: {
                    ...prev.currentVariant,
                    tagInput: e.target.value,
                  },
                }))
              }
              onKeyDown={handleVariantTagInput}
              placeholder="Add variant tags (press Enter or comma to add)"
            />
          </div>

          <Button type="button" onClick={addVariant} className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </div>

        {/* Variants List */}
        {formState.product.variants.length > 0 && (
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Product Variants</h3>
            <div className="space-y-2">
              {formState.product.variants?.map((variant) => (
                <div
                  key={variant.id}
                  className="flex flex-col p-2 border rounded"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{variant.name}</span>
                      <span className="mx-2">-</span>
                      <span>
                        Color: {variant.color}, Size: {variant.size}, Material:{" "}
                        {variant.material}
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
                  {/* Display variant tags */}
                  {variant.tags && variant.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {variant.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
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
          disabled={formState.product.variants.length === 0}
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
