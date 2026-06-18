// components/revenue/CompareTypeDropdown.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { ChartFrame } from "@/types/enums";

interface CompareTypeDropdownProps {
  selectedType: ChartFrame;
  onTypeChange: (type: ChartFrame) => void;
}

const compareTypeOptions = [
  { value: ChartFrame.DAILY, label: "Daily" },
  { value: ChartFrame.WEEKLY, label: "Weekly" },
  { value: ChartFrame.MONTHLY, label: "Monthly" },
  { value: ChartFrame.YEARLY, label: "Yearly" },
];

export function CompareTypeDropdown({
  selectedType,
  onTypeChange,
}: CompareTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = compareTypeOptions.find(
    (option) => option.value === selectedType
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {selectedOption?.label || "Select Type"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {compareTypeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              onTypeChange(option.value);
              setIsOpen(false);
            }}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
