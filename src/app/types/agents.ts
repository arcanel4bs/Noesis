import { BaseMessage } from "@langchain/core/messages";

export interface AgentStatus {
  researcher: 'idle' | 'working' | 'error';
  writer: 'idle' | 'working' | 'error';
}

export interface TimelineEvent {
  type: "agent_start" | "agent_end" | "agent_error";
  agent: string;
  timestamp: Date;
  error?: string;
}

export interface AgentState {
  userId: string;
  sessionId: string;
  query: string;
  urls: string[];
  messages: BaseMessage[];
  search_results: string;
  visited_urls: string[];
  report_draft: string;
  final_report: string | null;
  previous_report: string | null;
  conversation_history: string | null;
  agent_status: {
    researcher?: 'idle' | 'working' | 'error';
    writer?: 'idle' | 'working' | 'error';
  };
  timeline_events: TimelineEvent[];
  iteration_count: number;
  max_iterations: number;
}