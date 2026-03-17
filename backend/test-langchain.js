require('dotenv').config({ path: __dirname + '/.env' });
const { GoogleGenerativeAI } = require("@langchain/google-genai");

async function testLangChain() {
    console.log("Testing LangChain Gemini Connection...");
    console.log('API Key available:', !!process.env.GOOGLE_AI_API_KEY);

    try {
        const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
        const model = new ChatGoogleGenerativeAI({
            modelName: "gemini-pro",
            maxOutputTokens: 2048,
        });

        const res = await model.invoke([
            [
                "human",
                "Say hello in 3 words"
            ]
        ]);
        console.log("Success! Response:");
        console.log(res.text);
    } catch (error) {
        console.error("LangChain Error:");
        console.error(error.message);
    }
}

testLangChain();
