
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getGeminiModel = (model: string = "gemini-1.5-flash") => {
    return genAI.getGenerativeModel({ model });
};

export const generateAssistantResponse = async (prompt: string, context: string = "") => {
    const model = getGeminiModel();

    const fullPrompt = context
        ? `System: You are an expert research assistant. Use the following context to answer the user question.\n\nContext:\n${context}\n\nUser Question: ${prompt}`
        : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
};
