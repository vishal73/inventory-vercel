import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useInventory } from "./InventoryContext";
import { Table } from "./components/ui/table";
import { Button } from "./components/ui/button";
import { useTheme } from "./ThemeContext";
import { Edit, ChevronDown, ChevronUp, Trash } from "lucide-react";
import Logger from "./Logger";
import Barcode from "react-barcode";

const logger = Logger;
const ProductList = () => {
  const { inventory, updateInventoryItem, removeFromInventory } =
    useInventory();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  const toggleProductExpansion = (productId) => {
    logger.debug(`Toggling expansion for product: ${productId}`);
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
      logger.debug(`Collapsed product: ${productId}`);
    } else {
      newExpanded.add(productId);
      logger.debug(`Expanded product: ${productId}`);
    }
    setExpandedProducts(newExpanded);
  };

  const handleEdit = (product) => {
    logger.debug(`Navigating to edit product: ${product.id}`);
    navigate(`/product/edit/${product.id}`, { state: { product } });
  };

  const handleDelete = async (id) => {
    logger.debug(`Attempting to delete product: ${id}`);
    try {
      await removeFromInventory(id);
      logger.info(`Product deleted successfully: ${id}`);
    } catch (error) {
      logger.error(`Error deleting product ${id}: ${error.message}`);
    }
  };

  return (
    <div
      className={`p-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}
    >
      <h2 className="text-2xl font-bold mb-4">Product Inventory</h2>
      <Table>
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Code</th>
            <th>Category</th>
            <th>Type</th>
            <th>Variants</th>
            <th>Total Stock</th>
            <th>QR Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((product) => (
            <React.Fragment key={product.id}>
              <tr>
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleProductExpansion(product.id)}
                  >
                    {expandedProducts.has(product.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </td>
                <td>{product.name}</td>
                <td>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{product.code}</span>
                    {product.codeType === "qrcode" ? (
                      <QRCodeSVG value={product.code} size={32} />
                    ) : (
                      <Barcode value={product.code} height={32} width={1} />
                    )}
                  </div>
                </td>
                <td>{product.category}</td>
                <td>{product.type}</td>
                <td>{product.variants.length}</td>
                <td>
                  {product.variants.reduce((total, v) => total + v.quantity, 0)}
                </td>
                <td>
                  <QRCodeSVG value={product.code} size={64} />
                </td>
                <td>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(product)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(product.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
              {expandedProducts.has(product.id) && (
                <tr>
                  <td colSpan="8">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700">
                      <h4 className="font-semibold mb-2">Variants</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {product.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="p-3 border rounded-lg bg-white dark:bg-gray-800"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{variant.name}</h5>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {variant.color} - {variant.size} -{" "}
                                  {variant.material}
                                </p>
                                <p className="text-sm">
                                  Weight: {variant.weight}g
                                </p>
                                <p className="text-sm">
                                  Stock: {variant.quantity} pcs
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">₹{variant.price}</p>
                                {variant.discount > 0 && (
                                  <p className="text-sm text-green-600">
                                    {variant.discount}% off
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm">{product.description}</p>
                      </div>
                      {product.tags && product.tags.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {product.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ProductList;
