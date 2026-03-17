require('dotenv').config();

const apiKey = process.env.GOOGLE_AI_API_KEY;

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.models) {
            console.log("=== Available Models ===");
            data.models.filter(m => m.name.includes('embed')).forEach(m => {
                console.log(m.name, m.supportedGenerationMethods);
            });
        } else {
            console.log("Error fetching models:", data);
        }
    } catch (err) {
        console.error("Failed:", err);
    }
}

listModels();
