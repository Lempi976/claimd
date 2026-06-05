import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  let body: { taskId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taskId } = body;

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("tasks")
      .update({ status: "done" })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("[api/complete] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/complete] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to complete task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
