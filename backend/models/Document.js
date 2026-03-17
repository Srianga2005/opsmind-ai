const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    storedFilename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'processed', 'error'],
        default: 'processing'
    },
    error: {
        type: String
    },
    metadata: {
        type: Map,
        of: String
    },
    vectorIds: [{
        type: String
    }],
    concepts: [{
        type: String
    }],
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    }
});

// Index for faster queries
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ status: 1 });

documentSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'processed') {
        this.processedAt = new Date();
    }
    next();
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
