import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServerClient } from "@/backend/supabaseServerClient";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: session, error } = await supabaseServerClient
      .from("research_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error) {
      // Handle the specific case of no rows found
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}