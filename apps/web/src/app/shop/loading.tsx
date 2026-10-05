import { ProductGridSkeleton } from "@/components/product/product-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="container-page pb-8 pt-8 sm:pt-12" aria-busy="true" aria-label="Loading products">
      <div className="mb-10 border-b border-line pb-8">
        <Skeleton className="mb-4 h-3 w-24" />
        <Skeleton className="h-12 w-72" />
      </div>
      <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-12 xl:grid-cols-[16.5rem_1fr]">
        <div className="hidden flex-col gap-4 lg:flex">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <ProductGridSkeleton count={9} columns={3} />
      </div>
    </div>
  );
}
