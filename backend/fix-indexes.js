// Script to fix MongoDB index issue
const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop the problematic username index if it exists
    try {
      await collection.dropIndex('username_1');
      console.log('✅ Successfully dropped username_1 index');
    } catch (err) {
      console.log('Note: username_1 index does not exist or already dropped');
    }
    
    // Verify remaining indexes
    const remainingIndexes = await collection.indexes();
    console.log('Remaining indexes:', remainingIndexes);
    
    console.log('✅ Index cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixIndexes();
