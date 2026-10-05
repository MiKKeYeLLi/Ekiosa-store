import { PackageSearch } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProductNotFound() {
  return (
    <div className="container-page">
      <EmptyState
        icon={PackageSearch}
        title="Product not found"
        description="This product may have been discontinued or the link is incorrect."
        action={
          <>
            <ButtonLink href="/shop">Browse all products</ButtonLink>
            <ButtonLink href="/" variant="outline">
              Go home
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
