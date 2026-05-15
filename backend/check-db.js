const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const checkDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connection Successful!');
    
    // Check if we can reach a collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name).join(', '));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error Details:', err.message);
    process.exit(1);
  }
};

checkDB();
