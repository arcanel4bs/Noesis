import { Tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { genAI } from "@/backend/geminiClient";

/**
 * GeminiSearchTool is a class-based tool that uses the Gemini API for web search.
 * It accepts an input query and returns JSON-formatted search results.
 */
export class GeminiSearchTool extends Tool {
  name = "gemini_search";
  description =
    "A tool that uses the Gemini API to perform web searches. It accepts an input query and returns JSON-formatted search results.";
  maxResults: number;

  constructor({ maxResults }: { maxResults: number }) {
    super();
    this.maxResults = maxResults;
  }

  /**
   * run performs the search by constructing a prompt and then calling the GoogleGenerativeAI client's generateText method.
   */
  async run(query: string): Promise<string> {
    const searchPrompt = `Perform a web search for the query: "${query}". Return the results as a JSON object.
The JSON object should have two keys: "results" (an array of search result objects, each with "title", "url", and "content") and "visited_urls" (an array of URLs).
Limit the results to ${this.maxResults} items.`;

    // Use generateText instead of generate.
    const response = await genAI.invoke([
      new HumanMessage({ content: searchPrompt }),
    ]);
    // Remove code fences if present.
    return response.text.replace(/```json\s*([\s\S]*?)\s*```/g, "$1");
  }

  /**
   * _call is the required abstract method implementation from Tool.
   * It delegates the call to the run method.
   */
  async _call(input: string): Promise<string> {
    return this.run(input);
  }
}