import { NextResponse } from "next/server";
import { supabase } from "@/backend/supabaseClient";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";

// Use the Node.js runtime and disable caching for streaming responses
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const agentModel = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.0-flash-thinking-exp-01-21",
  apiKey: process.env.GEMINI_API_KEY,
});

interface TimelineEvent {
  type: "agent_start" | "agent_end" | "agent_error";
  agent: string;
  timestamp: Date;
  error?: string;
}


interface AgentState {
  query: string;
  urls: string[];
  search_results: string;
  visited_urls: string[];
  report_draft: string;
  iteration_count: number;
  max_iterations: number;
  agent_status: { [agentName: string]: string };
  timeline_events: TimelineEvent[];
  messages: BaseMessage[];
}

async function researchNode(
  state: AgentState,
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<AgentState> {
  console.log("Researcher Agent running...");
  writer.write(new TextEncoder().encode(
    `data: ${JSON.stringify({
      agent_status: { researcher: "working" },
      timeline_events: [{ type: "agent_start", agent: "researcher", timestamp: new Date() }]
    })}\n\n`
  ));

  const query = state.query;
  try {
    console.log("Agent Model in Researcher Node", agentModel);
    const searchPrompt = `Perform a web search for the query: "${query}". Return the results as a JSON object.
The JSON object should have two keys: "results" and "visited_urls".
"results" should be a list of search result objects, where each object has "title", "url", and "content" (snippet).
"visited_urls" should be a list of URLs that were visited during the search.`;

    const modelResponse = await agentModel.invoke([
      new HumanMessage({ content: searchPrompt }),
    ]);
    console.log("Model Response from Gemini Search:", modelResponse);

    let searchData;
    try {
      const jsonString = (modelResponse.content as string).replace(
        /```json\n?([\s\S]*?)\n?```/g,
        "$1"
      );
      searchData = JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing JSON response from Gemini:", error);
      console.error("Raw response content:", modelResponse.content);
      searchData = { results: [], visited_urls: [] };
    }
    const searchResults = JSON.stringify(searchData.results);
    const visitedUrls = searchData.visited_urls || [];
    const updatedState: AgentState = {
      ...state,
      agent_status: { researcher: "idle" },
      timeline_events: [{ type: "agent_end", agent: "researcher", timestamp: new Date() }],
      search_results: searchResults,
      visited_urls: visitedUrls,
      messages: [...state.messages, new HumanMessage({ content: `Search results: ${searchResults}` })],
      iteration_count: state.iteration_count + 1,
    };

    writer.write(new TextEncoder().encode(
      `data: ${JSON.stringify({ ...updatedState, agent_status: { researcher: "idle" } })}\n\n`
    ));
    return updatedState;
  } catch (error: unknown) {
    console.error("Researcher Agent Error:", error);
    writer.write(new TextEncoder().encode(
      `data: ${JSON.stringify({
        agent_status: { researcher: "error" },
        timeline_events: [{
          type: "agent_error",
          agent: "researcher",
          timestamp: new Date(),
          error: (error as Error).message,
        }],
      })}\n\n`
    ));
    return {
      ...state,
      agent_status: { researcher: "error" },
      timeline_events: [{
        type: "agent_error",
        agent: "researcher",
        timestamp: new Date(),
        error: (error as Error).message,
      }],
    };
  }
}

async function writerNode(
  state: AgentState,
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<AgentState> {
  console.log("Writer Agent running...");
  writer.write(new TextEncoder().encode(
    `data: ${JSON.stringify({
      agent_status: { writer: "working" },
      timeline_events: [{ type: "agent_start", agent: "writer", timestamp: new Date() }]
    })}\n\n`
  ));

  const reportDraftPrompt = `Based on the search results: ${state.search_results} and the query: ${state.query}, write a draft research report in markdown format.`;

  try {
    console.log("Agent Model in Writer Node", agentModel);
    console.log("Writer Agent - Iteration", state.iteration_count, "- Search Results:", state.search_results);
    const modelResponse = await agentModel.invoke([
      new HumanMessage({ content: reportDraftPrompt }),
    ]);
    const reportDraft = modelResponse.content as string;
    const updatedState: AgentState = {
      ...state,
      agent_status: { writer: "idle" },
      timeline_events: [{ type: "agent_end", agent: "writer", timestamp: new Date() }],
      report_draft: reportDraft,
      messages: [
        ...state.messages,
        new AIMessage({ content: `Report draft (Iteration ${state.iteration_count}): ${reportDraft}` })
      ],
      iteration_count: state.iteration_count,
    };

    writer.write(new TextEncoder().encode(
      `data: ${JSON.stringify({
        agent_status: { researcher: "working" },
        timeline_events: [{ type: "agent_start", agent: "researcher", timestamp: new Date() }]
      })}\n\n`
    ));
    console.log("SSE Message Sent (researcher status):", { agent_status: { researcher: "working" } });
    writer.write(new TextEncoder().encode(
      `data: ${JSON.stringify({ agent_status: { writer: "idle" } })}\n\n`
    ));
    console.log("SSE Message Sent (writer status):", { agent_status: { writer: "idle" } });
    return updatedState;
  } catch (error: unknown) {
    console.error("Writer Agent Error:", error);
    writer.write(new TextEncoder().encode(
      `data: ${JSON.stringify({
        agent_status: { writer: "error" },
        timeline_events: [{
          type: "agent_error",
          agent: "writer",
          timestamp: new Date(),
          error: (error as Error).message,
        }],
      })}\n\n`
    ));
    return {
      ...state,
      agent_status: { writer: "error" },
      timeline_events: [{
        type: "agent_error",
        agent: "writer",
        timestamp: new Date(),
        error: (error as Error).message,
      }],
    };
  }
}

// Export POST and GET as named exports

export async function POST(req: Request) {
  try {
    const { query, urls, max_iterations } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Set SSE headers by creating a TransformStream
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = (data: unknown) => {
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    let state: AgentState = {
      query,
      urls: urls || [],
      max_iterations,
      iteration_count: 0,
      agent_status: { researcher: "idle", writer: "idle" },
      timeline_events: [],
      messages: [],
      search_results: "",
      visited_urls: [],
      report_draft: "",
    };

    state = await researchNode(state, writer);
    if (state.agent_status.researcher === "error") {
      sendEvent({ error: "Research failed." });
      writer.close();
      return new NextResponse(transformStream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "Content-Encoding": "none",
        },
      });
    }

    state = await writerNode(state, writer);
    if (state.agent_status.writer === "error") {
      sendEvent({ error: "Writing failed." });
      writer.close();
      return new NextResponse(transformStream.readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "Content-Encoding": "none",
        },
      });
    }

    sendEvent({ report: "Research started. Report will be updated." });
    const session_id = Date.now().toString();
    const initialReport = "# Research Report\n\n## Query\n" + query;

    const { error: dbError } = await supabase
      .from("research_sessions")
      .insert({
        id: session_id,
        query,
        urls,
        reports: [initialReport],
        timestamp: new Date(),
      });
    if (dbError) {
      console.error("Supabase Error saving session:", dbError);
      sendEvent({ error: "Supabase error", details: dbError });
    }
    sendEvent({ sessionId: session_id, report: "Research session started and saved." });
    sendEvent({ report: state.report_draft });

    writer.close();
    return new NextResponse(transformStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Encoding": "none",
      },
    });
  } catch (error: unknown) { // Changed 'Error' to 'unknown'
    console.error("Error starting research:", error);
    return NextResponse.json(
      { error: "Failed to start research", details: (error as Error).message }, // Type assertion to Error to access message
      { status: 500 }
    );
  }
}

export async function GET() { // Removed 'req: Request'
  console.log("GET request received at /api/start-research for SSE");
  const transformStream = new TransformStream();
  // Return the stream so the client can connect (e.g., via EventSource)
  return new NextResponse(transformStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Encoding": "none",
    },
  });
}