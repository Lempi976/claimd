"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { authInputClassName } from "@/components/AuthShell";
import ClaimdWordmark from "@/components/ClaimdWordmark";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Board = {
  id: string;
  name: string;
  owner_id: string;
};

type Event = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  event_id: string | null;
  due_date: string | null;
};

async function parseApiResponse(
  res: Response,
  fallbackError: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  let data: { error?: string } = {};
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text) as { error?: string };
    } catch {
      return { ok: false, message: fallbackError };
    }
  }
  if (!res.ok) {
    return { ok: false, message: data.error ?? fallbackError };
  }
  return { ok: true };
}

export default function BoardManageView({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notOwner, setNotOwner] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskEventId, setTaskEventId] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const memberBoardUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/board/${boardId}`
      : `/board/${boardId}`;

  const eventNameById = Object.fromEntries(events.map((e) => [e.id, e.name]));

  const loadData = useCallback(
    async (uid: string) => {
      const supabase = getSupabaseBrowserClient();

      const { data: boardData, error: boardErr } = await supabase
        .from("boards")
        .select("id, name, owner_id")
        .eq("id", boardId)
        .single();

      if (boardErr || !boardData) {
        setLoadError(boardErr?.message ?? "Board not found");
        setLoading(false);
        return;
      }

      if (boardData.owner_id !== uid) {
        setNotOwner(true);
        setLoading(false);
        return;
      }

      setBoard(boardData);

      const [{ data: eventsData }, { data: tasksData }] = await Promise.all([
        supabase
          .from("events")
          .select("id, name")
          .eq("board_id", boardId)
          .order("name"),
        supabase
          .from("tasks")
          .select("id, title, status, event_id, due_date")
          .eq("board_id", boardId)
          .order("title"),
      ]);

      setEvents(eventsData ?? []);
      setTasks(tasksData ?? []);
      setLoading(false);
    },
    [boardId]
  );

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user?.id) {
        router.replace("/login");
        return;
      }

      setUserId(data.user.id);
      await loadData(data.user.id);
    }

    init();
  }, [router, loadData]);

  async function handleCopyLink() {
    await navigator.clipboard.writeText(memberBoardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !eventName.trim()) return;

    setEventError(null);
    setEventSubmitting(true);

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          board_id: boardId,
          name: eventName,
          userId,
        }),
      });

      const result = await parseApiResponse(res, "Failed to add event");
      if (!result.ok) {
        setEventError(result.message);
        return;
      }

      setEventName("");
      await loadData(userId);
    } finally {
      setEventSubmitting(false);
    }
  }

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !taskTitle.trim()) return;

    setTaskError(null);
    setTaskSubmitting(true);

    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          board_id: boardId,
          title: taskTitle,
          due_date: taskDueDate || null,
          event_id: taskEventId || null,
          userId,
        }),
      });

      const result = await parseApiResponse(res, "Failed to add task");
      if (!result.ok) {
        setTaskError(result.message);
        return;
      }

      setTaskTitle("");
      setTaskDueDate("");
      setTaskEventId("");
      await loadData(userId);
    } finally {
      setTaskSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
        <div className="mx-auto w-full max-w-[640px] px-5 py-10 sm:px-6 sm:py-14">
          <ClaimdWordmark />
        </div>
      </main>
    );
  }

  if (notOwner) {
    return (
      <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
        <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-10 sm:px-6 sm:py-14">
          <ClaimdWordmark />
          <section className="mt-12 sm:mt-14">
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A]">
              Not your board
            </h1>
            <p className="mt-3 text-sm text-[#1A1A1A]/55">
              You don&apos;t have permission to manage this board.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-block text-sm font-medium text-[#E8542C] underline underline-offset-2 transition-colors hover:text-[#D14A26]"
            >
              Back to dashboard
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (loadError || !board) {
    return (
      <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
        <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-10 sm:px-6 sm:py-14">
          <ClaimdWordmark />
          <p className="mt-12 text-sm text-red-600" role="alert">
            {loadError ?? "Board not found"}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm text-[#E8542C] underline underline-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
      <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-10 sm:px-6 sm:py-14">
        <div className="flex items-start justify-between gap-4">
          <ClaimdWordmark />
          <Link
            href="/dashboard"
            className="text-sm text-[#1A1A1A]/50 underline underline-offset-2 transition-colors hover:text-[#1A1A1A]/70"
          >
            All boards
          </Link>
        </div>

        <header className="mt-10 sm:mt-12">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
            {board.name}
          </h1>

          <div className="mt-6 rounded-xl border border-[#E8542C]/20 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium tracking-wide text-[#1A1A1A]/45 uppercase">
              Member link
            </p>
            <p className="mt-2 break-all text-sm font-medium text-[#1A1A1A]">
              {memberBoardUrl}
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="mt-3 rounded-lg bg-[#E8542C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D14A26]"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-[#1A1A1A]">
            Events
          </h2>

          {events.length === 0 ? (
            <p className="mt-4 text-sm text-[#1A1A1A]/50">No events yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#1A1A1A] shadow-sm shadow-[#1A1A1A]/5"
                >
                  {ev.name}
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={handleAddEvent}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="event-name" className="sr-only">
                Event name
              </label>
              <input
                id="event-name"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="New event name"
                required
                className={authInputClassName}
              />
            </div>
            <button
              type="submit"
              disabled={eventSubmitting}
              className="shrink-0 rounded-xl border border-[#1A1A1A]/15 bg-white px-5 py-3 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#E8542C]/30 hover:bg-[#FFFDFB] disabled:opacity-60"
            >
              {eventSubmitting ? "Adding…" : "Add event"}
            </button>
          </form>
          {eventError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {eventError}
            </p>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-[#1A1A1A]">
            Tasks
          </h2>

          {tasks.length === 0 ? (
            <p className="mt-4 text-sm text-[#1A1A1A]/50">No tasks yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl bg-white px-4 py-3 shadow-sm shadow-[#1A1A1A]/5"
                >
                  <p className="font-medium text-[#1A1A1A]">{task.title}</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]/50">
                    <span className="capitalize">{task.status}</span>
                    {" · "}
                    {task.event_id
                      ? eventNameById[task.event_id] ?? "Event"
                      : "General"}
                    {task.due_date && (
                      <>
                        {" · "}
                        Due {task.due_date}
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={handleAddTask}
            className="mt-6 flex flex-col gap-4 rounded-xl border border-[#1A1A1A]/8 bg-white p-5 shadow-sm"
          >
            <div>
              <label
                htmlFor="task-title"
                className="mb-2 block text-sm font-medium text-[#1A1A1A]/70"
              >
                Title
              </label>
              <input
                id="task-title"
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title"
                required
                className={authInputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="task-due"
                className="mb-2 block text-sm font-medium text-[#1A1A1A]/70"
              >
                Due date <span className="font-normal text-[#1A1A1A]/45">(optional)</span>
              </label>
              <input
                id="task-due"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className={authInputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="task-event"
                className="mb-2 block text-sm font-medium text-[#1A1A1A]/70"
              >
                Event
              </label>
              <select
                id="task-event"
                value={taskEventId}
                onChange={(e) => setTaskEventId(e.target.value)}
                className={authInputClassName}
              >
                <option value="">General / no event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>

            {taskError && (
              <p className="text-sm text-red-600" role="alert">
                {taskError}
              </p>
            )}

            <button
              type="submit"
              disabled={taskSubmitting}
              className="rounded-xl bg-[#E8542C] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#D14A26] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {taskSubmitting ? "Adding…" : "Add task"}
            </button>
          </form>
        </section>

        <Link
          href={`/board/${boardId}`}
          className="mt-12 text-sm text-[#1A1A1A]/50 underline underline-offset-2 transition-colors hover:text-[#1A1A1A]/70"
        >
          Preview member board →
        </Link>
      </div>
    </main>
  );
}
