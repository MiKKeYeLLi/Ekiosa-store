import { Skeleton } from "@/components/ui/skeleton";

export default function OrderLoading() {
  return (
    <div className="container-page pt-10 sm:pt-16" aria-busy="true" aria-label="Loading order">
      <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16 xl:grid-cols-[1fr_28rem] xl:gap-24">
        <div className="flex flex-col gap-4">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="mt-6 h-4 w-28" />
          <Skeleton className="h-14 w-3/4" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="mt-4 h-20 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}
