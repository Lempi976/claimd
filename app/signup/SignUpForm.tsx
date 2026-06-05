"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import AuthShell, {
  authInputClassName,
  formatAuthError,
} from "@/components/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(formatAuthError(signUpError.message));
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setInfo("Check your email to confirm your account, then sign in.");
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Set up your president account to manage your circle's board."
      switchHref="/login"
      switchLabel="Already have an account? Sign in"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#1A1A1A]/70"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className={authInputClassName}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[#1A1A1A]/70"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={authInputClassName}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {info && (
          <p className="rounded-xl border border-[#E8542C]/20 bg-white px-4 py-3 text-sm text-[#1A1A1A]/70">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#E8542C] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#D14A26] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
