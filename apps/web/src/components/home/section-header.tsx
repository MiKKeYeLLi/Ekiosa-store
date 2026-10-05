import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
      <div className="max-w-xl">
        {eyebrow && <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">{eyebrow}</p>}
        <h2 className="font-display text-[2rem] leading-[1.05] tracking-tight text-ink sm:text-[2.75rem]">{title}</h2>
        {description && <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-ink sm:inline-flex"
        >
          <span className="underline decoration-line-strong underline-offset-4 transition-colors group-hover:decoration-ink">{linkLabel}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
