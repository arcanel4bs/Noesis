import { SupabaseClient } from '@supabase/supabase-js';
import { BaseMessage } from "@langchain/core/messages";

export type SupabaseClientType = SupabaseClient;

export interface ResearchSession {
  id: string;
  user_id: string;
  query: string;
  urls?: string[];
  messages?: BaseMessage[];
  final_report?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type Database = {
  public: {
    Tables: {
      research_sessions: {
        Row: ResearchSession;
      };
    };
  };
};