import { supabase } from "@/lib/supabase";

import NamePicker from "./NamePicker";
import TaskList from "./TaskList";

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
        <header className="mb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
            {boardName}
          </h1>
          <div className="mt-5">
            <NamePicker members={members ?? []} boardId={id} />
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium tracking-wide text-[#1A1A1A]/50 uppercase">
            Tasks
          </h2>

          {!tasks?.length ? (
            <p className="rounded-xl bg-white px-5 py-8 text-center text-sm text-[#1A1A1A]/60 shadow-sm">
              No tasks yet
            </p>
          ) : (
            <TaskList
              tasks={tasks}
              events={events ?? []}
              boardId={id}
            />
          )}
        </section>
      </div>
    </main>
  );
}
