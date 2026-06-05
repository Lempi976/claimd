import Link from "next/link";
import type { ReactNode } from "react";

import ClaimdWordmark from "@/components/ClaimdWordmark";

export const authInputClassName =
  "w-full rounded-xl border border-[#1A1A1A]/12 bg-white px-4 py-3 text-sm text-[#1A1A1A] shadow-sm outline-none transition-colors placeholder:text-[#1A1A1A]/35 focus:border-[#E8542C]/40 focus:ring-2 focus:ring-[#E8542C]/15";

export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Wrong email or password.";
  }
  if (lower.includes("user already registered")) {
    return "That email is already in use. Try signing in instead.";
  }
  if (lower.includes("password") && lower.includes("6")) {
    return "Password must be at least 6 characters.";
  }
  if (lower.includes("unable to validate email")) {
    return "Please enter a valid email address.";
  }

  return message;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  switchHref,
  switchLabel,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  switchHref: string;
  switchLabel: string;
}) {
  return (
    <main className="flex min-h-full flex-col bg-[#FAF6F1] text-[#1A1A1A]">
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-5 py-10 sm:px-6 sm:py-14">
        <ClaimdWordmark />

        <div className="mt-14 flex flex-1 flex-col sm:mt-16">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#1A1A1A]/55 sm:text-base">
            {subtitle}
          </p>

          <div className="mt-8">{children}</div>

          <p className="mt-6 text-sm text-[#1A1A1A]/55">
            <Link
              href={switchHref}
              className="font-medium text-[#E8542C] underline underline-offset-2 transition-colors hover:text-[#D14A26]"
            >
              {switchLabel}
            </Link>
          </p>

          <Link
            href="/"
            className="mt-10 text-sm text-[#1A1A1A]/50 underline underline-offset-2 transition-colors hover:text-[#1A1A1A]/70"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
