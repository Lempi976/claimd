"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  name: string;
};

type StoredMember = {
  id: string;
  name: string;
};

function storageKey(boardId: string) {
  return `claimd_member_${boardId}`;
}

export default function NamePicker({
  members,
  boardId,
}: {
  members: Member[];
  boardId: string;
}) {
  const [selected, setSelected] = useState<StoredMember | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(boardId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredMember;
        if (parsed.id && parsed.name) {
          setSelected(parsed);
        }
      } catch {
        localStorage.removeItem(storageKey(boardId));
      }
    }
    setReady(true);
  }, [boardId]);

  function selectMember(member: Member) {
    const stored = { id: member.id, name: member.name };
    localStorage.setItem(storageKey(boardId), JSON.stringify(stored));
    setSelected(stored);
  }

  function clearSelection() {
    localStorage.removeItem(storageKey(boardId));
    setSelected(null);
  }

  if (!ready) {
    return <div className="h-8" aria-hidden />;
  }

  if (selected) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-[#E8542C] px-3.5 py-1.5 text-sm font-medium text-white">
          You are {selected.name}
        </span>
        <button
          type="button"
          onClick={clearSelection}
          className="text-sm text-[#1A1A1A]/50 underline underline-offset-2 transition-colors hover:text-[#1A1A1A]/70"
        >
          change
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[#1A1A1A]/60">Who are you?</p>
      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li key={member.id}>
            <button
              type="button"
              onClick={() => selectMember(member)}
              className="w-full rounded-xl border border-[#1A1A1A]/10 bg-white px-4 py-3 text-left text-sm font-medium text-[#1A1A1A] shadow-sm transition-colors hover:border-[#E8542C]/30 hover:bg-[#FFFDFB]"
            >
              {member.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
