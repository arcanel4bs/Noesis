import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServerClient } from "@/backend/supabaseServerClient";

export async function GET(
  request: Request,
  context: { params: { sessionId: string } }
) {
  try {
    const sessionId = context.params.sessionId;
    const { userId } = await auth();
    if (!userId) {
      console.error("No userId found in auth context");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching session:", sessionId, "for user:", userId);
    const { data, error } = await supabaseServerClient
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}