import { supabase } from "@/lib/supabase";

import BoardBody from "./BoardBody";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    { data: board },
    { data: members },
    { data: events },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("boards").select("name").eq("id", id).single(),
    supabase.from("members").select("id, name").eq("board_id", id),
    supabase
      .from("events")
      .select("id, name")
      .eq("board_id", id)
      .order("created_at"),
    supabase
      .from("tasks")
      .select("id, title, status, event_id")
      .eq("board_id", id),
  ]);

  const boardName = board?.name ?? "Board";

  return (
    <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
      <div className="mx-auto flex w-full max-w-[560px] flex-col px-5 py-10 sm:px-6 sm:py-12">
        <BoardBody
          boardId={id}
          boardName={boardName}
          members={members ?? []}
          events={events ?? []}
          tasks={tasks ?? []}
        />
      </div>
    </main>
  );
}
