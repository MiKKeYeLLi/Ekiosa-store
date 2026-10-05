import { extendTailwindMerge } from "tailwind-merge";

type ClassValue = string | number | null | undefined | false;

// Teach tailwind-merge about our custom theme tokens so overrides resolve predictably.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "canvas", "surface", "subtle", "muted", "line", "line-strong", "ink", "ink-soft", "ink-muted", "ink-faint",
        "brand", "brand-hover", "brand-strong", "brand-tint", "sale", "sale-tint", "success", "success-tint",
        "warning", "warning-tint", "danger", "danger-tint",
      ],
      shadow: ["card", "raised", "pop"],
      font: ["display", "sans", "mono"],
    },
  },
});

/** Join class names, letting later Tailwind classes override earlier conflicting ones. */
export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}

export * from "@ekiosa/shared/format";
