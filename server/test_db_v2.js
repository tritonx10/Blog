const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://tritonx10:Suhani_Atlas_2026@cluster0.tqfdiey.mongodb.net/suhani_literary?retryWrites=true&w=majority';

async function testConnection() {
  console.log('Using URI:', mongoURI.replace(/:([^@]+)@/, ':****@'));
  try {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    };
    await mongoose.connect(mongoURI, opts);
    console.log('✅ Connection successful!');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
