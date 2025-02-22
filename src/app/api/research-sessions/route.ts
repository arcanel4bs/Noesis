// src/app/api/research-sessions/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/backend/supabaseServerClient";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("No userId found in auth context");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching sessions for userId:", userId);
    const { data, error } = await supabaseServerClient
      .from("research_sessions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Found sessions:", data?.length || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in GET /api/research-sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}