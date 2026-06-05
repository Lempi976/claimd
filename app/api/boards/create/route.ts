import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function generateJoinCode() {
  return randomBytes(12).toString("base64url");
}

export async function POST(request: Request) {
  let body: { name?: string; memberNames?: string; userId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, memberNames, userId: clientUserId } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Board name is required" }, { status: 400 });
  }

  if (!clientUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.id !== clientUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const memberList = (memberNames ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const joinCode = generateJoinCode();
  const admin = getSupabaseAdmin();

  const { data: board, error: boardError } = await admin
    .from("boards")
    .insert({
      name: name.trim(),
      join_code: joinCode,
      owner_id: user.id,
    })
    .select("id, join_code")
    .single();

  if (boardError) {
    console.error("[api/boards/create] board error:", boardError);
    return NextResponse.json({ error: boardError.message }, { status: 500 });
  }

  if (!board) {
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }

  if (memberList.length > 0) {
    const { error: membersError } = await admin.from("members").insert(
      memberList.map((memberName) => ({
        board_id: board.id,
        name: memberName,
      }))
    );

    if (membersError) {
      console.error("[api/boards/create] members error:", membersError);
      await admin.from("boards").delete().eq("id", board.id);
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: board.id, join_code: board.join_code });
}
