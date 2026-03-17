require('dotenv').config({ path: __dirname + '/.env' });

async function testGeminiFetch() {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        console.log("Key available:", !!apiKey);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Say hello in 3 words" }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("API Error:", JSON.stringify(data, null, 2));
        } else {
            console.log("Success! Response:");
            console.log(data.candidates[0].content.parts[0].text);
        }
    } catch (e) {
        console.error("Fetch error:", e.message);
    }
}

testGeminiFetch();
