"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Package, User } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useSessionUser } from "@/lib/auth/client";
import type { SessionUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

export function Avatar({ user, className }: { user: SessionUser; className?: string }) {
  return user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- small remote avatar
    <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className={cn("rounded-full", className)} />
  ) : (
    <span className={cn("flex items-center justify-center rounded-full bg-brand text-xs font-medium text-white", className)}>
      {(user.fullName ?? user.email).charAt(0).toUpperCase()}
    </span>
  );
}

/** Navbar account entry: a sign-in link when signed out, an avatar menu when signed in. */
export function AccountMenu() {
  const { user } = useSessionUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/account"
        className="hidden size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle sm:flex"
        aria-label="Sign in"
      >
        <User className="size-5" />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-subtle"
      >
        <Avatar user={user} className="size-7" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 animate-fade-in rounded-2xl border border-line bg-surface p-2 shadow-pop"
        >
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-sm font-medium text-ink">{user.fullName ?? "Signed in"}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-subtle hover:text-ink"
          >
            <Package className="size-4" /> My orders
          </Link>
          <SignOutButton className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-ink-soft hover:bg-subtle hover:text-ink" />
        </div>
      )}
    </div>
  );
}

/** Mobile menu account row. */
export function MobileAccountLink() {
  const { user } = useSessionUser();
  return (
    <Link href="/account" className="flex items-center gap-3 rounded-xl py-2.5 text-[0.9375rem] text-ink-soft hover:text-ink">
      {user ? (
        <>
          <Avatar user={user} className="size-5" /> My account & orders
        </>
      ) : (
        <>
          <User className="size-5" /> Sign in with Google
        </>
      )}
    </Link>
  );
}
