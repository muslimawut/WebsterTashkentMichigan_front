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

const MEPT_FAQ = `
=== MICHIGAN ENGLISH PLACEMENT TEST (MEPT) – OFFICIAL FAQ ===

GENERAL INFORMATION
- The MEPT (Michigan English Placement Test) is an English proficiency exam for assessing applicants' academic English for admission and placement purposes. It evaluates Listening, Reading, Grammar, Vocabulary, and Writing.
- Applicants without a valid IELTS, TOEFL, or Duolingo certificate (or whose scores don't meet admission requirements) may be required to take the MEPT.
- MEPT ≠ MET: MEPT is for internal placement/admission. MET (Michigan English Test) is a standardized external exam. They are different.

REGISTRATION & PAYMENT
- To register: complete your online application and upload all required documents first. Only submitted-application holders can register.
- Exam fee: 650,000 UZS.
- Payment methods: Click, Payme, Xazna (online), or any bank.
- Payment deadline: within 2 days after registration AND at least 6 business days before the exam date. Late payment = registration cancelled.
- Capacity: only 40 applicants per test day. First-come, first-served.
- After payment confirmed: Invitation Letter sent by email within 2 business days. Attendance allowed ONLY after receiving this letter.

EXAM DAY REQUIREMENTS
- Bring: original passport only. Electronic or photocopied passports are NOT accepted.
- Arrive: registration starts 30 minutes before exam time. Late arrivals may not be admitted.
- Phones: must be switched off and handed in before the exam. No personal electronic devices allowed.

EXAM STRUCTURE
- The MEPT has TWO parts.
- Part 1 (computer-based, 1 hour total):
  • Listening: 25 questions, 25 minutes. Audio played ONCE — cannot go back to previous questions.
  • GVR (Grammar, Vocabulary, Reading): 55 questions, 35 minutes.
- Part 2 (computer-based Writing, 1 hour):
  • Read a printed text, then write a summary and analysis of at least 300 words.

SCORING & RESULTS
- Part 1 total: 80 points. Writing assessed separately by level and quality.
- Undergraduate passing: minimum 53/80 + Writing B1 level.
- Graduate (Master's) passing: minimum 58/80 + Writing B2 level.
- Results announced by email within one week after the test date.

AFTER THE EXAM
- If you fail MEPT: retake MEPT OR submit IELTS/TOEFL/Duolingo results that meet requirements.
- Failing MEPT ≠ automatic rejection. Undergrad applicants may be placed in Full ESL or Bridge ESL programs.

TECHNICAL & CONDUCT RULES
- Technical problem during exam: raise your hand immediately. Do NOT try to fix it yourself.
- Disqualification (immediate, no warning): cheating, unauthorized materials, phone use, any suspicious behavior.

CONTACT & SUPPORT
- Contact the admissions or testing office via official email on the MEPT website: skuzimurod@webster.edu
`;

const SYSTEM_INSTRUCTION = `
You are the official AI Assistant for the Webster University in Tashkent MEPT (Michigan English Placement Test) website.
Your role is to help users with questions about the MEPT exam, registration, payment, exam structure, scoring, and results.

Here is the OFFICIAL MEPT FAQ you must use to answer:
${MEPT_FAQ}

Additional Knowledge Base entries:
${contextData}

INSTRUCTIONS:
1. Always be polite, professional, and helpful.
2. DETECT the language of the user's message (English, Uzbek, or Russian).
3. RESPOND IN THE SAME LANGUAGE as the user. If they ask in Uzbek, answer in Uzbek. If in Russian, answer in Russian.
4. Use the provided FAQ and Knowledge Base to answer with accurate facts only.
5. RESTRICTION: You are strictly limited to answering questions about the MEPT exam and this website's content.
6. IF the user asks about ANYTHING ELSE (general knowledge, math, coding, politics, recipes, other universities), REFUSE politely:
   - English: "I can only answer questions related to the MEPT exam and Webster Test Center."
   - Uzbek: "Men faqat MEPT imtihoni va Webster Test Markazi haqidagi savollarga javob bera olaman."
   - Russian: "Я могу отвечать только на вопросы о экзамене MEPT и Тест-центре Вебстера."
7. Keep answers concise (2-3 sentences unless more detail is requested).
8. For payment questions, always mention the fee (650,000 UZS) and payment methods (Click, Payme, Xazna, bank).
9. For exam structure questions, clearly distinguish Part 1 (Listening + GVR) and Part 2 (Writing).
10. For passing score questions, specify both Undergraduate (53/80 + B1) and Graduate (58/80 + B2) thresholds.

IMPORTANT: Do not make up information. Only use what is provided in the FAQ above.
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
