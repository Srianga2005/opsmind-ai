const mongoose = require('mongoose');
const DocumentChunk = require('./models/DocumentChunk');

mongoose.connect('mongodb://localhost:27017/opsmind-ai').then(async () => {
    try {
        const chunks = await DocumentChunk.find({});
        console.log(`Found ${chunks.length} chunks.`);
        if (chunks.length > 0) {
            console.log("Sample chunk:", chunks[0].text.substring(0, 100));
            console.log("Vector size:", chunks[0].embedding.length);
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
