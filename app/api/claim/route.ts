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
    const trimmedName = claimerName.trim();
    const admin = getSupabaseAdmin();

    const { data: existing, error: existingError } = await admin
      .from("claims")
      .select()
      .eq("task_id", taskId)
      .eq("claimer_name", trimmedName)
      .maybeSingle();

    if (existingError) {
      console.error("[api/claim] lookup error:", existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(existing);
    }

    const { data, error } = await admin
      .from("claims")
      .insert({
        task_id: taskId,
        claimer_name: trimmedName,
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
