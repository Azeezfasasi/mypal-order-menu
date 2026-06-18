// components/BlackoutDateForm.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { type ZodIssue } from "zod";

interface BlackoutDateFormProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  blackoutReason: string;
  setBlackoutReason: (reason: string) => void;
  errors: ZodIssue[];
}

/**
 * Reusable form component for adding or editing blackout dates.
 * Includes a date picker and an optional reason input, with validation error display.
 */
export function BlackoutDateForm({
  selectedDate,
  setSelectedDate,
  blackoutReason,
  setBlackoutReason,
  errors,
}: BlackoutDateFormProps) {
  // Helper function to find and display a specific error message
  const getErrorMessage = (path: string) => {
    const error = errors.find((e) => e.path.includes(path));
    return error ? (
      <p className="text-sm text-destructive col-start-2 col-span-3">
        {error.message}
      </p>
    ) : null;
  };

  return (
    <>
      {/* Date Picker Input */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="blackoutDate" className="text-right">
          Date
        </Label>
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <Button
              id="blackoutDate"
              variant="outline"
              className="col-span-3 w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP") // e.g., "Jan 1st, 2023"
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className=" p-0 z-[10001]" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              autoFocus
              captionLayout="dropdown-months"
              footer={
                <div className="text-xs text-muted-foreground text-center pt-2">
                  Only the <strong>day</strong> and <strong>month</strong> are
                  relevant — the <strong>year</strong> will be ignored.
                </div>
              }
              //   className="aspect-square"
            />
          </PopoverContent>
        </Popover>
        {getErrorMessage("date")}
      </div>

      {/* Reason Input */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="blackoutReason" className="text-right">
          Reason
          {/* <span className="text-xs text-muted-foreground">(optional)</span> */}
        </Label>
        <Input
          id="blackoutReason"
          value={blackoutReason}
          onChange={(e) => setBlackoutReason(e.target.value)}
          className="col-span-3"
          placeholder="Holiday, Maintenance, etc."
        />
        {getErrorMessage("reason")}
      </div>
    </>
  );
}
