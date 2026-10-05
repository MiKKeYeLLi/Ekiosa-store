import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function OrderNotFound() {
  return (
    <div className="container-page">
      <EmptyState
        icon={FileQuestion}
        title="We couldn't find that order"
        description="Make sure you're signed in with the Google account you used to place it, or check your confirmation email."
        action={
          <>
            <ButtonLink href="/account">View my orders</ButtonLink>
            <ButtonLink href="/shop" variant="outline">
              Continue shopping
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
