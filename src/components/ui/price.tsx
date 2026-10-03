import { cn, discountPercent, formatPrice } from "@/lib/utils";

export function Price({
  price,
  compareAtPrice,
  size = "sm",
  showDiscount = false,
  className,
}: {
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
  className?: string;
}) {
  const pct = discountPercent(price, compareAtPrice);
  const sizes = { sm: "text-[0.9375rem]", md: "text-lg", lg: "text-2xl sm:text-[1.75rem]" };
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-medium tabular-nums tracking-tight", sizes[size], pct > 0 ? "text-sale" : "text-ink")}>
        <span className="sr-only">{pct > 0 ? "Sale price " : "Price "}</span>
        {formatPrice(price)}
      </span>
      {pct > 0 && compareAtPrice && (
        <>
          <s className={cn("tabular-nums text-ink-faint", size === "lg" ? "text-lg" : "text-sm")}>
            <span className="sr-only">Original price </span>
            {formatPrice(compareAtPrice)}
          </s>
          {showDiscount && <span className="text-sm font-medium text-sale">Save {pct}%</span>}
        </>
      )}
    </div>
  );
}
