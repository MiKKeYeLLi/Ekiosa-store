"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, children = "Sign out" }: { className?: string; children?: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={cn("disabled:opacity-60", className)}
      onClick={() =>
        startTransition(async () => {
          await signOutAction();
          // Also clear the browser client's session so client UI updates immediately.
          await createClient().auth.signOut({ scope: "local" });
          router.refresh();
        })
      }
    >
      {pending ? "Signing out…" : children}
    </button>
  );
}
