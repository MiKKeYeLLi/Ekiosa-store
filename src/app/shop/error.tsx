"use client";

import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ShopError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="container-page">
      <EmptyState
        icon={AlertTriangle}
        tone="danger"
        title="We couldn't load products"
        description="Something went wrong while loading the catalog. Check your connection and try again."
        action={
          <>
            <Button onClick={() => retry()}>Try again</Button>
            <ButtonLink href="/shop" variant="outline">
              Reset filters
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
