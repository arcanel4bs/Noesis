import { Message } from "@/app/types/chat";
import { SupabaseClient } from "@supabase/supabase-js";
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";

export const createCustomMessage = (role: string, content: string): BaseMessage => {
  return new (role === 'human' ? HumanMessage : AIMessage)({ content });
};

export async function updateResearchSessionWithMessage(
  userId: string,
  sessionId: string,
  message: Message,
  supabaseClient: SupabaseClient
): Promise<void> {
  const { data: session } = await supabaseClient
    .from("research_sessions")
    .select("messages")
    .eq("id", sessionId)
    .single();

  const updatedMessages = [...(session?.messages || []), message];

  await supabaseClient
    .from("research_sessions")
    .update({ 
      messages: updatedMessages,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId)
    .eq("user_id", userId);
}