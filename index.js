require('dotenv').config();




const express = require('express'); 
const cors = require('cors'); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); 

const app = express(); 
const port = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); 

const uri = process.env.MONGO_URI;        
const secretKey = process.env.SECRET_KEY;

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
    const db = client.db('artify-db'); 
    const artifyCollection = db.collection('artists'); 
    const favoritesCollection = db.collection("favorites"); 

    app.get('/artists', async (req, res) => { 
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

    app.delete("/favorites", async (req, res) => { 
      const { artworkId, userEmail } = req.body; 
      if (!artworkId || !userEmail) return res.status(400).send({ message: "Invalid data" }); 
      try { 
        await favoritesCollection.deleteOne({ artworkId, userEmail }); 
        res.send({ message: "Removed from favorites" }); 
      } catch (err) { 
        res.status(500).send({ message: "Server error" }); 
      } 
    }); 

    app.get("/artists/favorites", async (req, res) => { 
      const { email } = req.query; 
      if (!email) return res.status(400).send({ message: "User email required" }); 
      try { 
        const favorites = await artifyCollection.find({ favoritedBy: email }).toArray(); 
        res.send(favorites); 
      } catch (err) { 
        res.status(500).send({ message: "Server error" }); 
      } 
    }); 

    app.get("/artists/:id", async (req, res) => { 
      const id = req.params.id; 
      try { 
        let query; 
        if (ObjectId.isValid(id)) { 
          query = { _id: new ObjectId(id) }; 
        } else { 
          query = { _id: id }; 
        } 
        let artwork = await artifyCollection.findOne(query); 
        if (!artwork) { 
          artwork = await artifyCollection.findOne({ _id: id }); 
        } 
        if (!artwork) { 
          return res.status(404).send({ message: "Artwork not found" }); 
        } 
        res.send(artwork); 
      } catch (err) { 
        res.status(500).send({ message: "Server error" }); 
      } 
    }); 

    app.post("/artists/:id/toggle-like", async (req, res) => { 
      const { id } = req.params; 
      const { action, userEmail } = req.body; 
      if (!userEmail) return res.status(403).json({ message: "Login required" }); 
      try { 
        const artwork = await artifyCollection.findOne({ _id: new ObjectId(id) }); 
        if (!artwork) return res.status(404).json({ message: "Artwork not found" }); 
        let updatedLikes = artwork.likes || 0; 
        let likedBy = artwork.likedBy || []; 
        if (action === "like") { 
          if (!likedBy.includes(userEmail)) { 
            likedBy.push(userEmail); 
            updatedLikes += 1; 
          } 
        } else if (action === "unlike") { 
          if (likedBy.includes(userEmail)) { 
            likedBy = likedBy.filter(email => email !== userEmail); 
            updatedLikes -= 1; 
          } 
        } 
        const updatedArtwork = await artifyCollection.findOneAndUpdate( 
          { _id: new ObjectId(id) }, 
          { $set: { likes: updatedLikes, likedBy } }, 
          { returnDocument: "after" } 
        ); 
        res.json(updatedArtwork.value); 
      } catch (err) { 
        console.error(err); 
        res.status(500).json({ message: err.message }); 
      } 
    }); 

    // await client.db("admin").command({ ping: 1 }); 
    console.log("Successfully connected to MongoDB!"); 
  } catch (err) { 
    console.error(" MongoDB connection failed:", err); 
  } 
} 

run(); 

app.get('/', (req, res) => { 
  res.send('Hello from Artify Server!'); 
}); 

app.listen(port, () => { 
  console.log(`Server running on http://localhost:${port}`); 
}); 
