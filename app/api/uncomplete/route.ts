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
    const admin = getSupabaseAdmin();

    const { count, error: countError } = await admin
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId);

    if (countError) {
      console.error("[api/uncomplete] claims count error:", countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const { data, error } = await admin
      .from("tasks")
      .update({
        status: (count ?? 0) > 0 ? "in_progress" : "unclaimed",
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("[api/uncomplete] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/uncomplete] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to undo task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
