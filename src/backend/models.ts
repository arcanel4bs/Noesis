export interface ResearchSession {
    id: string;
    user_id: string;
    query: string;
    urls: string[];
    messages: any[]; // You can later tighten this type if needed
    created_at: string;
    updated_at: string;
    final_report?: string;
  }