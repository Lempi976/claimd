import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireBoardOwner } from "@/lib/require-board-owner";

export async function POST(request: Request) {
  let body: {
    board_id?: string;
    title?: string;
    due_date?: string | null;
    event_id?: string | null;
    userId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { board_id, title, due_date, event_id, userId } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const auth = await requireBoardOwner(board_id ?? "", userId);
  if ("error" in auth) {
    return auth.error;
  }

  const insert: {
    board_id: string;
    title: string;
    status: string;
    due_date?: string | null;
    event_id?: string | null;
  } = {
    board_id: board_id!,
    title: title.trim(),
    status: "unclaimed",
    due_date: due_date?.trim() || null,
    event_id: event_id || null,
  };

  const { data, error } = await getSupabaseAdmin()
    .from("tasks")
    .insert(insert)
    .select("id, title, status, event_id, due_date, board_id")
    .single();

  if (error) {
    console.error("[api/tasks/create] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
