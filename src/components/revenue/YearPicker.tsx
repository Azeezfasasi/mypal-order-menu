// components/revenue/YearPicker.tsx (Enhanced)
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface YearPickerProps {
  selectedYear: Date;
  onYearChange: (year: Date) => void;
}

export function YearPicker({ selectedYear, onYearChange }: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate years from 2020 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {selectedYear.getFullYear()} <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
        {years.reverse().map((year) => (
          <DropdownMenuItem
            key={year}
            onClick={() => {
              onYearChange(new Date(year, 0, 1));
              setIsOpen(false);
            }}
          >
            {year}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
