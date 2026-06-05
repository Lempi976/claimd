"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ClaimdWordmark from "@/components/ClaimdWordmark";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Board = {
  id: string;
  name: string;
};

export default function DashboardView() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user?.id) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("boards")
        .select("id, name")
        .eq("owner_id", user.id)
        .order("name");

      if (error) {
        setFetchError(error.message);
      } else {
        setBoards(data ?? []);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    setSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
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

  return (
    <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
      <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-10 sm:px-6 sm:py-14">
        <header className="flex items-start justify-between gap-4">
          <ClaimdWordmark />
          <div className="flex flex-col items-end gap-1.5 text-right">
            {email && (
              <span className="max-w-[200px] truncate text-sm text-[#1A1A1A]/55">
                {email}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="text-sm text-[#1A1A1A]/50 underline underline-offset-2 transition-colors hover:text-[#1A1A1A]/70 disabled:opacity-60"
            >
              {signingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </header>

        <section className="mt-12 sm:mt-14">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
            Your boards
          </h1>

          <Link
            href="/dashboard/new"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#E8542C] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#D14A26]"
          >
            Create a board
          </Link>

          {fetchError && (
            <p className="mt-6 text-sm text-red-600" role="alert">
              {fetchError}
            </p>
          )}

          {!fetchError && boards.length === 0 && (
            <p className="mt-10 rounded-xl border border-[#1A1A1A]/8 bg-white px-5 py-8 text-center text-sm leading-relaxed text-[#1A1A1A]/55 shadow-sm">
              No boards yet — create your first one
            </p>
          )}

          {!fetchError && boards.length > 0 && (
            <ul className="mt-8 flex flex-col gap-3">
              {boards.map((board) => (
                <li key={board.id}>
                  <Link
                    href={`/dashboard/${board.id}`}
                    className="block rounded-xl border border-transparent bg-white px-5 py-4 shadow-sm shadow-[#1A1A1A]/5 transition-colors hover:border-[#E8542C]/25 hover:bg-[#FFFDFB]"
                  >
                    <span className="font-display text-lg font-semibold text-[#1A1A1A]">
                      {board.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
