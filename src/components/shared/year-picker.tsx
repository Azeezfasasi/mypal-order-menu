import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { Button } from "../ui/button";

export interface YearPickerProps {
  year: string;
  onYearChange: (year: string) => void;
  className?: string;
  footer?: ReactNode;
  startYear?: number;
  endYear?: number;
}

/**
 * True year-only picker that triggers immediately on year selection
 */
export const YearPicker = ({
  year,
  onYearChange,
  className,
  footer,
  startYear = 2000,
  endYear = new Date().getFullYear(),
}: YearPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(parseInt(year));

  // Find the decade range for display
  const startDecade = Math.floor(displayYear / 10) * 10;
  const visibleYears = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => startDecade + i - 1);
  }, [startDecade]);

  const handleYearSelect = useCallback(
    (selectedYear: number) => {
      if (selectedYear >= startYear && selectedYear <= endYear) {
        onYearChange(selectedYear.toString());
        setIsOpen(false);
      }
    },
    [onYearChange, startYear, endYear]
  );

  const handlePrevDecade = useCallback(() => {
    setDisplayYear((prev) => Math.max(prev - 10, startYear));
  }, [startYear]);

  const handleNextDecade = useCallback(() => {
    setDisplayYear((prev) => Math.min(prev + 10, endYear));
  }, [endYear]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-fit justify-start text-left font-normal", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {year}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto max-w-sm" align="start">
        <div className="p-3">
          {/* Year navigation header */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevDecade}
              disabled={displayYear <= startYear}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold text-sm">
              {startDecade} - {startDecade + 9}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDecade}
              disabled={displayYear >= endYear}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Years grid - responsive: 2 cols on mobile, 4 on desktop */}
          <div className="grid sm:grid-cols-2 grid-cols-4 gap-1">
            {visibleYears.map((yearOption) => {
              const isSelected = yearOption.toString() === year;
              const isInRange =
                yearOption >= startYear && yearOption <= endYear;
              const isCurrentDecade =
                yearOption >= startDecade && yearOption < startDecade + 10;

              return (
                <Button
                  key={yearOption}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleYearSelect(yearOption)}
                  disabled={!isInRange}
                  className={cn(
                    "h-8 sm:text-xs text-sm sm:min-w-[3rem] min-w-[2.5rem]",
                    isSelected && "bg-primary text-primary-foreground",
                    !isCurrentDecade && "text-muted-foreground",
                    !isInRange && "text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {yearOption}
                </Button>
              );
            })}
          </div>

          {footer && <div className="mt-3 pt-3 border-t">{footer}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Usage examples:
// <YearPicker
//   year="2024"
//   onYearChange={(year) => console.log('Selected year:', year)}
//   startYear={2010}
//   endYear={2030}
// />

// <YearPicker
//   year={selectedYear}
//   onYearChange={setSelectedYear}
//   footer={
//     <div className="text-xs text-muted-foreground text-center">
//       Select any year to view analytics
//     </div>
//   }
// />
