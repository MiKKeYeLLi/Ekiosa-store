import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-baseline gap-0.5 text-ink", className)} aria-label="Loam — home">
      <span className="font-display text-[1.75rem] leading-none tracking-tight">Loam</span>
      <span className="size-1.5 rounded-full bg-brand" aria-hidden />
    </Link>
  );
}
