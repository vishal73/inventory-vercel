import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = await client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  const { method } = req;

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("products");

    switch (method) {
      case "GET":
        const products = await collection.find({}).toArray();
        res.status(200).json(products);
        break;
      case "POST":
        const newProduct = req.body;
        const result = await collection.insertOne(newProduct);
        res.status(201).json(result.ops[0]);
        break;
      case "PUT":
        const { id, ...updates } = req.body;
        await collection.updateOne({ _id: id }, { $set: updates });
        res.status(200).json({ message: "Product updated successfully" });
        break;
      case "DELETE":
        const { id: deleteId } = req.query;
        await collection.deleteOne({ _id: deleteId });
        res.status(200).json({ message: "Product deleted successfully" });
        break;
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
}
