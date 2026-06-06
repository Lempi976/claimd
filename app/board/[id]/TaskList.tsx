"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

type Event = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  event_id: string | null;
};

type Claim = {
  id: string;
  task_id: string;
  claimer_name: string;
};

type StoredMember = {
  id: string;
  name: string;
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

function getStoredMember(boardId: string): StoredMember | null {
  const raw = localStorage.getItem(memberStorageKey(boardId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredMember;
    if (parsed.id && parsed.name) return parsed;
  } catch {
    return null;
  }

  return null;
}

function resolveTaskStatus(task: Task, taskClaims: Claim[]): TaskStatus {
  if (task.status === "done") return "done";
  if (taskClaims.length > 0) return "in_progress";
  return "unclaimed";
}

function groupClaimsByTask(claims: Claim[]): Map<string, Claim[]> {
  const map = new Map<string, Claim[]>();
  for (const claim of claims) {
    const existing = map.get(claim.task_id) ?? [];
    existing.push(claim);
    map.set(claim.task_id, existing);
  }
  return map;
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
}: {
  tasks: Task[];
  events: Event[];
  boardId: string;
}) {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pending, setPending] = useState<{
    taskId: string;
    action: PendingAction;
  } | null>(null);

  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  const fetchClaims = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setClaims([]);
      return;
    }

    const { data, error } = await supabase
      .from("claims")
      .select("id, task_id, claimer_name")
      .in("task_id", ids);

    if (!error && data) {
      setClaims(data);
    }
  }, []);

  useEffect(() => {
    void fetchClaims(taskIds);

    const channel = supabase
      .channel(`claims:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "claims" },
        () => {
          void fetchClaims(taskIds);
        }
      )
      .subscribe((status) => console.log("Realtime status:", status));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, taskIds, fetchClaims]);

  const claimsByTask = useMemo(() => groupClaimsByTask(claims), [claims]);

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
    fallbackError: string,
    options?: { refreshPage?: boolean }
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

      if (options?.refreshPage) {
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  async function claimTask(taskId: string) {
    const member = getStoredMember(boardId);
    if (!member) {
      alert("Pick your name first.");
      return;
    }

    await runAction(
      taskId,
      "claim",
      "/api/claim",
      { taskId, claimerName: member.name },
      "Failed to claim task"
    );
  }

  async function completeTask(taskId: string) {
    await runAction(
      taskId,
      "complete",
      "/api/complete",
      { taskId },
      "Failed to mark task done",
      { refreshPage: true }
    );
  }

  async function releaseTask(taskId: string) {
    const member = getStoredMember(boardId);
    if (!member) {
      alert("Pick your name first.");
      return;
    }

    await runAction(
      taskId,
      "release",
      "/api/release",
      { taskId, claimerName: member.name },
      "Failed to release task"
    );
  }

  function renderClaimersLabel(taskClaims: Claim[]): string {
    if (taskClaims.length === 0) {
      return "nobody yet";
    }

    const names = taskClaims.map((c) => c.claimer_name).join(", ");
    const count = taskClaims.length;
    return `${names} (${count} ${count === 1 ? "claimer" : "claimers"})`;
  }

  function renderTaskCard(task: Task) {
    const taskClaims = claimsByTask.get(task.id) ?? [];
    const status = resolveTaskStatus(task, taskClaims);
    const isDone = status === "done";
    const member = getStoredMember(boardId);
    const hasClaimed =
      !!member &&
      taskClaims.some((c) => c.claimer_name === member.name);
    const canClaim = !isDone && !hasClaimed;
    const canRelease = !isDone && hasClaimed;
    const canComplete = !isDone && taskClaims.length > 0;

    return (
      <li
        key={task.id}
        className="rounded-xl bg-white p-4 shadow-sm shadow-[#1A1A1A]/5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[#1A1A1A]">{task.title}</p>
            <p className="mt-1 text-sm text-[#1A1A1A]/50">
              {renderClaimersLabel(taskClaims)}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {canClaim && (
          <button
            type="button"
            onClick={() => claimTask(task.id)}
            disabled={isTaskBusy(task.id)}
            className="mt-4 rounded-lg bg-[#E8542C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D14A26] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending(task.id, "claim") ? "Claiming…" : "Claim"}
          </button>
        )}

        {(canComplete || canRelease) && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {canComplete && (
              <button
                type="button"
                onClick={() => completeTask(task.id)}
                disabled={isTaskBusy(task.id)}
                className="rounded-lg border border-green-600 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending(task.id, "complete") ? "Saving…" : "Mark done"}
              </button>
            )}
            {canRelease && (
              <button
                type="button"
                onClick={() => releaseTask(task.id)}
                disabled={isTaskBusy(task.id)}
                className="text-xs text-[#1A1A1A]/45 transition-colors hover:text-[#1A1A1A]/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending(task.id, "release") ? "Releasing…" : "Release"}
              </button>
            )}
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
