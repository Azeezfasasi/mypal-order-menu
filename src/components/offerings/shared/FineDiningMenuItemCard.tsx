// components/ui/menu/MenuItemCard.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { TimeRemaining } from "@/services/api/promotions-api";

export interface MenuItemCardProps {
  id: string | number;
  name: string;
  minimum_price?: number;
  maximum_price?: number;
  type?: string;
  onEdit: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  onPromote: (id: string | number) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
  isPromoted?: boolean;
  timeRemaining?: TimeRemaining;
  formatTimeRemaining?: (timeRemaining: TimeRemaining) => string;
}

export function FineDiningMenuItemCard({
  id,
  name,
  minimum_price = 0,
  maximum_price = 0,
  type = "N/A",
  onEdit,
  onDelete,
  onPromote,
  isDeleting = false,
  isUpdating = false,
  isPromoted = false,
  timeRemaining,
  formatTimeRemaining,
}: MenuItemCardProps) {
  return (
    <div className="flex md:flex-col gap-4 items-center justify-between p-4 bg-orange-50 rounded-md">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-orange-200 rounded-md flex items-center justify-center text-orange-700">
          {name ? name.charAt(0) : "M"}
        </div>
        <div>
          <span className="font-medium">{name}</span>
          <div className="text-sm text-gray-600">
            {type} • {formatCurrency(minimum_price)} -{" "}
            {formatCurrency(maximum_price)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPromoted && timeRemaining ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-white border-green-600 hover:bg-white text-green-600 text-xs font-medium"
              disabled
            >
              Promoted
            </Button>
            <Badge variant="soft-default" className="bg-green-100 text-green-700 border-green-200 text-xs">
              {formatTimeRemaining?.(timeRemaining) || "active"} remaining
            </Badge>
          </div>
        ) : (
          <Button
            variant="outline"
            className="bg-blue-100 border-blue-200 hover:bg-blue-200"
            onClick={() => onPromote(id)}
          >
            Promote
          </Button>
        )}
        <Button
          variant="outline"
          className="bg-orange-100 border-orange-200 hover:bg-orange-200 text-primary"
          onClick={() => onEdit(id)}
          disabled={isUpdating}
        >
          View
        </Button>
        <Button
          variant="outline"
          className="bg-gray-200 border-gray-300 hover:bg-gray-300 text-gray-700"
          onClick={() => onDelete(id)}
          disabled={isDeleting}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
