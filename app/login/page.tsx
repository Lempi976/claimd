import Link from "next/link";

import ClaimdWordmark from "@/components/ClaimdWordmark";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-col bg-[#FAF6F1] text-[#1A1A1A]">
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-5 py-10 sm:px-6 sm:py-14">
        <ClaimdWordmark />

        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1A1A1A]">
            Login coming soon
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#1A1A1A]/55">
            President accounts are on the way.
          </p>
          <Link
            href="/"
            className="mt-8 text-sm text-[#1A1A1A]/50 underline underline-offset-2 transition-colors hover:text-[#1A1A1A]/70"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
