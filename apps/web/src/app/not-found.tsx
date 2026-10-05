import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="container-page">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <>
            <ButtonLink href="/shop">Continue shopping</ButtonLink>
            <ButtonLink href="/" variant="outline">
              Go home
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
