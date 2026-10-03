import { cn, getStockStatus } from "@/lib/utils";

const copy = {
  in_stock: { dot: "bg-success", text: "text-success", label: () => "In stock" },
  low_stock: { dot: "bg-warning", text: "text-warning", label: (n: number) => `Only ${n} left` },
  out_of_stock: { dot: "bg-ink-faint", text: "text-ink-muted", label: () => "Out of stock" },
};

export function StockStatus({ stock, className, hideInStock }: { stock: number; className?: string; hideInStock?: boolean }) {
  const status = getStockStatus(stock);
  if (hideInStock && status === "in_stock") return null;
  const c = copy[status];
  return (
    <p className={cn("flex items-center gap-1.5 text-[0.8125rem] font-medium", c.text, className)}>
      <span className={cn("size-1.5 rounded-full", c.dot)} aria-hidden />
      {c.label(stock)}
    </p>
  );
}
