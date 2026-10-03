import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "sale" | "success" | "warning" | "danger" | "brand" | "inverse";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-soft",
  sale: "bg-sale text-white",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  brand: "bg-brand-tint text-brand",
  inverse: "bg-ink text-white",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium tracking-tight whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
