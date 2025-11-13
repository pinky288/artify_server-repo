const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://simpleDBUser:Artify12345@cluster0.oqgyppo.mongodb.net/artify?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("artify-db");
    const artifyCollection = db.collection("artists");
    const favoritesCollection = db.collection("favorites");

    app.get("/artists", async (req, res) => {
      try {
        const { visibility } = req.query;
        let query = {};

        if (visibility) {
          query.visibility = visibility;
        }

        const result = await artifyCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Server error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}
app.post("/artists/:id/favorite", async (req, res) => {
      const { id } = req.params;
      const { userEmail } = req.body;
      if (!userEmail) return res.status(400).send({ message: "User email required" });

      try {
        await artifyCollection.updateOne(
          { _id: new ObjectId(id) },
          { $addToSet: { favoritedBy: userEmail } }
        );
        res.send({ message: "Added to favorites" });
      } catch (err) {
        res.status(500).send({ message: "Server error" });
      }
    });