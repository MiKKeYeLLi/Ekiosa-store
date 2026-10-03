import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const star = size === "sm" ? "size-3.5" : "size-4.5";
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative flex" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        <div className="flex text-line-strong">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(star, "fill-current")} strokeWidth={0} />
          ))}
        </div>
        <div className="absolute inset-0 flex overflow-hidden text-ink" style={{ width: `${(value / 5) * 100}%` }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(star, "shrink-0 fill-current")} strokeWidth={0} />
          ))}
        </div>
      </div>
      <span className={cn("text-ink-muted tabular-nums", size === "sm" ? "text-xs" : "text-sm")}>
        <span className="font-medium text-ink-soft">{value.toFixed(1)}</span>
        {count != null && <span> ({count.toLocaleString("en-US")})</span>}
      </span>
    </div>
  );
}
