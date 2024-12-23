import {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "./database";
import Logger from "./Logger";

const logger = Logger;
export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case "GET":
        logger.info("Retrieving all products");
        const products = await getProducts();
        res.status(200).json(products);
        break;

      case "POST":
        logger.info(`Creating new product: ${JSON.stringify(req.body)}`);
        const newProduct = await addProduct(req.body);
        res.status(201).json(newProduct);
        break;

      case "PUT":
        const { id, ...updates } = req.body;
        const updatedProduct = await updateProduct(id, updates);
        res.status(200).json(updatedProduct);
        break;

      case "DELETE":
        const { id: deleteId } = req.query;
        await deleteProduct(deleteId);
        res.status(200).json({ message: "Product deleted successfully" });
        break;

      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    logger.error(`Error in products handler: ${error.message}`);
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
}
