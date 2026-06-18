import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChartFrame } from "@/types/enums";
import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  format,
  isAfter,
  isSameYear,
  subYears,
} from "date-fns";
import { ChevronDown } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  compareType: ChartFrame;
  onRangeComplete?: (isComplete: boolean) => void; // New prop to notify parent about range completion
}

type DurationConfig = {
  value: number;
  type: "days" | "weeks" | "months" | "years";
  label: string;
};

type ValidationError = {
  type:
    | "invalid_order"
    | "cross_year"
    | "exceeds_duration"
    | "future_date"
    | "incomplete_range";
  message: string;
};

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  compareType,
  onRangeComplete,
}: DateRangePickerProps) {
  // Calendar state management
  const [isOpen, setIsOpen] = useState(false);

  // Constants
  const TODAY = useMemo(() => new Date(), []);
  const MIN_SELECTABLE_DATE = useMemo(() => subYears(TODAY, 10), [TODAY]);

  // Create DateRange object from individual dates
  const dateRange = useMemo((): DateRange | undefined => {
    if (!startDate || !endDate) {
      return startDate ? { from: startDate, to: undefined } : undefined;
    }
    return { from: startDate, to: endDate };
  }, [startDate, endDate]);

  // Check if range is complete (both dates selected)
  const isRangeComplete = useMemo(() => {
    return !!(startDate && endDate);
  }, [startDate, endDate]);

  // Notify parent about range completion status
  React.useEffect(() => {
    onRangeComplete?.(isRangeComplete);
  }, [isRangeComplete, onRangeComplete]);

  // Memoized duration configuration
  const durationConfig = useMemo((): DurationConfig => {
    switch (compareType) {
      case ChartFrame.DAILY:
        return { value: 14, type: "days", label: "Daily" };
      case ChartFrame.WEEKLY:
        return { value: 28, type: "days", label: "Weekly" };
      case ChartFrame.MONTHLY:
        return { value: 12, type: "months", label: "Monthly" };
      case ChartFrame.YEARLY:
        return { value: 5, type: "years", label: "Yearly" };
      default:
        return { value: 14, type: "days", label: "Daily" };
    }
  }, [compareType]);

  // Validation logic
  const validateDateRange = useCallback(
    (start: Date, end: Date): ValidationError | null => {
      // Check if start date is after end date
      if (isAfter(start, end)) {
        return {
          type: "invalid_order",
          message: "Start date cannot be after end date",
        };
      }

      // Check for future dates
      if (isAfter(start, TODAY) || isAfter(end, TODAY)) {
        return {
          type: "future_date",
          message: "Future dates are not allowed",
        };
      }

      // Check if dates are in different years for non-yearly comparisons
      if (compareType !== ChartFrame.YEARLY && !isSameYear(start, end)) {
        return {
          type: "cross_year",
          message: `${durationConfig.label} comparisons must be within the same year`,
        };
      }

      // Check duration limits
      const exceedsDuration = (() => {
        switch (durationConfig.type) {
          case "days":
            return differenceInDays(end, start) > durationConfig.value;
          case "weeks":
            return differenceInDays(end, start) > durationConfig.value * 7;
          case "months":
            return differenceInMonths(end, start) > durationConfig.value;
          case "years":
            return differenceInYears(end, start) > durationConfig.value;
          default:
            return false;
        }
      })();

      if (exceedsDuration) {
        return {
          type: "exceeds_duration",
          message: `Maximum range is ${durationConfig.value} ${durationConfig.type}`,
        };
      }

      return null;
    },
    [compareType, durationConfig, TODAY]
  );

  // Current validation state
  const validationError = useMemo(() => {
    if (!startDate || !endDate) {
      return {
        type: "incomplete_range" as const,
        message:
          "Please select both start and end dates to enable data fetching",
      };
    }
    return validateDateRange(startDate, endDate);
  }, [startDate, endDate, validateDateRange]);

  // Calculate disabled dates based on duration limits
  const disabledDates = useMemo(() => {
    const disabled = {
      before: MIN_SELECTABLE_DATE,
      after: TODAY,
    };

    // Add duration-based restrictions
    if (compareType !== ChartFrame.YEARLY) {
      // For non-yearly comparisons, restrict to same year
      const currentYear = TODAY.getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      disabled.before =
        yearStart > MIN_SELECTABLE_DATE ? yearStart : MIN_SELECTABLE_DATE;
      disabled.after = yearEnd < TODAY ? yearEnd : TODAY;
    }

    return disabled;
  }, [MIN_SELECTABLE_DATE, TODAY, compareType]);

  // Range selection handler
  const handleRangeSelect = useCallback(
    (range: DateRange | undefined) => {
      if (!range) {
        onStartDateChange(undefined);
        onEndDateChange(undefined);
        return;
      }

      const { from, to } = range;

      // Only update start date if changed
      if (from) {
        onStartDateChange(from);
      }

      // Only update end date if user has selected it (not when just start date is picked)
      if (to && from !== to) {
        onEndDateChange(to);
        setIsOpen(false);
      } else {
        onEndDateChange(undefined);
      }
    },
    [onStartDateChange, onEndDateChange]
  );

  // Format display text
  const displayText = useMemo(() => {
    if (!startDate) return "Select date range";
    if (!endDate) return `${format(startDate, "MMM dd, yyyy")} - ...`;
    return `${format(startDate, "MMM dd, yyyy")} - ${format(
      endDate,
      "MMM dd, yyyy"
    )}`;
  }, [startDate, endDate]);

  // Footer content
  const footerContent = useMemo(() => {
    if (validationError && validationError.type !== "incomplete_range") {
      return (
        <div className="p-3 border-t bg-red-50">
          <p className="text-sm text-red-600 font-medium">
            {validationError.message}
          </p>
        </div>
      );
    }

    return (
      <div className="p-3 border-t bg-gray-50">
        <p className="text-sm text-muted-foreground">
          Max range: {durationConfig.value} {durationConfig.type}
        </p>
        {!isRangeComplete && (
          <p className="text-xs text-amber-600 mt-1">
            Select both dates to enable data fetching
          </p>
        )}
      </div>
    );
  }, [validationError, durationConfig, isRangeComplete]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 md:flex-wrap ">
        <Label htmlFor="date-range" className="text-sm font-medium">
          Select Date Range:
        </Label>
        <div className="self-start ">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                id="date-range"
                variant="outline"
                className={cn(
                  "w-64 justify-between font-normal",
                  !startDate && "text-muted-foreground",
                  validationError &&
                    validationError.type !== "incomplete_range" &&
                    "border-red-500 focus:border-red-500"
                )}
              >
                <span className="truncate">{displayText}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleRangeSelect}
                disabled={disabledDates}
                captionLayout="dropdown"
                footer={footerContent}
                autoFocus
                numberOfMonths={1}
                defaultMonth={startDate ? startDate : TODAY}
              />
            </PopoverContent>
          </Popover>
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isRangeComplete ? "bg-green-500" : "bg-amber-400"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isRangeComplete
                ? "Ready for data fetching"
                : "Incomplete range - select both dates"}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Error Display */}
      {validationError && validationError.type !== "incomplete_range" && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">
              {validationError.message}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Please select a valid date range to continue.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
