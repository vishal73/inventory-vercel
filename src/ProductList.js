import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useInventory } from "./InventoryContext";
import { Table } from "./components/ui/table";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { useTheme } from "./ThemeContext";

const ProductList = () => {
  const { inventory, updateInventoryItem, removeFromInventory } =
    useInventory();
  const { isDarkMode } = useTheme();

  const handleUpdate = async (id, updates) => {
    try {
      await updateInventoryItem({ id, ...updates });
      // Handle successful update (e.g., show a success message)
    } catch (error) {
      console.error("Error updating product:", error);
      // Handle error (e.g., show an error message)
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeFromInventory(id);
      // Handle successful deletion (e.g., show a success message)
    } catch (error) {
      console.error("Error deleting product:", error);
      // Handle error (e.g., show an error message)
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
            <th>Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>QR Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>
                <Input
                  type="number"
                  value={product.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value);
                    if (!isNaN(newQuantity) && newQuantity >= 0) {
                      handleUpdate(product.id, { quantity: newQuantity });
                    }
                  }}
                  min="0"
                  className={`w-20 ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-white"
                  }`}
                />
              </td>
              <td>
                <Input
                  type="number"
                  value={product.price}
                  onChange={(e) => {
                    const newPrice = parseFloat(e.target.value);
                    if (!isNaN(newPrice) && newPrice >= 0) {
                      handleUpdate(product.id, { price: newPrice });
                    }
                  }}
                  min="0"
                  step="0.01"
                  className={`w-24 ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-white"
                  }`}
                />
              </td>
              <td>
                <QRCodeSVG value={product.id} size={64} />
              </td>
              <td>
                <Button
                  onClick={() => handleDelete(product.id)}
                  variant="destructive"
                  size="sm"
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ProductList;
