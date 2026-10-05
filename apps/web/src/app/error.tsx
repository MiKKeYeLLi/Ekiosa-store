"use client";

import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function RouteError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="container-page">
      <EmptyState
        icon={AlertTriangle}
        tone="danger"
        title="Something went wrong"
        description="An unexpected error occurred. Please try again — if the problem continues, come back in a few minutes."
        action={
          <>
            <Button onClick={() => retry()}>Try again</Button>
            <ButtonLink href="/" variant="outline">
              Go home
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
