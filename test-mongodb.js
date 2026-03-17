const mongoose = require('mongoose');

console.log('=== Testing MongoDB Connection ===');
console.log('Attempting to connect to MongoDB...');

const MONGODB_URI = 'mongodb://localhost:27017/opsmind-ai';

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ MongoDB Connected Successfully!');    
    console.log('✅ Database Name:', mongoose.connection.name);
    console.log('✅ Host:', mongoose.connection.host);
    console.log('✅ Port:', mongoose.connection.port);
    process.exit(0);
})
.catch(error => {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Code Name:', error.codeName);
    process.exit(1);
});
