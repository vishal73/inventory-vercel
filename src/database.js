const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://vishalyadav733:73wgDgOsmBJRohvh@cluster0.2przu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    // Perform a query to get all databases
    const databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
    // perform a query to get all collections in a database
    const collectionsList = await client.db("sample_mflix").listCollections();
    console.log("Collections in sample_mflix:");
    collectionsList.forEach((collection) =>
      console.log(` - ${collection.name}`)
    );
    // // Perform a query to get all collections in a database
    // for (const dbName of databasesList.databases.map((db) => db.name)) {
    //   const collectionsList = await client.db(dbName).listCollections();
    //   console.log(`Collections in ${dbName}:`);
    //   collectionsList.forEach((collection) =>
    //     console.log(` - ${collection.name}`)
    //   );
    // }
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
