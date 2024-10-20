import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

export default async function handler(req, res) {
  const { method } = req;

  try {
    const client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db(dbName);

    switch (method) {
      case "POST":
        const newInvoice = req.body;
        const result = await db.collection("invoices").insertOne(newInvoice);
        res.status(201).json(result.ops[0]);
        break;
      // Add other methods as needed (GET, PUT, DELETE)
      default:
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }

    await client.close();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing request", error: error.message });
  }
}
