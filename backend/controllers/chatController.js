const Chat = require('../models/Chat');
const User = require('../models/User');
const DocumentChunk = require('../models/DocumentChunk');
const Document = require('../models/Document');

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}


const sendMessage = async (req, res, next) => {
    try {
        let { message, userId, history = [] } = req.body;

        // If no userId is provided, find or create a default user
        if (!userId) {
            let defaultUser = await User.findOne({ email: 'demo@opsmind.ai' });

            if (!defaultUser) {
                // If demo user doesn't exist, try to find ANY user
                defaultUser = await User.findOne({});

                // If still no user, create the demo user
                if (!defaultUser) {
                    defaultUser = await User.create({
                        username: 'Demo User',
                        email: 'demo@opsmind.ai',
                        password: 'password123', // Will be hashed by pre-save hook
                        role: 'user'
                    });
                }
            }
            userId = defaultUser._id;
        }

        // Processing the message with Google Generative AI
        let aiResponseText = 'Sorry, AI integration is not configured correctly.';
        let sources = [];
        try {
            if (process.env.GOOGLE_AI_API_KEY) {
                // 1. Convert user's message to an embedding for semantic search
                let userVector = null;
                const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GOOGLE_AI_API_KEY}`;

                const embedRes = await fetch(embedUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "models/gemini-embedding-001",
                        content: { parts: [{ text: message }] }
                    })
                });

                const embedData = await embedRes.json();
                if (embedData.embedding && embedData.embedding.values) {
                    userVector = embedData.embedding.values;
                }

                // 2. Perform Retrieval Augmented Generation (RAG) Search
                let contextText = "";
                if (userVector) {
                    // Fetch all available document chunks
                    const allChunks = await DocumentChunk.find({});

                    if (allChunks.length > 0) {
                        // Calculate similarities
                        const scoredChunks = allChunks.map(chunk => ({
                            text: chunk.text,
                            score: cosineSimilarity(userVector, chunk.embedding)
                        }));

                        // Sort descending and take top 3 results
                        scoredChunks.sort((a, b) => b.score - a.score);
                        const topChunks = scoredChunks.slice(0, 3).filter(c => c.score > 0.4); // Filter out poor matches

                        if (topChunks.length > 0) {
                            contextText = "\n\nUSE THE FOLLOWING ENTERPRISE SOP CONTEXT TO ANSWER THE QUESTION:\n";

                            // Fetch document metadata for citations
                            const uniqueDocIds = [...new Set(topChunks.map(c => c.documentId))];
                            const docs = await Document.find({ _id: { $in: uniqueDocIds } });
                            const docMap = {};
                            docs.forEach(d => docMap[d._id.toString()] = d.filename);

                            topChunks.forEach((c, idx) => {
                                contextText += `--- Context ${idx + 1} ---\n${c.text}\n`;
                                const docIdString = c.documentId ? c.documentId.toString() : '';
                                sources.push({
                                    filename: docIdString && docMap[docIdString] ? docMap[docIdString] : 'Unknown Document',
                                    snippet: c.text.length > 150 ? c.text.substring(0, 150) + '...' : c.text
                                });
                            });
                        }
                    }
                }

                // 3. Send Augmented Prompt and History to Gemini AI
                const augmentedPrompt = message + contextText;

                const geminiContents = history.slice(-10).map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }));

                geminiContents.push({
                    role: 'user',
                    parts: [{ text: augmentedPrompt }]
                });

                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: geminiContents,
                        // Provide system instruction for RAG persona
                        systemInstruction: {
                            parts: [{ text: "You are OpsMind AI, an Enterprise SOP Neural Brain. Answer the user's question using the provided SOP Context. If the context doesn't contain the answer, say you aren't sure based on the local documents." }]
                        }
                    })
                });

                const data = await response.json();

                if (data.error) {
                    console.error('API Error Response:', data.error);
                    aiResponseText = `Error: ${data.error.message}`;
                } else if (data.candidates && data.candidates[0].content) {
                    aiResponseText = data.candidates[0].content.parts[0].text;
                } else {
                    aiResponseText = "Received an empty response from AI.";
                }
            } else {
                console.warn('GOOGLE_AI_API_KEY is not set in environment variables');
            }
        } catch (apiError) {
            console.error('Error with Gemini API:', apiError.message || apiError);
            let errMsg = apiError.message || String(apiError);
            if (apiError.response && typeof apiError.response.text === 'function') {
                try { errMsg += " | " + await apiError.response.text(); } catch(e){}
            }
            aiResponseText = 'AI Error: ' + errMsg;
        }

        const response = {
            message: aiResponseText,
            sources: sources,
            timestamp: new Date()
        };

        // Save to database
        const chat = new Chat({
            user: userId,
            messages: [
                { role: 'user', content: message },
                { role: 'assistant', content: response.message, sources: response.sources }
            ]
        });

        await chat.save();

        res.json(response);
    } catch (error) {
        next(error);
    }
};

const getChatHistory = async (req, res, next) => {
    try {
        let { userId } = req.query;

        // If no userId provided, try to find the default user to show some history
        if (!userId) {
            const defaultUser = await User.findOne({ email: 'demo@opsmind.ai' }) || await User.findOne({});
            if (defaultUser) {
                userId = defaultUser._id;
            }
        }

        if (!userId) {
            return res.json([]); // No user found, return empty history
        }

        const chats = await Chat.find({ user: userId }).sort({ createdAt: -1 });
        res.json(chats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendMessage,
    getChatHistory
};
