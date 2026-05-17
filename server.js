const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

let db;

// Connect to MongoDB Atlas
MongoClient.connect(MONGO_URI)
  .then(client => {
    console.log('Connected smoothly to MongoDB Atlas');
    db = client.db('pokemon_inventory');
  })
  .catch(error => console.error('Database connection failed:', error));

// Middleware
app.use(express.json()); // Essential for handling PUT/POST JSON bodies
app.use(express.urlencoded({ extended: true })); // Handles standard form data submissions
app.use(express.static(path.join(__dirname, 'public'))); // Serves static frontend assets

// --- CRUD API ROUTES ---

// 1. CREATE (POST) - Adds a new card/booster box to the database
app.post('/api/items', (req, requireResponse) => {
  const { name, type, quantity } = req.body;
  
  const newItem = {
    name,
    type,
    quantity: parseInt(quantity, 10) || 0,
    createdAt: new Date()
  };

  db.collection('inventory').insertOne(newItem)
    .then(result => {
      // Instead of relying on full-page EJS reloads, redirect back to home page
      requireResponse.redirect('/');
    })
    .catch(err => {
      console.error(err);
      requireResponse.status(500).json({ error: 'Failed to create item' });
    });
});

// 2. READ (GET) - Fetches all inventory items
app.get('/api/items', (req, requireResponse) => {
  db.collection('inventory').find().toArray()
    .then(items => {
      requireResponse.json(items);
    })
    .catch(err => {
      console.error(err);
      requireResponse.status(500).json({ error: 'Failed to fetch items' });
    });
});

// 3. UPDATE (PUT) - Increments the inventory quantity of an item
app.put('/api/items/:id', (req, requireResponse) => {
  const id = req.params.id;
  
  db.collection('inventory').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $inc: { quantity: 1 } }, // Directly increments quantity by +1 on click
    { returnDocument: 'after' }
  )
  .then(result => {
    requireResponse.json({ message: 'Quantity updated successfully', updatedItem: result });
  })
  .catch(err => {
    console.error(err);
    requireResponse.status(500).json({ error: 'Failed to update item quantity' });
  });
});

// 4. DELETE (DELETE) - Removes an item from the database
app.delete('/api/items/:id', (req, requireResponse) => {
  const id = req.params.id;

  db.collection('inventory').deleteOne({ _id: new ObjectId(id) })
    .then(result => {
      if (result.deletedCount === 0) {
        return requireResponse.status(404).json({ error: 'No item matched that ID' });
      }
      requireResponse.json({ message: 'Item deleted successfully' });
    })
    .catch(err => {
      console.error(err);
      requireResponse.status(500).json({ error: 'Failed to delete item' });
    });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server running smoothly on http://localhost:${PORT}`);
});
