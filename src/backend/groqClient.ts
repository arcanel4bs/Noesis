import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const llm = new ChatGroq({
  model: "mixtral-8x7b-32768",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
  // other params...
});


const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant that translates {input_language} to {output_language}.",
  ],
  ["human", "{input}"],
]);

const chain = prompt.pipe(llm);
await chain.invoke({
  input_language: "English",
  output_language: "German",
  input: "I love programming.",
});