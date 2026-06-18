import { cn } from "@/lib/utils";
import { TimeFrame } from "@/types/enums";
import { format } from "date-fns";

import { Calendar, ChevronDown, FilterIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { Button } from "../ui/button";
import { Calendar as CalendarComponent } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface FilterControlsProps {
  selectedTimeFrame: TimeFrame | null;
  dateRange: DateRange | undefined;
  searchTerm: string;
  activeTab: string;
  onTimeFrameSelect: (timeFrame: TimeFrame) => void;
  onDateRangeSelect: (range: DateRange | undefined) => void;
  onClearAllFilters: () => void;
  onSearchChange: (term: string) => void;
  showViewAll?: boolean;
}

const timeFrameOptions = [
  { value: TimeFrame.THISWEEK, label: "This Week" },
  { value: TimeFrame.THISMONTH, label: "This Month" },
  { value: TimeFrame.LASTMONTH, label: "Last Month" },
];

export function FilterControls({
  selectedTimeFrame,
  dateRange,
  searchTerm,
  activeTab,
  onTimeFrameSelect,
  onDateRangeSelect,
  onClearAllFilters,
  //   onSearchChange,
  showViewAll = true,
}: FilterControlsProps) {
  const [showTimeFrameDropdown, setShowTimeFrameDropdown] = useState(false);
  const timeFrameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timeFrameRef.current &&
        !timeFrameRef.current.contains(event.target as Node)
      ) {
        setShowTimeFrameDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getActiveFilterText = () => {
    if (selectedTimeFrame) {
      return timeFrameOptions.find((opt) => opt.value === selectedTimeFrame)
        ?.label;
    }
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "MMM dd, y")} - ${format(
        dateRange.to,
        "MMM dd, y"
      )}`;
    }
    return null;
  };

  const hasActiveFilters =
    selectedTimeFrame || dateRange?.from || activeTab !== "all" || searchTerm;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 md:flex-col justify-end">
        <div className="flex gap-2 md:flex-wrap">
          {/* TimeFrame Filter Dropdown */}
          <div className="relative" ref={timeFrameRef}>
            <Button
              variant="outline"
              className="gap-2 "
              onClick={() => setShowTimeFrameDropdown(!showTimeFrameDropdown)}
            >
              <FilterIcon className="h-4 w-4" />
              {selectedTimeFrame
                ? timeFrameOptions.find(
                    (opt) => opt.value === selectedTimeFrame
                  )?.label
                : "Filter by"}
              <ChevronDown className="h-4 w-4" />
            </Button>
            {showTimeFrameDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-10">
                {timeFrameOptions.map((option) => (
                  <button
                    key={option.value}
                    className="w-full px-4 py-2 text-left text-sm  hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                    onClick={() => onTimeFrameSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "gap-2 justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <Calendar className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Select dates</span>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                autoFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (!range) {
                    onDateRangeSelect(undefined);
                    return;
                  }
                  const { from, to } = range;
                  if (from && to && from !== to) {
                    onDateRangeSelect({ from, to });
                  } else if (from) {
                    onDateRangeSelect({ from, to: undefined });
                  } else {
                    onDateRangeSelect(undefined);
                  }
                }}
                captionLayout="dropdown"
              />
              {dateRange?.from && dateRange?.to && (
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => document.body.click()}>
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDateRangeSelect(undefined)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={onClearAllFilters}
            >
              <X className="h-4 w-4" /> Clear All
            </Button>
          )}

          {showViewAll && (
            <Button
              className="bg-[#0B5B8C] hover:bg-primary-700"
              onClick={onClearAllFilters}
            >
              View all
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {getActiveFilterText() && (
        <div className="px-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Active filter:</span>
            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md">
              {getActiveFilterText()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
