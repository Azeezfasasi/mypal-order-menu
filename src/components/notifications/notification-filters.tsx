"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationType } from "@/types/enums";
import { Filter } from "lucide-react";

interface NotificationFiltersProps {
  selectedType: NotificationType | "all";
  onTypeChange: (type: NotificationType | "all") => void;
}

export function NotificationFilters({
  selectedType,
  onTypeChange,
}: NotificationFiltersProps) {
  return (
    <div className="flex items-center space-x-2 w-full sm:w-auto">
      <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full sm:w-[180px] min-w-0">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value={NotificationType.ORDER_UPDATE}>
            Order Updates
          </SelectItem>
          <SelectItem value={NotificationType.EVENT_REMINDER}>
            Event Reminders
          </SelectItem>
          <SelectItem value={NotificationType.RESERVATION_CONFIRMATION}>
            Reservations
          </SelectItem>
          <SelectItem value={NotificationType.PROMOTION}>Promotions</SelectItem>
          <SelectItem value={NotificationType.GENERAL}>General</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
