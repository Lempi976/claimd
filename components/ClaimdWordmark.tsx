import Link from "next/link";

export default function ClaimdWordmark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-[#1A1A1A] ${className}`}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8542C]"
        aria-hidden
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          className="h-2.5 w-2.5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 6.25L5 8.75L9.5 3.75"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      Claimd
    </Link>
  );
}
