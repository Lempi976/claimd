import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type AuthSuccess = {
  user: { id: string };
  board: { id: string; owner_id: string };
};

type AuthFailure = {
  error: NextResponse;
};

export async function requireBoardOwner(
  boardId: string,
  clientUserId: string | undefined
): Promise<AuthSuccess | AuthFailure> {
  if (!boardId) {
    return {
      error: NextResponse.json({ error: "board_id is required" }, { status: 400 }),
    };
  }

  if (!clientUserId) {
    return {
      error: NextResponse.json({ error: "userId is required" }, { status: 400 }),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  if (user.id !== clientUserId) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const { data: board, error: boardError } = await getSupabaseAdmin()
    .from("boards")
    .select("id, owner_id")
    .eq("id", boardId)
    .single();

  if (boardError || !board) {
    return {
      error: NextResponse.json({ error: "Board not found" }, { status: 404 }),
    };
  }

  if (board.owner_id !== user.id) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, board };
}
