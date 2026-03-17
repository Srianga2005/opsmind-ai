require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Document = require('./models/Document');
const { processDocument } = require('./services/documentService');

mongoose.connect('mongodb://localhost:27017/opsmind-ai').then(async () => {
    try {
        const docs = await Document.find({});
        fs.appendFileSync('out2.txt', `Found ${docs.length} docs to reprocess.\n`);
        for (const doc of docs) {
            fs.appendFileSync('out2.txt', `Reprocessing ${doc.filename}...\n`);
            try {
                await processDocument(doc._id, doc.path);
            } catch (err) {
                fs.appendFileSync('out2.txt', `ERROR: ${err.message}\n${err.stack}\n`);
            }
            fs.appendFileSync('out2.txt', `Done processing ${doc.filename}\n`);
        }
    } catch (err) {
        fs.appendFileSync('out2.txt', `FATAL: ${err.message}\n${err.stack}\n`);
    }
    process.exit(0);
});
