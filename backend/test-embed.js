require('dotenv').config();

const apiKey = process.env.GOOGLE_AI_API_KEY;

async function testEmbedding(modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${modelName}`,
                content: { parts: [{ text: "Hello world" }] }
            })
        });
        const data = await res.json();
        console.log(`Model: ${modelName} -> Status: ${res.status}`);
        if (data.error) {
            console.log(`Error:`, data.error.message);
        } else {
            console.log(`Success! Vector length:`, data.embedding.values.length);
        }
    } catch (err) {
        console.error(`Failed ${modelName}:`, err);
    }
}

async function run() {
    await testEmbedding('gemini-embedding-001');
}

run();
