const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7vnkrh3.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const toyCollection = client.db("toyMarketplace").collection("toys");

    // Search by toy name system
    // const indexKeys = { toy_name: 1 };
    // const indexOptions = { name: "toyName" };
    // const result = await toyCollection.createIndex(indexKeys, indexOptions);

    app.get("/toySearchByName/:text", async (req, res) => {
      const searchText = req.params.text;

      const result = await toyCollection
        .find({
          $or: [{ toy_name: { $regex: searchText, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    //My Toys section
    app.get("/toys", async (req, res) => {
      const query = req.query.email ? { seller_email: req.query.email } : {};
      const sort = req.query.sort;
      const options = {
        sort: { price: sort === "asc" ? 1 : -1 },
      };

      const cursor = toyCollection.find(query, options).limit(20);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    //upload file to mongodb
    app.post("/toys", async (req, res) => {
      const toy = req.body;
      console.log(toy);
      const result = await toyCollection.insertOne(toy);
      res.send(result);
    });

    app.patch("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedToy = req.body;
      console.log(updatedToy);
      const updateDoc = {
        $set: {
          quantity_available: updatedToy.quantity_available,
          price: updatedToy.price,
          description: updatedToy.description,
        },
      };
      const result = await toyCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    //delete from my toys page
    app.delete("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/toys", async (req, res) => {
      const cursor = toyCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});
app.listen(port, () => {
  console.log(`toy-marketplace server is running on port${port}`);
});
