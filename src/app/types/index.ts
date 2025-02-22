export interface ResearchSession {
  id: string;
  user_id: string;
  query: string;
  urls: string[];
  messages: any[];         // This will store our conversation history (JSON array)
  final_report?: string;   // Final, refined report from the agent flows
  conversation_history: any[];
  created_at: Date;
  updated_at: Date;
}