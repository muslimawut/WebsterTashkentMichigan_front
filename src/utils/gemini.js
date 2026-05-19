import { GoogleGenAI } from "@google/genai";
import { knowledgeBase } from "./chatKnowledgeBase";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash";

let ai = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

// Convert our structured knowledge base into a text format for the System Prompt
const contextData = knowledgeBase.map(item => `
Intent: ${item.intent}
Keywords (EN): ${item.keywords.en?.join(', ')}
Keywords (UZ): ${item.keywords.uz?.join(', ')}
Keywords (RU): ${item.keywords.ru?.join(', ')}
Response (EN): ${item.response.en}
Response (UZ): ${item.response.uz}
Response (RU): ${item.response.ru}
`).join('\n---\n');

const SYSTEM_INSTRUCTION = `
You are the official AI Assistant for the Webster University in Tashkent Test Center website.
Your role is to help users with questions about exams, registration, dates, prices, and locations.

Here is the OFFICIAL INFORMATION you must use to answer (Knowledge Base):
${contextData}

INSTRUCTIONS:
1. Always be polite, professional, and helpful.
2. DETECT the language of the user's message (English, Uzbek, or Russian).
3. RESPOND IN THE SAME LANGUAGE as the user. If they ask in Uzbek, answer in Uzbek.
4. Use the provided Knowledge Base to answer accurate facts. 
5. RESTRICTION: You are strictly limited to answering questions based on the website's content (Exams, Dates, Registration, Pricing, Location, Results).
6. IF the user asks about ANYTHING ELSE (e.g., general world knowledge, math, coding, politics, recipes, weather, other universities), you MUST REFUSE to answer.
   - Reply in the user's language: "I can only answer questions related to the Webster Test Center website information."
   - (Uzbek): "Men faqat saytdagi ma'lumotlar bo'yicha javob bera olaman."
   - (Russian): "Я могу отвечать только на вопросы, касающиеся информации на этом сайте."

7. Keep answers concise (max 2-3 sentences unless details are requested).
8. If asked about "price" or "cost", mention the payment methods too.
9. If asked about "upcoming exams", refer to "View All Test Dates" button on the site.

IMPORTANT: Do not make up fake dates or prices. Only use what is provided.
`;

export const sendMessageToGemini = async (userMessage, history = [], dynamicContext = '') => {
    if (!ai) {
        console.warn("Gemini API Key is missing.");
        return null;
    }

    try {
        // Prepare system instruction with dynamic context if present
        const fullSystemInstruction = SYSTEM_INSTRUCTION + (dynamicContext ? `\n\nCURRENT LIVE DATA (Use this for questions about specific dates/availability):\n${dynamicContext}` : "");

        const chat = ai.chats.create({
            model: MODEL_NAME,
            history: [
                {
                    role: "user",
                    parts: [{ text: fullSystemInstruction }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to assist users as the Webster Test Center AI Agent." }],
                },
                ...history
            ],
        });

        // Use the correct format for the new SDK
        const result = await chat.sendMessage({ message: userMessage });

        return result.text || "I'm having trouble connecting right now.";

    } catch (error) {
        console.error("Gemini API Error:", error);
        return null;
    }
};
