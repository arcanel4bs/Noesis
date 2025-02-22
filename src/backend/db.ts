import { supabase } from './supabaseClient';
import type { ResearchSession } from './models';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BaseMessage } from "@langchain/core/messages";

export async function createResearchSession(
  userId: string,
  query: string,
  client?: SupabaseClient
): Promise<ResearchSession | null> {
  try {
    const sb = client || supabase;
    if (!sb) {
      console.error("No Supabase client available");
      return null;
    }

    const id = Date.now().toString();
    const initialSession: Partial<ResearchSession> = {
      id,
      user_id: userId,
      query,
      urls: [],
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Creating session with data:", { userId, id, query });
    const { data, error } = await sb
      .from('research_sessions')
      .insert(initialSession)
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating research session:", error);
      return null;
    }

    console.log("Successfully created session:", data);
    return data;
  } catch (error) {
    console.error("Unexpected error creating research session:", error);
    return null;
  }
}

export async function getResearchSession(
  userId: string,
  sessionId: string,
  client?: SupabaseClient
): Promise<ResearchSession | null> {
  const sb = client || supabase;
  const { data, error } = await sb
    .from('research_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  if (error) {
    console.error("Error fetching research session:", error);
    return null;
  }
  return data;
}

export async function updateResearchSessionMessages(
  userId: string,
  sessionId: string,
  messages: BaseMessage[],
  client?: SupabaseClient
): Promise<ResearchSession | null> {
  try {
    const plainMessages = messages.map(msg => {
      return {
        role: msg._getType?.() || 'human',
        content: typeof msg.content === 'string' ? msg.content : '',
        timestamp: new Date().toISOString()
      };
    });

    console.log("Updating messages for session:", sessionId, "with:", plainMessages);

    const sb = client || supabase;
    const { data, error } = await sb
      .from("research_sessions")
      .update({
        messages: plainMessages,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating messages:", error);
      return null;
    }
    
    console.log("Successfully updated messages:", data);
    return data;
  } catch (error) {
    console.error("Unexpected error updating messages:", error);
    return null;
  }
}

export async function updateResearchSessionFinalReport(
  userId: string,
  sessionId: string,
  finalReport: string,
  client?: SupabaseClient
): Promise<boolean> {
  const sb = client || supabase;
  const { error } = await sb
    .from('research_sessions')
    .update({ final_report: finalReport, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);
  if (error) {
    console.error("Error updating final report:", error);
    return false;
  }
  return true;
}
