const mongoose = require('mongoose');

console.log('=== Detailed MongoDB Connection Test ===');
console.log('Node.js version:', process.version);
console.log('Mongoose version:', require('mongoose/package.json').version);
console.log('Attempting to connect to MongoDB...');

const MONGODB_URI = 'mongodb://localhost:27017/opsmind-ai';

// Enable debug mode
mongoose.set('debug', true);

// Connection events
mongoose.connection.on('connecting', () => {
  console.log('Mongoose: Connecting to MongoDB...');});

mongoose.connection.on('connected', () => {
  console.log('Mongoose: Connected to MongoDB');});

mongoose.connection.on('open', () => {
  console.log('Mongoose: Connection is open');});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose: Disconnected from MongoDB');});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose: Connection error:', err);
  console.error('Error stack:', err.stack);
});

// Connect with timeout
const connectWithRetry = async () => {
  try {
    console.log('Attempting to connect to MongoDB with 10s timeout...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== Collections in database ===');
    console.log(collections.map(c => c.name).join(', ') || 'No collections found');
    console.log('==============================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error codeName:', error.codeName);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

connectWithRetry();

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Mongoose: Connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});
