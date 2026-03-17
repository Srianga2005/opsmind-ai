const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Enable debug mode for mongoose
mongoose.set('debug', true);

const connectDB = async () => {
  console.log('\n=== Attempting to connect to MongoDB ===');
  console.log('MongoDB URI:', process.env.MONGODB_URI);
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    });

    console.log('\n=== MongoDB Connection Successful ===');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Port: ${conn.connection.port}`);
    console.log('==================================\n');
    
    // Event listeners for connection status
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

  } catch (error) {
    console.error('\n=== MongoDB Connection Failed ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error codeName:', error.codeName);
    console.error('Error stack:', error.stack);
    console.error('==================================\n');
    
    // Exit with error
    process.exit(1);
  }
};

module.exports = connectDB;