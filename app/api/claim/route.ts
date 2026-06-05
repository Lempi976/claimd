import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  let body: { taskId?: string; memberId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taskId, memberId } = body;

  if (!taskId || !memberId) {
    return NextResponse.json(
      { error: "taskId and memberId are required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("tasks")
      .update({
        assigned_member_id: memberId,
        status: "in_progress",
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("[api/claim] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/claim] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to claim task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
