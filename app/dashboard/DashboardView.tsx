"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ClaimdWordmark from "@/components/ClaimdWordmark";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function DashboardView() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user?.email) {
        router.replace("/login");
        return;
      }

      setEmail(user.email);
      setLoading(false);
    }

    loadUser();
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
        <ClaimdWordmark />

        <section className="mt-14 sm:mt-16">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
            Welcome, {email}
          </h1>
          <p className="mt-3 text-sm text-[#1A1A1A]/55">
            Your president dashboard — more coming soon.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="mt-8 rounded-xl border border-[#1A1A1A]/15 bg-white px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#1A1A1A]/25 hover:bg-[#FFFDFB] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </section>
      </div>
    </main>
  );
}
