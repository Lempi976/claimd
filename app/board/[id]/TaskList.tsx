"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

import type { StoredMember } from "./NamePicker";

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

type TaskStatus = "unclaimed" | "in_progress" | "done";

type PendingAction = "claim" | "complete" | "release";

type TaskSection = {
  key: string;
  title: string;
  tasks: Task[];
};

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

async function parseApiResponse<T = Record<string, unknown>>(
  res: Response,
  fallbackError: string
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  let data: T & { error?: string } = {} as T & { error?: string };
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text) as T & { error?: string };
    } catch {
      return { ok: false, message: fallbackError };
    }
  }

  if (!res.ok) {
    return { ok: false, message: data.error ?? fallbackError };
  }

  return { ok: true, data: data as T };
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
  selectedMember,
}: {
  tasks: Task[];
  events: Event[];
  boardId: string;
  selectedMember: StoredMember | null;
}) {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pending, setPending] = useState<{
    taskId: string;
    action: PendingAction;
  } | null>(null);

  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const taskIdsRef = useRef(taskIds);
  taskIdsRef.current = taskIds;

  const fetchClaims = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setClaims([]);
      return;
    }

    const { data, error } = await supabase
      .from("claims")
      .select("id, task_id, claimer_name")
      .in("task_id", ids);

    if (error) {
      console.error("[TaskList] fetchClaims error:", error);
      return;
    }

    setClaims(data ?? []);
  }, []);

  useEffect(() => {
    void fetchClaims(taskIds);

    const channel = supabase
      .channel(`claims:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "claims" },
        () => {
          void fetchClaims(taskIdsRef.current);
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

  async function runAction<T = Record<string, unknown>>(
    taskId: string,
    action: PendingAction,
    endpoint: string,
    body: Record<string, string>,
    fallbackError: string,
    options?: { refreshPage?: boolean }
  ): Promise<T | null> {
    setPending({ taskId, action });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await parseApiResponse<T>(res, fallbackError);
      if (!result.ok) {
        alert(result.message);
        return null;
      }

      if (options?.refreshPage) {
        router.refresh();
      }

      return result.data;
    } finally {
      setPending(null);
    }
  }

  async function claimTask(taskId: string) {
    const claimerName = selectedMember?.name?.trim();
    if (!claimerName) {
      alert("Pick your name first.");
      return;
    }

    const claim = await runAction<Claim>(
      taskId,
      "claim",
      "/api/claim",
      { taskId, claimerName },
      "Failed to claim task"
    );

    if (claim?.id && claim.task_id) {
      setClaims((prev) => {
        if (prev.some((c) => c.id === claim.id)) return prev;
        return [...prev, claim];
      });
    }

    void fetchClaims(taskIdsRef.current);
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
    const claimerName = selectedMember?.name?.trim();
    if (!claimerName) {
      alert("Pick your name first.");
      return;
    }

    const released = await runAction<Claim>(
      taskId,
      "release",
      "/api/release",
      { taskId, claimerName },
      "Failed to release task"
    );

    if (released?.id) {
      setClaims((prev) => prev.filter((c) => c.id !== released.id));
    } else {
      setClaims((prev) =>
        prev.filter(
          (c) => !(c.task_id === taskId && c.claimer_name === claimerName)
        )
      );
    }

    void fetchClaims(taskIdsRef.current);
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
    const claimerName = selectedMember?.name;
    const hasClaimed =
      !!claimerName &&
      taskClaims.some((c) => c.claimer_name === claimerName);
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
