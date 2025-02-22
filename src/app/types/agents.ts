import { BaseMessage } from "@langchain/core/messages";

export type AgentStatus = {
  researcher: string;
  writer: string;
  // Allow additional agent statuses if needed
  [key: string]: string;
};

export interface TimelineEvent {
  type: "agent_start" | "agent_end" | "agent_error";
  agent: string;
  timestamp: Date;
  error?: string;
}

export interface AgentState {
  sessionId: string;
  userId: string;
  query: string;
  messages: any[];
  urls: string[];
  visited_urls: string[];
  search_results: string;
  agent_status: {
    researcher: 'idle' | 'working' | 'error';
    writer: 'idle' | 'working' | 'error';
  };
  timeline_events: any[];
  iteration_count: number;
  max_iterations: number;
  report_draft: string;
  previous_report?: string;
  conversation_history?: string;
  final_report?: string;
}