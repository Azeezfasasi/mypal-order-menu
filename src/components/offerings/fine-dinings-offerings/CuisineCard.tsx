import { Button } from "@/components/ui/button";
import SafeImage from "@/components/ui/safe-image";
import { FinediningCuisine } from "@/services/finedining-cuisine-api";
import React from "react";

interface CuisineCardProps {
  cuisine: FinediningCuisine;
  onRemove?: (id: string) => void;
  showDetailedView?: boolean;
}

const CuisineCard: React.FC<CuisineCardProps> = ({ cuisine, onRemove }) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
      <SafeImage
        src={cuisine.image_url ?? undefined}
        alt={cuisine.name ?? ""}
        width={40}
        height={40}
        className="rounded-md object-contain size-14"
      />

      <div className="flex-1 min-w-0">
        <div className="text-lg font-semibold text-gray-900 truncate">
          {cuisine.name}
        </div>
        {cuisine.description && (
          <div className="text-sm text-gray-600 truncate">
            {cuisine.description}
          </div>
        )}
      </div>

      {onRemove && (
        <Button
          size="sm"
          onClick={() => onRemove(cuisine.id)}
          className="bg-red-100 hover:bg-red-200 text-red-600 border-red-200"
        >
          Remove
        </Button>
      )}
    </div>
  );
};

export default CuisineCard;
