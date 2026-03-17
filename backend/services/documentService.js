const fs = require('fs');
const path = require('path');
const { parse } = require('pdf-parse');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const config = require('../config/config');

const processDocument = async (documentId, filePath) => {
    try {
        const document = await Document.findById(documentId);
        if (!document) {
            console.error(`Document ${documentId} not found`);
            return;
        }

        // Read the file
        const dataBuffer = fs.readFileSync(filePath);
        let text = '';

        // Process based on file type
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.pdf') {
            const data = await parse(dataBuffer);
            text = data.text;
        } else if (ext === '.txt') {
            text = dataBuffer.toString('utf8');
        } else if (ext === '.docx') {
            // In a real app, you would use a library like mammoth or docx-parser
            text = 'DOCX processing will be implemented here';
        }

        // Split text into chunks (simple implementation)
        const chunkSize = 1000;
        const chunks = [];

        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }

        // Generate and save embeddings for each chunk via native fetch
        const apiKey = process.env.GOOGLE_AI_API_KEY || config.google.apiKey;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "models/gemini-embedding-001",
                        content: { parts: [{ text: chunk }] }
                    })
                });

                const data = await response.json();

                if (data.error) {
                    console.error('Embedding API Error:', data.error);
                    throw new Error(data.error.message);
                }

                if (data.embedding && data.embedding.values) {
                    const embeddingVector = data.embedding.values;

                    const docChunk = new DocumentChunk({
                        documentId,
                        text: chunk,
                        embedding: embeddingVector,
                        chunkIndex: i
                    });

                    await docChunk.save();
                    document.vectorIds.push(docChunk._id.toString());
                }
            } catch (err) {
                console.error(`Failed to generate embedding for chunk ${i}:`, err);
            }
        }

        // Extract concepts using Gemini
        try {
            const prompt = `Extract the top 3 to 5 core conceptual themes from the following text. Return ONLY a valid JSON array of strings, for example: ["Concept 1", "Concept 2"]. Do not include any other text.\n\nText:\n${text.substring(0, 10000)}`;
            const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const genResponse = await fetch(genUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });
            const genData = await genResponse.json();
            if (genData.candidates && genData.candidates[0].content) {
                let aiText = genData.candidates[0].content.parts[0].text;
                try {
                    const parsedConcepts = JSON.parse(aiText);
                    if (Array.isArray(parsedConcepts)) {
                        document.concepts = parsedConcepts.map(c => String(c).trim()).filter(c => c);
                    }
                } catch (e) {
                    console.error("Failed to parse concepts JSON:", aiText);
                }
            }
        } catch (err) {
            console.error("Failed to extract concepts:", err);
        }

        // Update document status
        document.status = 'processed';
        document.metadata = {
            chunks: chunks.length,
            characters: text.length,
            processedAt: new Date()
        };

        await document.save();

    } catch (error) {
        console.error(`Error processing document ${documentId}:`, error);

        // Update document status to error
        await Document.findByIdAndUpdate(documentId, {
            status: 'error',
            error: error.message
        });
    }
};

module.exports = {
    processDocument
};
