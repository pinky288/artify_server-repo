const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

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

    const db = client.db('artify-db')
    const artifyCollection = db.collection('artists')

    app.get('/artists' , async (req, res) => {
      const result = await artifyCollection.find().toArray()
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } catch (err) {
    console.error(" MongoDB connection failed:", err);
  }
}

run();

app.get('/', (req, res) => {
  res.send('Hello from Artify Server!');
});

app.listen(port, () => {
  console.log(` Server running on http://localhost:${port}`);
});
