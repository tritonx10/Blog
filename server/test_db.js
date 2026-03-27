require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://tritonx10:Suhani_Atlas_2026@cluster0.tqfdiey.mongodb.net/suhani_literary?retryWrites=true&w=majority';

async function testConnection() {
  try {
    console.log('Connecting to:', mongoURI.replace(/:([^@]+)@/, ':****@'));
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
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
