"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { imageLoader } from "@/components/product/product-image";

type Tone = "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: Tone;
  image?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback((opts: ToastOptions) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-(MAX_TOASTS - 1)), { tone: "success", duration: 4500, ...opts, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const iconTone = { success: "text-success", error: "text-danger", info: "text-ink-muted" };

function ToastCard({ toast, dismiss }: { toast: ToastItem; dismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const { id } = toast;
  const onDismiss = useCallback(() => dismiss(id), [dismiss, id]);
  const Icon = icons[toast.tone ?? "success"];

  useEffect(() => {
    if (paused || !toast.duration) return;
    const t = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(t);
  }, [paused, toast.duration, onDismiss]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 pr-2.5 shadow-pop"
    >
      {toast.image ? (
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-subtle">
          <Image src={toast.image} alt="" fill sizes="48px" loader={imageLoader} className="object-cover" />
        </div>
      ) : (
        <Icon className={cn("mt-0.5 size-5 shrink-0", iconTone[toast.tone ?? "success"])} aria-hidden />
      )}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-medium text-ink">{toast.title}</p>
        {toast.description && <p className="mt-0.5 line-clamp-2 text-[0.8125rem] text-ink-muted">{toast.description}</p>}
        {toast.action &&
          (toast.action.href ? (
            <Link
              href={toast.action.href}
              onClick={onDismiss}
              className="mt-2 inline-block text-[0.8125rem] font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
            >
              {toast.action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick?.();
                onDismiss();
              }}
              className="mt-2 text-[0.8125rem] font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
            >
              {toast.action.label}
            </button>
          ))}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-subtle hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
