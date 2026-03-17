require('dotenv').config({ path: __dirname + '/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log('Testing Gemini API Connection...');
    console.log('API Key available:', !!process.env.GOOGLE_AI_API_KEY);

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        console.log('Sending test message...');
        const result = await model.generateContent("Say hello in exactly 3 words");
        const response = await result.response;
        console.log('\nSuccess! Response received:');
        console.log(response.text());
    } catch (error) {
        console.error('\nError connecting to Gemini API:');
        console.error(error.message);
        if (error.status) console.error('Status:', error.status);
    }
}

testGemini();
