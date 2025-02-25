import { NextRequest } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { AgentState } from "@/app/types/agents";
import { updateResearchSessionMessages, updateResearchSessionFinalReport } from "@/backend/db";
import { SupabaseClientType } from "@/app/types/index";

export function createSSEHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Content-Encoding": "none",
  };
}

export const sendEvent = (writer: WritableStreamDefaultWriter<Uint8Array>, data: unknown): Promise<void> => {
  const encoder = new TextEncoder();
  return writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
};

export const researchNode = async (
  state: AgentState,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  supabaseClient: SupabaseClientType
): Promise<AgentState> => {
  sendEvent(writer, {
    agent_status: { researcher: "working" },
    timeline_events: [{ type: "agent_start", agent: "researcher", timestamp: new Date() }],
  });
  try {
    const searchPrompt = `Given the following conversation history and previous research:

Previous Report:
${state.previous_report || 'None'}

Conversation History:
${state.conversation_history || 'No previous conversation'}

New Question:
"${state.query}"

Perform a focused web search to answer this follow-up question. Return the results strictly as a JSON object with exactly two keys: "results" (an array of objects, each containing "title", "url", and "content" – a snippet of relevant text) and "visited_urls" (an array of strings). Do not include any additional commentary.`;  
    const agentModel = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-thinking-exp-01-21",
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    const modelResponse = await agentModel.invoke([
      new HumanMessage({ content: searchPrompt }),
    ]);
    
    let searchData;
    try {
      const jsonString = (modelResponse.content as string).replace(/```json\n?([\s\S]*?)\n?```/g, "$1");
      searchData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      searchData = { results: [], visited_urls: [] };
    }
    const searchResults = JSON.stringify(searchData.results);
    const visitedUrls = searchData.visited_urls || [];
    const extractedUrls = searchData.results.map((result: any) => result.url);
    
    const updatedState: AgentState = {
      ...state,
      agent_status: { ...state.agent_status, researcher: "idle" },
      timeline_events: [{ type: "agent_end", agent: "researcher", timestamp: new Date() }],
      search_results: searchResults,
      visited_urls: visitedUrls,
      urls: extractedUrls,
      messages: [
        ...state.messages,
        new HumanMessage({ content: `Search results: ${searchResults}` })
      ],
      iteration_count: state.iteration_count + 1,
    };
    
    await supabaseClient
      .from('research_sessions')
      .update({ urls: extractedUrls })
      .eq('id', state.sessionId);

    try {
      await sendEvent(writer, { agent_status: { researcher: "idle" } });
      await updateResearchSessionMessages(
        state.userId, 
        state.sessionId, 
        updatedState.messages, 
        supabaseClient
      );
      return updatedState;
    } catch (dbError) {
      console.error("Database operation failed:", dbError);
      return updatedState;
    }
  } catch (error: unknown) {
    await sendEvent(writer, {
      agent_status: { researcher: "error" },
      timeline_events: [{
        type: "agent_error",
        agent: "researcher",
        timestamp: new Date(),
        error: (error as Error).message,
      }],
    });
    return { ...state, agent_status: { ...state.agent_status, researcher: "error" } };
  }
};

export const writerNode = async (
  state: AgentState,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  supabaseClient: SupabaseClientType
): Promise<AgentState> => {
  sendEvent(writer, {
    agent_status: { writer: "working" },
    timeline_events: [{ type: "agent_start", agent: "writer", timestamp: new Date() }],
  });
  
  const reportDraftPrompt = `Using the following search results:
${state.search_results}

and the query:
${state.query}

Produce a detailed research report exclusively in valid Markdown format. Use proper headings, bullet lists, and any other Markdown constructs as needed. Do not include any commentary outside of the Markdown syntax.`;
  
  try {
    const agentModel = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash-thinking-exp-01-21",
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    const modelResponse = await agentModel.invoke([
      new HumanMessage({ content: reportDraftPrompt }),
    ]);
    
    const reportDraft = modelResponse.content as string;
    const updatedState: AgentState = {
      ...state,
      agent_status: { ...state.agent_status, writer: "idle" },
      timeline_events: [{ type: "agent_end", agent: "writer", timestamp: new Date() }],
      report_draft: reportDraft,
      messages: [
        ...state.messages,
        new AIMessage({ content: `Draft report (Iteration ${state.iteration_count}): ${reportDraft}` })
      ],
    };
    sendEvent(writer, { agent_status: { writer: "idle" } });
    await updateResearchSessionMessages(state.userId, state.sessionId, updatedState.messages, supabaseClient);
    return updatedState;
  } catch (error: unknown) {
    sendEvent(writer, {
      agent_status: { writer: "error" },
      timeline_events: [{
        type: "agent_error",
        agent: "writer",
        timestamp: new Date(),
        error: (error as Error).message,
      }],
    });
    return { ...state, agent_status: { ...state.agent_status, writer: "error" } };
  }
};

export const refinementNode = async (
  state: AgentState,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  req: NextRequest,
  supabaseClient: SupabaseClientType
): Promise<AgentState> => {
  sendEvent(writer, { status: "Refining report" });
  try {
    const promptTemplate = ChatPromptTemplate.fromTemplate(
      `You are a highly knowledgeable research assistant. Based on the following information, produce a final, comprehensive research report exclusively in valid Markdown format.

Query: {query}

Search Results: {search_results}

Draft Report: {draft_report}

Final Report:`
    );

    const groqLLM = new ChatGroq({
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0,
      maxRetries: 2,
    });
  
    const chain = promptTemplate.pipe(groqLLM);
    const groqResponse = await chain.invoke({
      query: state.query,
      search_results: state.search_results,
      draft_report: state.report_draft,
    });
  
    const finalReport = String(groqResponse.content);
    const finalReportClean = finalReport.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    sendEvent(writer, { status: "Report refinement complete", report: finalReportClean, answer: finalReportClean });
  
    const updatedState: AgentState = {
      ...state,
      final_report: finalReportClean,
    };
    await updateResearchSessionMessages(state.userId, state.sessionId, updatedState.messages, supabaseClient);
    if (updatedState.final_report) {
      await updateResearchSessionFinalReport(state.userId, state.sessionId, updatedState.final_report, supabaseClient);
    }
    return updatedState;
  } catch (error: unknown) {
    sendEvent(writer, {
      error: "Refinement flow failed",
      details: error instanceof Error ? error.message : String(error),
    });
    console.error("Refinement flow error:", error);
    return state;
  }
};