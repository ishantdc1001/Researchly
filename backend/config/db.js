const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log('Connecting to MongoDB Atlas cluster...');
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`🚀 MongoDB Atlas Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`⚠️ MongoDB Atlas connection failed (${err.message}). Trying fallback...`);
    }
  }

  // Try local MongoDB on standard port 27017 first
  try {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/researchly', {
      serverSelectionTimeoutMS: 1500
    });
    console.log(`🚀 Local MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (localErr) {
    console.log('ℹ️ Local MongoDB daemon not active.');
  }

  // Try MongoMemoryServer
  try {
    console.log('⏳ Starting MongoMemoryServer for instant zero-config experience...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'researchly'
      }
    });
    mongoUri = mongodInstance.getUri();
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ In-Memory MongoDB running at: ${mongoUri}`);
    return conn;
  } catch (memErr) {
    console.error('❌ Could not start in-memory Mongo server:', memErr.message);
    console.log('💡 Tip: Set MONGODB_URI in backend/.env with your free MongoDB Atlas connection string!');
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};

module.exports = { connectDB, disconnectDB };
