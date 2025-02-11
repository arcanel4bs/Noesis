import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

export const genAI = new GoogleGenerativeAI(geminiApiKey);
