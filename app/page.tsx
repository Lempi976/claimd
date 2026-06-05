import Link from "next/link";

import ClaimdWordmark from "@/components/ClaimdWordmark";

const steps = [
  {
    title: "Create your board",
    description: "The president sets up the circle and adds members.",
  },
  {
    title: "Share one link",
    description: "Members open it, tap their name, no account needed.",
  },
  {
    title: "Claim and track",
    description: "Everyone grabs tasks; the board stays up to date.",
  },
];

export default function Home() {
  return (
    <main className="min-h-full bg-[#FAF6F1] text-[#1A1A1A]">
      <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-10 sm:px-6 sm:py-14">
        <ClaimdWordmark />

        <section className="mt-14 sm:mt-16">
          <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-[#1A1A1A] sm:text-5xl">
            Stop losing track of who&apos;s doing what.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#1A1A1A]/60 sm:text-lg">
            Claimd is the simple shared board for student circles — everyone
            sees the tasks, claims what they&apos;ll do, and nothing slips
            through the group chat.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-[#E8542C] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#D14A26]"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-[#1A1A1A]/15 bg-white px-6 py-3.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-[#1A1A1A]/25 hover:bg-[#FFFDFB]"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mt-20 sm:mt-24">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#1A1A1A]">
            How it works
          </h2>
          <ol className="mt-8 flex flex-col gap-8">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8542C]/10 font-display text-sm font-bold text-[#E8542C]">
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <p className="font-medium text-[#1A1A1A]">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#1A1A1A]/55">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-20 border-t border-[#1A1A1A]/8 pt-10 sm:mt-24">
          <p className="font-display text-base font-semibold text-[#1A1A1A]">
            Claimd
          </p>
          <p className="mt-1 text-sm text-[#1A1A1A]/45">
            Made for student circles.
          </p>
        </footer>
      </div>
    </main>
  );
}
