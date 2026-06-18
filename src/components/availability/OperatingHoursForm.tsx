// components/OperatingHoursForm.tsx
import { DayName, dayNames } from "@/components/service-availability-columns"; // Ensure DayName is exported from here
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TimeInput } from "@/components/availability/TimeInput";
import { JSX } from "react";
import { type ZodIssue } from "zod";

interface OperatingHoursFormProps {
  selectedDay: DayName | "";
  setSelectedDay?: (day: DayName) => void;
  openingTime: string;
  setOpeningTime: (time: string) => void;
  closingTime: string;
  setClosingTime: (time: string) => void;
  is24Hours: boolean;
  setIs24Hours: (is24Hours: boolean) => void;
  errors: ZodIssue[];
  allowedDays?: DayName[]; // optional list to show in the Select when adding
  isEditing?: boolean; // when true show read-only day display
}

/**
 * Reusable form component for setting or editing operating hours for a specific day.
 * It includes inputs for opening and closing times, and displays validation errors.
 */
export function OperatingHoursForm({
  selectedDay,
  setSelectedDay,
  openingTime,
  setOpeningTime,
  closingTime,
  setClosingTime,
  is24Hours,
  setIs24Hours,
  errors,
  allowedDays,
  isEditing = false,
}: OperatingHoursFormProps): JSX.Element {
  // Helper function to find and display a specific error message
  const getErrorMessage = (path: string) => {
    const error = errors.find((e) => e.path.includes(path));
    return error ? (
      <p className="text-sm text-destructive col-start-2 col-span-3">
        {error.message}
      </p>
    ) : null;
  };

  // Use provided allowedDays or fall back to all days
  const selectableDays =
    allowedDays && allowedDays.length ? allowedDays : dayNames;

  return (
    <>
      {/* Display for the selected day - editable when not editing mode */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="day-display" className="text-right">
          Day
        </Label>
        {isEditing ? (
          <Input
            id="day-display"
            value={selectedDay || "N/A"}
            readOnly
            className="col-span-3 font-medium bg-muted border-none"
          />
        ) : (
          <div className="col-span-3">
            <Select
              value={selectedDay || (selectableDays[0] as string)}
              onValueChange={(val) => setSelectedDay?.(val as DayName)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {selectableDays.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Opening Time Input */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="openingTime" className="text-right">
          Opening Time
        </Label>
        <div className="col-span-3">
          <TimeInput
            id="openingTime"
            value={openingTime}
            onChange={setOpeningTime}
          />
        </div>
        {getErrorMessage("opening_time")}
      </div>

      {/* Closing Time Input */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="closingTime" className="text-right">
          Closing Time
        </Label>
        <div className="col-span-3">
          <TimeInput
            id="closingTime"
            value={closingTime}
            onChange={setClosingTime}
            disabled={is24Hours}
          />
        </div>
        {getErrorMessage("closing_time")}
      </div>

      {/* 24 Hours Checkbox */}
      <div className="grid grid-cols-4 items-center gap-4">
        <div className="col-start-2 col-span-3 flex items-center space-x-2">
          <Checkbox
            id="is24Hours"
            checked={is24Hours}
            onCheckedChange={(checked) => setIs24Hours(checked === true)}
          />
          <Label htmlFor="is24Hours" className="font-normal cursor-pointer">
            Open 24 Hours
          </Label>
        </div>
      </div>
    </>
  );
}
