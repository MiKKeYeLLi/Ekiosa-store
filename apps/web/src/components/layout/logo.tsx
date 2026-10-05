import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Ekiosa leaf "e" mark (from the brand SVG). */
export const EKIOSA_MARK_PATH =
  "m340.81 378.79c-18.95 13.24-20.3 16.1-43.97 18.43-102.61 10.1-150.52-62.2-158.04-148.36-31.63-10.6-61.81-18-97.87-28.99-12.13-3.71-7.44-1.82-18.7-9.08 11.98-5.08 7.84-4.46 20.19-5.55 28.62-2.58 62.46 0.14 95.62 5.84 2.57-55.34 26.83-169.74 96.95-166.61 80.95 3.59 82.87 162.8 82.62 221.88-0.15 34.99-21.86 52.3-56 38.29-20.55-8.42-46.44-24.42-68.92-34.62 3.79 56.42 31.57 99.55 102.84 104.85 20.51 1.52 23.17-0.04 45.28 3.92zm-146.56-155.12c8.71 2.44 17.1 4.98 24.98 7.63 10.43 3.48 25.28 9.76 38.86 15.09-5.08-41.04-11.77-91.49-28.07-122.84 0-0.04-0.58-0.88-1.35-2.04-17.9 21.92-30.5 73.82-33.59 95.6-0.29 2.17-0.58 4.39-0.83 6.56zm42.01-109.31q0.56-0.27 1.06-0.65-0.5 0.27-1.06 0.65z";

/** Full "ekiosa" wordmark; the text is set in Capriola (loaded via next/font in the root layout). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="14 36 848 370" className={cn("h-8 w-auto", className)} role="img" aria-label="Ekiosa">
      <path fillRule="evenodd" fill="#007d16" d={EKIOSA_MARK_PATH} />
      <text x="331" y="307" fill="currentColor" fontSize="200" style={{ fontFamily: "var(--font-capriola), Capriola, sans-serif" }}>
        kiosa
      </text>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center text-ink", className)} aria-label="Ekiosa — home">
      <Wordmark />
    </Link>
  );
}
