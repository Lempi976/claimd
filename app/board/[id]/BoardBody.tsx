"use client";

import { useState } from "react";

import NamePicker, { type StoredMember } from "./NamePicker";
import TaskList from "./TaskList";

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

export default function BoardBody({
  boardId,
  boardName,
  members,
  events,
  tasks,
  initialClaims,
}: {
  boardId: string;
  boardName: string;
  members: { id: string; name: string }[];
  events: Event[];
  tasks: Task[];
  initialClaims: Claim[];
}) {
  const [selectedMember, setSelectedMember] = useState<StoredMember | null>(
    null
  );

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
          {boardName}
        </h1>
        <div className="mt-5">
          <NamePicker
            members={members}
            boardId={boardId}
            onMemberChange={setSelectedMember}
          />
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium tracking-wide text-[#1A1A1A]/50 uppercase">
          Tasks
        </h2>

        {!tasks.length ? (
          <p className="rounded-xl bg-white px-5 py-8 text-center text-sm text-[#1A1A1A]/60 shadow-sm">
            No tasks yet
          </p>
        ) : (
          <TaskList
            tasks={tasks}
            events={events}
            boardId={boardId}
            selectedMember={selectedMember}
            initialClaims={initialClaims}
          />
        )}
      </section>
    </>
  );
}
