import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const CuisineCardSkeleton: React.FC = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

export default CuisineCardSkeleton;
