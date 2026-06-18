"use client";

import { IBranch } from "@/services/api/branches-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, MapPin, Users, Package, MoreVertical, Eye, Edit2, Trash2 } from "lucide-react";

interface BranchCardProps {
  branch: IBranch;
  onEdit?: (branch: IBranch) => void;
  onViewMenu?: (branch: IBranch) => void;
  onDelete?: (branchId: string) => void;
}

export function BranchCard({
  branch,
  onEdit,
  onViewMenu,
  onDelete,
}: BranchCardProps) {
  const formatTime = (time: string) => {
    // Convert 24-hour format to 12-hour format if needed
    if (!time) return "";
    if (time.includes(":")) {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time;
  };

  const getOperatingHours = () => {
    if (!branch.opening_hours || typeof branch.opening_hours !== "object") {
      return "Hours not set";
    }

    // Try to get today's hours first
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date().getDay();
    const todayKey = dayNames[today];
    
    const todayHours = branch.opening_hours[todayKey as keyof typeof branch.opening_hours];
    if (todayHours?.is_open && todayHours?.opens && todayHours?.closes) {
      return `${formatTime(todayHours.opens)} – ${formatTime(todayHours.closes)}`;
    }

    // If today's hours not found, get first available open day
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (const day of daysOfWeek) {
      const hours = branch.opening_hours[day as keyof typeof branch.opening_hours];
      if (hours?.is_open && hours?.opens && hours?.closes) {
        return `${formatTime(hours.opens)} – ${formatTime(hours.closes)}`;
      }
    }

    return "Hours not set";
  };

  return (
    <div className="border rounded-lg p-5 hover:shadow-md transition-shadow">
      {/* Header with status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-blue-600 mb-1">
              {branch.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{branch.address}</span>
            </div>
          </div>
        </div>

        <Badge
          variant={branch.is_active ? "default" : "secondary"}
          className={
            branch.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-200 text-gray-800"
          }
        >
          {branch.is_active ? "Active" : "Pending review"}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700">{getOperatingHours()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700">
            {branch.menu_items_count || 0} items • {branch.menu_items_synced || 0} synced
          </span>
        </div>

        {branch.manager_name && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Manager: {branch.manager_name}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewMenu?.(branch)}
        >
          <Eye className="w-4 h-4 mr-2" />
          View menu
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit?.(branch)}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDelete?.(branch.id)}>
              <Trash2 className="w-4 h-4 mr-2 text-red-500" />
              <span className="text-red-500">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
