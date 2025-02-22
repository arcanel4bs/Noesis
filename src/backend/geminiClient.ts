import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

// Optionally, you can pass configuration options to GoogleGenerativeAI:
// e.g., { temperature: 0.5, maxTokens: 256, ... }
export const genAI = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.0-flash-thinking-exp-01-21",
  apiKey: geminiApiKey,
});
