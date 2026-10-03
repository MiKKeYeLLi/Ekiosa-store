import { ProductGridSkeleton } from "@/components/product/product-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="container-page pt-6 sm:pt-8" aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-6 h-3.5 w-56" />
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14 xl:gap-20">
        <div className="flex gap-4">
          <div className="hidden w-20 flex-col gap-3 lg:flex">
            <Skeleton className="aspect-[4/5] rounded-xl" />
            <Skeleton className="aspect-[4/5] rounded-xl" />
          </div>
          <Skeleton className="aspect-[4/5] flex-1 rounded-3xl sm:aspect-square lg:aspect-[4/5]" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-4 h-8 w-28" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
          </div>
          <Skeleton className="mt-6 h-32 rounded-2xl" />
        </div>
      </div>
      <div className="mt-24">
        <Skeleton className="mb-10 h-10 w-64" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
