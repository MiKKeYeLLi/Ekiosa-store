import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { safeNextPath } from "@/lib/auth/types";

export const metadata: Metadata = { title: "Sign-in problem" };

export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const reason = typeof params.reason === "string" ? params.reason : null;

  return (
    <div className="container-page">
      <EmptyState
        icon={ShieldAlert}
        tone="danger"
        title="We couldn't sign you in"
        description={
          <>
            The sign-in was cancelled or the link expired. Please try again.
            {reason && <span className="mt-2 block text-[0.8125rem] text-ink-faint">Details: {reason}</span>}
          </>
        }
        action={
          <>
            <ButtonLink href={next === "/checkout" ? "/checkout" : "/account"}>Try again</ButtonLink>
            <ButtonLink href="/" variant="outline">
              Go home
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
