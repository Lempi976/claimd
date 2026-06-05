"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { authInputClassName } from "@/components/AuthShell";
import ClaimdWordmark from "@/components/ClaimdWordmark";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type CreatedBoard = {
  id: string;
  join_code: string;
};

export default function CreateBoardForm() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [memberNames, setMemberNames] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [created, setCreated] = useState<CreatedBoard | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user?.id) {
        router.replace("/login");
        return;
      }

      setUserId(data.user.id);
      setAuthLoading(false);
    }

    checkAuth();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/boards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          memberNames,
          userId,
        }),
      });

      const text = await res.text();
      let data: CreatedBoard & { error?: string } = { id: "", join_code: "" };

      if (text) {
        try {
          data = JSON.parse(text) as CreatedBoard & { error?: string };
        } catch {
          setError("Failed to create board");
          return;
        }
      }

      if (!res.ok) {
        setError(data.error ?? "Failed to create board");
        return;
      }

      setCreated({ id: data.id, join_code: data.join_code });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!created) return;

    const url = `${window.location.origin}/board/${created.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (authLoading) {
    return (
      <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
        <div className="mx-auto w-full max-w-[640px] px-5 py-10 sm:px-6 sm:py-14">
          <ClaimdWordmark />
        </div>
      </main>
    );
  }

  const boardUrl =
    created && typeof window !== "undefined"
      ? `${window.location.origin}/board/${created.id}`
      : "";

  return (
    <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
      <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-10 sm:px-6 sm:py-14">
        <ClaimdWordmark />

        {created ? (
          <section className="mt-12 sm:mt-14">
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
              Board created
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#1A1A1A]/55">
              Send this link to your members.
            </p>

            <div className="mt-8 rounded-xl border border-[#E8542C]/20 bg-white p-5 shadow-sm">
              <p className="break-all text-sm font-medium text-[#1A1A1A]">
                {boardUrl}
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="mt-4 rounded-lg bg-[#E8542C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#D14A26]"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/board/${created.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-[#1A1A1A]/15 bg-white px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#1A1A1A]/25 hover:bg-[#FFFDFB]"
              >
                Open board
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center text-sm text-[#1A1A1A]/50 underline underline-offset-2 transition-colors hover:text-[#1A1A1A]/70"
              >
                Back to dashboard
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-12 sm:mt-14">
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
              Create a board
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#1A1A1A]/55">
              Name your circle and add members — one name per line.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <div>
                <label
                  htmlFor="board-name"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]/70"
                >
                  Board name
                </label>
                <input
                  id="board-name"
                  type="text"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Columbia Ski Club"
                  className={authInputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="member-names"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]/70"
                >
                  Members
                </label>
                <textarea
                  id="member-names"
                  name="memberNames"
                  rows={8}
                  value={memberNames}
                  onChange={(e) => setMemberNames(e.target.value)}
                  placeholder={"Pit\nAlex\nJordan"}
                  className={`${authInputClassName} resize-y`}
                />
                <p className="mt-2 text-xs text-[#1A1A1A]/45">
                  One member name per line. Blank lines are ignored.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#E8542C] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#D14A26] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create board"}
              </button>
            </form>

            <Link
              href="/dashboard"
              className="mt-10 inline-block text-sm text-[#1A1A1A]/50 underline underline-offset-2 transition-colors hover:text-[#1A1A1A]/70"
            >
              Back to dashboard
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
