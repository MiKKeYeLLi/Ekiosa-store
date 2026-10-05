import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center sm:py-24", className)}>
      <div
        className={cn(
          "mb-6 flex size-16 items-center justify-center rounded-full",
          tone === "danger" ? "bg-danger-tint text-danger" : "bg-subtle text-ink-muted",
        )}
      >
        <Icon className="size-7" strokeWidth={1.5} aria-hidden />
      </div>
      <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
