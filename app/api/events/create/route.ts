import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireBoardOwner } from "@/lib/require-board-owner";

export async function POST(request: Request) {
  let body: { board_id?: string; name?: string; userId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { board_id, name, userId } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const auth = await requireBoardOwner(board_id ?? "", userId);
  if ("error" in auth) {
    return auth.error;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("events")
    .insert({
      board_id: board_id!,
      name: name.trim(),
    })
    .select("id, name, board_id")
    .single();

  if (error) {
    console.error("[api/events/create] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
