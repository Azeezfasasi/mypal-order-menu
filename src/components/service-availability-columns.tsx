"use client";

import { Button } from "@/components/ui/button";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Loader2, Trash2 } from "lucide-react";

// Import Types
import type { IBlackoutDay } from "@/services/api/blackout-api";
import type { IOperatingDay } from "@/services/api/operating-days-api";
import { BaseApiResponse, BaseError } from "@/types/api";

// Define DayName type (should match the one in ServiceAvailabilityPage)
export const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayName = (typeof dayNames)[number];

// Define local types using the specific DayName
export interface DayData {
  day: DayName; // Use the specific DayName type
}

// Type for the function passed to open the operating hours dialog
export type OpenOperatingHoursDialogFn = (day: DayName) => void;

// Type for the function to find an operating day
export type FindOperatingDayFn = (day: DayName) => IOperatingDay | undefined;

// Use a more generic type constraint instead of a specific type
// type GenericDeleteMutation = UseMutationResult<any, any, string, any> & {
//   isPending: boolean;
//   variables?: string; // variables can be undefined if mutation not yet called
// };

export type GenericDeleteMutation = UseMutationResult<
  BaseApiResponse<{ data: null }>, // The expected data type on success (assuming null data for delete)
  BaseError, // Use your custom BaseError type here
  string, // The type of the variable passed to the mutate function (the ID)
  unknown // The context type, use unknown if not specifically used
> & {
  isPending: boolean;
  variables?: string; // variables can be undefined if mutation not yet called
};

// Operating Hours Columns
export const createOperatingHoursColumns = (
  findOperatingDay: FindOperatingDayFn,
  openOperatingHoursDialog: OpenOperatingHoursDialogFn,
  // handler to delete an operating day by id (row action)
  deleteOperatingDay?: (id: string) => void,
  deleteMutation?: GenericDeleteMutation,
): ColumnDef<DayData>[] => [
  {
    accessorKey: "day",
    header: "Day",
    cell: ({ row }) => <div className="font-medium">{row.original.day}</div>,
    size: 150,
    enableSorting: false,
  },
  {
    id: "openingHours",
    header: "Opening Time", // Changed from "Hours" for clarity
    cell: ({ row }) => {
      const day = row.original.day; // day is now DayName
      const operatingDay = findOperatingDay(day);
      return (
        <div className="text-sm text-muted-foreground">
          {operatingDay ? `${operatingDay.opening_time}` : "-"}
        </div>
      );
    },
    size: 200,
    enableSorting: false,
  },
  {
    id: "closingHours",
    header: "Closing Time", // Changed for clarity
    cell: ({ row }) => {
      const day = row.original.day; // day is now DayName
      const operatingDay = findOperatingDay(day);
      return (
        <div className="text-sm text-muted-foreground">
          {operatingDay ? operatingDay.closing_time : "-"}
        </div>
      );
    },
    size: 200,
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Action</div>,
    cell: ({ row }) => {
      const day = row.original.day; // day is now DayName
      const operatingDay = findOperatingDay(day);
      const isDeleting =
        deleteMutation && operatingDay
          ? deleteMutation.isPending &&
            deleteMutation.variables === operatingDay.id
          : false;

      return (
        <div className="text-right flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openOperatingHoursDialog(day)}
            aria-label={`Edit ${day}`}
          >
            <Edit className="h-4 w-4 mr-1 text-primary-500" /> Edit
          </Button>

          {operatingDay && deleteOperatingDay && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteOperatingDay(operatingDay.id)}
              disabled={!!isDeleting}
              aria-label={`Delete ${day}`}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      );
    },
    enableSorting: false, // Added for consistency
    size: 100, // Example size
  },
];

// Blackout Dates Columns
// Assuming IBlackoutDay has at least 'id', 'date', and optionally 'reason'
// Assuming formatBlackoutDateForDisplay: (dateString: string) => string
// Assuming openBlackoutDateDialog: (blackoutDay?: IBlackoutDay | null) => void
// Assuming handleDeleteBlackoutDate: (id: string) => void

// Blackout Dates Columns - Use generic type parameter
export const createBlackoutDatesColumns = (
  formatDateDisplay: (dateString: string) => string,
  openBlackoutDateDialog: (blackoutDay: IBlackoutDay) => void,
  deleteBlackoutDate: (id: string) => void,
  deleteMutation: GenericDeleteMutation, // Use the more generic type
): ColumnDef<IBlackoutDay>[] => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const formattedDate = formatDateDisplay(row.original.date);
      return <div className="font-medium">{formattedDate}</div>;
    },
    size: 150,
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.reason || "-"}
      </div>
    ),
    size: 250,
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const blackoutDay = row.original;
      const isDeleting =
        deleteMutation.isPending && deleteMutation.variables === blackoutDay.id;

      return (
        <div className="text-right space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openBlackoutDateDialog(blackoutDay)}
            disabled={isDeleting}
            aria-label="Edit blackout date"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteBlackoutDate(blackoutDay.id)}
            disabled={isDeleting}
            aria-label="Delete blackout date"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      );
    },
  },
];
