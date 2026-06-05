"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Event = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  assigned_member_id: string | null;
  event_id: string | null;
};

type TaskStatus = "unclaimed" | "in_progress" | "done";

type PendingAction = "claim" | "complete" | "release";

type TaskSection = {
  key: string;
  title: string;
  tasks: Task[];
};

function memberStorageKey(boardId: string) {
  return `claimd_member_${boardId}`;
}

function resolveTaskStatus(task: Task): TaskStatus {
  if (task.status === "done") return "done";
  if (task.status === "in_progress" || task.assigned_member_id) {
    return "in_progress";
  }
  return "unclaimed";
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    unclaimed: "bg-neutral-200 text-neutral-600",
    in_progress: "bg-amber-100 text-amber-900",
    done: "bg-green-100 text-green-800",
  };

  const labels: Record<TaskStatus, string> = {
    unclaimed: "unclaimed",
    in_progress: "in progress",
    done: "done",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

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

function buildTaskSections(events: Event[], tasks: Task[]): TaskSection[] {
  const eventIds = new Set(events.map((e) => e.id));
  const sections: TaskSection[] = [];

  for (const event of events) {
    const eventTasks = tasks.filter((t) => t.event_id === event.id);
    if (eventTasks.length > 0) {
      sections.push({
        key: event.id,
        title: event.name,
        tasks: eventTasks,
      });
    }
  }

  const generalTasks = tasks.filter(
    (t) => !t.event_id || !eventIds.has(t.event_id)
  );
  if (generalTasks.length > 0) {
    sections.push({
      key: "general",
      title: "General",
      tasks: generalTasks,
    });
  }

  return sections;
}

export default function TaskList({
  tasks,
  events,
  boardId,
  memberNames,
}: {
  tasks: Task[];
  events: Event[];
  boardId: string;
  memberNames: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<{
    taskId: string;
    action: PendingAction;
  } | null>(null);

  const sections = useMemo(
    () => buildTaskSections(events, tasks),
    [events, tasks]
  );

  function isPending(taskId: string, action: PendingAction) {
    return pending?.taskId === taskId && pending.action === action;
  }

  function isTaskBusy(taskId: string) {
    return pending?.taskId === taskId;
  }

  async function runAction(
    taskId: string,
    action: PendingAction,
    endpoint: string,
    body: Record<string, string>,
    fallbackError: string
  ) {
    setPending({ taskId, action });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await parseApiResponse(res, fallbackError);
      if (!result.ok) {
        alert(result.message);
        return;
      }

      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function claimTask(taskId: string) {
    const raw = localStorage.getItem(memberStorageKey(boardId));
    if (!raw) {
      alert("Pick your name first.");
      return;
    }

    let memberId: string;
    try {
      const parsed = JSON.parse(raw) as { id?: string };
      if (!parsed.id) {
        alert("Pick your name first.");
        return;
      }
      memberId = parsed.id;
    } catch {
      alert("Pick your name first.");
      return;
    }

    await runAction(taskId, "claim", "/api/claim", { taskId, memberId }, "Failed to claim task");
  }

  async function completeTask(taskId: string) {
    await runAction(
      taskId,
      "complete",
      "/api/complete",
      { taskId },
      "Failed to mark task done"
    );
  }

  async function releaseTask(taskId: string) {
    await runAction(
      taskId,
      "release",
      "/api/release",
      { taskId },
      "Failed to release task"
    );
  }

  function renderTaskCard(task: Task) {
    const status = resolveTaskStatus(task);
    const isUnclaimed = status === "unclaimed";
    const isInProgress = status === "in_progress";
    const assigneeLabel = task.assigned_member_id
      ? `claimed by ${memberNames[task.assigned_member_id] ?? "someone"}`
      : "nobody yet";

    return (
      <li
        key={task.id}
        className="rounded-xl bg-white p-4 shadow-sm shadow-[#1A1A1A]/5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[#1A1A1A]">{task.title}</p>
            <p className="mt-1 text-sm text-[#1A1A1A]/50">{assigneeLabel}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {isUnclaimed && (
          <button
            type="button"
            onClick={() => claimTask(task.id)}
            disabled={isTaskBusy(task.id)}
            className="mt-4 rounded-lg bg-[#E8542C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D14A26] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending(task.id, "claim") ? "Claiming…" : "Claim"}
          </button>
        )}

        {isInProgress && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => completeTask(task.id)}
              disabled={isTaskBusy(task.id)}
              className="rounded-lg border border-green-600 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending(task.id, "complete") ? "Saving…" : "Mark done"}
            </button>
            <button
              type="button"
              onClick={() => releaseTask(task.id)}
              disabled={isTaskBusy(task.id)}
              className="text-xs text-[#1A1A1A]/45 transition-colors hover:text-[#1A1A1A]/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending(task.id, "release") ? "Releasing…" : "Release"}
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section key={section.key}>
          <h3 className="font-display text-xl font-bold tracking-tight text-[#1A1A1A]">
            {section.title}
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {section.tasks.map((task) => renderTaskCard(task))}
          </ul>
        </section>
      ))}
    </div>
  );
}
