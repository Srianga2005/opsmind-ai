require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/opsmind-ai',
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 60,
        refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 30,
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },
    fileUpload: {
        maxSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
        uploadDir: process.env.UPLOAD_DIR || 'uploads',
    },
    google: {
        apiKey: process.env.GOOGLE_API_KEY || 'your-google-api-key',
    },
};
