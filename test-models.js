import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

// Manually load env if dotenv fails (since we are running with node directly)
const API_KEY = process.env.VITE_GEMINI_API_KEY || "AIzaSyDu6pMoscNsgW5FVPATyvzzEMkc3nuut2M";

async function listModels() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    console.log("Checking available models for key: " + API_KEY.substring(0, 10) + "...");

    try {
        // For some reason the Node SDK doesn't expose listModels directly on the main class in all versions
        // But we can try to guess or use a basic generate to see if we get a different error.
        // Actually, looking at docs, genAI.getGenerativeModel is the main way.
        // There is no helper to list models in the client SDK easily without the ModelService which might not be exported.

        // Let's try to just hit the 1.5 pro model and log the result
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.5-pro: ", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-pro:", error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.0-pro: ", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.0-pro:", error.message);
    }
}

listModels();
