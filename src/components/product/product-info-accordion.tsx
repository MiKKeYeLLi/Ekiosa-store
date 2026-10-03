import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Native <details>-based accordion — accessible and works without JS. */
export function AccordionItem({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="group border-b border-line" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[0.9375rem] font-medium text-ink transition-colors hover:text-ink-soft [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 text-ink-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-6 text-[0.9375rem] leading-relaxed text-ink-muted">{children}</div>
    </details>
  );
}
