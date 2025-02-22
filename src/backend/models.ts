import { BaseMessage } from "@langchain/core/messages";

export interface ResearchSession {
    id: string;
    user_id: string;
    query: string;
    urls: string[];
    messages: BaseMessage[];
    final_report: string | null;
    created_at: string;
    updated_at: string;
}