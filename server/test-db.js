const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://tritonx10:Suhani_Atlas_2026@cluster0.tqfdiey.mongodb.net/suhani_literary?retryWrites=true&w=majority';

console.log('Testing connection to:', uri.split('@')[1]);

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connection successful!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed:');
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Reason:', JSON.stringify(err.reason, null, 2));
  process.exit(1);
});
