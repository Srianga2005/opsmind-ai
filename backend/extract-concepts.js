require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./models/Document');
const fs = require('fs');

async function extractConcepts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) throw new Error("Missing API Key");

        const docs = await Document.find({ status: 'processed', $or: [{ concepts: { $exists: false } }, { concepts: { $size: 0 } }] });
        console.log(`Found ${docs.length} docs to process for concepts.`);

        for (const doc of docs) {
            console.log(`Processing ${doc.filename}...`);
            let text = '';

            try {
                if (doc.filename.endsWith('.txt')) {
                    text = fs.readFileSync(doc.path, 'utf8');
                } else {
                    console.log(`Skipping non-text fallback for test script on ${doc.filename}`);
                    continue;
                }
            } catch (e) {
                console.log(`Could not read ${doc.path}`);
                continue;
            }

            try {
                const prompt = `Extract the top 3 to 5 core conceptual themes from the following text. Return ONLY a valid JSON array of strings, for example: ["Concept 1", "Concept 2"]. Do not include any other text.\n\nText:\n${text.substring(0, 5000)}`;
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
                    const parsedConcepts = JSON.parse(aiText);
                    if (Array.isArray(parsedConcepts)) {
                        doc.concepts = parsedConcepts.map(c => String(c).trim()).filter(c => c);
                        await doc.save();
                        console.log(`-> Saved concepts:`, doc.concepts);
                    }
                }
            } catch (e) {
                console.error("Failed to extract:", e);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        console.log("Done.");
    }
}

extractConcepts();
