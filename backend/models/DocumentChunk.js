const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number], // Array of floats representing the vector
        required: true
    },
    chunkIndex: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index if necessary, but importantly we need the vector index
// MongoDB Atlas supports native Vector Search. The index creation usually happens in Atlas UI or via specific commands.

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);

module.exports = DocumentChunk;
