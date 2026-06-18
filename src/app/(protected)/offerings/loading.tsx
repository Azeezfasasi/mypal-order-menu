import { Skeleton } from "@/components/ui/skeleton";

export default function OfferingsLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-[200px]" />
      </div>

      <div>
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-32 w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
