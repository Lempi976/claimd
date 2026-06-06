import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  let body: { taskId?: string; claimerName?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taskId, claimerName } = body;

  if (!taskId || !claimerName?.trim()) {
    return NextResponse.json(
      { error: "taskId and claimerName are required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("claims")
      .insert({
        task_id: taskId,
        claimer_name: claimerName.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("[api/claim] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/claim] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to claim task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
