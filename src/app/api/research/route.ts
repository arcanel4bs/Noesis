import { NextResponse, NextRequest } from "next/server";
import { supabaseServerClient } from "@/backend/supabaseServerClient";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";
import { auth } from "@clerk/nextjs/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  createResearchSession,
  getResearchSession,
  updateResearchSessionMessages,
  updateResearchSessionFinalReport,
} from "@/backend/db";
import type { AgentState } from "@/app/types/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Utility to create SSE headers.
function createSSEHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Content-Encoding": "none",
  };
}

// Utility to send an SSE event.
const sendEvent = (writer: WritableStreamDefaultWriter<Uint8Array>, data: unknown) => {
  const encoder = new TextEncoder();
  writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
};

// Research flow: Perform a web search using the Gemini-based agent.
async function researchNode(
  state: AgentState,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  supabaseClient: any
): Promise<AgentState> {
  sendEvent(writer, {
    agent_status: { researcher: "working" },
    timeline_events: [{ type: "agent_start", agent: "researcher", timestamp: new Date() }],
  });
  try {
    const searchPrompt = `Perform a web search for the query: "${state.query}". Return the results strictly as a JSON object with exactly two keys: "results" (an array of objects, each containing "title", "url", and "content" – a snippet of relevant text) and "visited_urls" (an array of strings). Do not include any additional commentary.`;
    
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
    } catch (error) {
      searchData = { results: [], visited_urls: [] };
    }
    const searchResults = JSON.stringify(searchData.results);
    const visitedUrls = searchData.visited_urls || [];
    
    const updatedState: AgentState = {
      ...state,
      agent_status: { ...state.agent_status, researcher: "idle" },
      timeline_events: [{ type: "agent_end", agent: "researcher", timestamp: new Date() }],
      search_results: searchResults,
      visited_urls: visitedUrls,
      messages: [
        ...state.messages,
        new HumanMessage({ content: `Search results: ${searchResults}` })
      ],
      iteration_count: state.iteration_count + 1,
    };
    
    sendEvent(writer, { agent_status: { researcher: "idle" } });
    await updateResearchSessionMessages(state.userId, state.sessionId, updatedState.messages, supabaseClient);
    return updatedState;
  } catch (error: unknown) {
    sendEvent(writer, {
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
}

// Writer flow: Generate an initial draft report using the Gemini-based model.
async function writerNode(
  state: AgentState,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  supabaseClient: any
): Promise<AgentState> {
  sendEvent(writer, {
    agent_status: { writer: "working" },
    timeline_events: [{ type: "agent_start", agent: "writer", timestamp: new Date() }],
  });
  
  const reportDraftPrompt = `Using the following context:

Previous Report:
${state.previous_report || 'None'}

Conversation History:
${state.conversation_history || 'No previous conversation'}

Search Results:
${state.search_results}

Current Query:
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
}

// Refinement flow: Use the Groq thinking model to improve the draft report.
async function refinementNode(
  state: AgentState,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  req: NextRequest,
  supabaseClient: any
): Promise<AgentState> {
  sendEvent(writer, { status: "Refining report" });
  try {
    const promptTemplate = ChatPromptTemplate.fromTemplate(
      `You are a highly knowledgeable research assistant. Based on the following information, produce a final, comprehensive research report exclusively in valid Markdown format.

Previous Report:
{previous_report}

Conversation History:
{conversation_history}

Current Query: {query}

Search Results: {search_results}

Draft Report: {draft_report}

Final Report:`
    );
    console.log("Refinement Node: Formatted prompt with variables:", {
      query: state.query,
      search_results: state.search_results,
      draft_report: state.report_draft,
    });
  
    const groqLLM = new ChatGroq({
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0,
      maxRetries: 2,
    });
  
    const chain = promptTemplate.pipe(groqLLM);
    console.log("Refinement Node: Invoking Groq chain with formatted prompt...");
    const groqResponse = await chain.invoke({
      query: state.query,
      search_results: state.search_results,
      draft_report: state.report_draft,
      previous_report: state.previous_report || 'None',
      conversation_history: state.conversation_history || 'No previous conversation'
    });
  
    console.log("Refinement Node: Groq response received:", groqResponse);
  
    const finalReport = String(groqResponse.content);
    const finalReportClean = finalReport.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    console.log("Final Report (cleaned):", finalReportClean);
    sendEvent(writer, { status: "Report refinement complete", report: finalReportClean, answer: finalReportClean });
  
    const { error: updateError } = await supabaseClient
      .from("research_sessions")
      .update({ final_report: finalReportClean })
      .eq("id", state.sessionId || "");
    if (updateError) {
      sendEvent(writer, { error: "DB update error", details: updateError });
    }
  
    const updatedState: AgentState = {
      ...state,
      final_report: finalReportClean,
    };
    await updateResearchSessionMessages(state.userId, state.sessionId, updatedState.messages, supabaseClient);
    if (state.final_report) {
      await updateResearchSessionFinalReport(state.userId, state.sessionId, state.final_report, supabaseClient);
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
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check using Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    // 2. Parse request body
    const { query, urls, max_iterations, sessionId } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }
  
    // 3. Set up the SSE stream
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();
    const _sendEvent = (data: unknown) => {
      writer.write(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
    };
  
    // 4. Use the server client (with service role key) instead of a ClerkSupabaseClient.
    const supabaseClient = supabaseServerClient;
  
    // 5. Load or create research session
    let session;
    try {
      if (sessionId) {
        session = await getResearchSession(userId, sessionId, supabaseClient);
        if (!session) {
          console.log("Session not found, creating new session");
          session = await createResearchSession(userId, query, supabaseClient);
        }
      } else {
        console.log("Creating new session");
        session = await createResearchSession(userId, query, supabaseClient);
      }
      
      if (!session) {
        const error = "Failed to create or load research session.";
        console.error(error);
        sendEvent(writer, { error });
        writer.close();
        return new NextResponse(transformStream.readable, { headers: createSSEHeaders() });
      }

      // Send immediate confirmation of session creation
      sendEvent(writer, { 
        status: "success",
        sessionId: session.id 
      });
    } catch (error) {
      console.error("Session creation error:", error);
      sendEvent(writer, { 
        error: "Session creation failed",
        details: error instanceof Error ? error.message : String(error)
      });
      writer.close();
      return new NextResponse(transformStream.readable, { headers: createSSEHeaders() });
    }
    
    // 6. Append the new user prompt to the conversation memory
    const updatedMessages = [
      ...(session.messages || []),
      { role: "human", content: query, timestamp: new Date().toISOString() }
    ];
    await updateResearchSessionMessages(userId, session.id, updatedMessages, supabaseClient);
  
    // 7. Create initial AgentState using the conversation memory
    let state: AgentState = {
      userId,
      query,
      urls: urls || [],
      max_iterations,
      iteration_count: 0,
      agent_status: { researcher: "idle", writer: "idle" },
      timeline_events: [],
      messages: updatedMessages,
      search_results: "",
      visited_urls: [],
      report_draft: "",
      sessionId: session.id,
      previous_report: session.final_report,
      conversation_history: updatedMessages.map(msg => 
        `${msg.role === 'human' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n')
    };
  
    // 8. Run the research, writer, and refinement flows
    state = await researchNode(state, writer, supabaseClient);
    if (state.agent_status.researcher === "error") {
      _sendEvent({ error: "Research step failed." });
      writer.close();
      return new NextResponse(transformStream.readable, { headers: createSSEHeaders() });
    }
    state = await writerNode(state, writer, supabaseClient);
    if (state.agent_status.writer === "error") {
      _sendEvent({ error: "Writer step failed." });
      writer.close();
      return new NextResponse(transformStream.readable, { headers: createSSEHeaders() });
    }
    state = await refinementNode(state, writer, req, supabaseClient);
  
    // 9. Close the writer and return the SSE stream
    writer.close();
    return new NextResponse(transformStream.readable, { headers: createSSEHeaders() });
  } catch (error: any) {
    return NextResponse.json(
      { error: "An API error occurred", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const transformStream = new TransformStream();
  return new NextResponse(transformStream.readable, { headers: createSSEHeaders() });
}