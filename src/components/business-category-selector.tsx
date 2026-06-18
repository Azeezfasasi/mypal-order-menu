"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BusinessCategory } from "@/types/business-types";
import { BusinessCategoryType } from "@/types/enums";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const businessCategories: BusinessCategory[] = [
  {
    value: BusinessCategoryType.MAINSTREAM,
    label: BusinessCategoryType.MAINSTREAM,
  },
  {
    value: BusinessCategoryType.ICONICDELICACIES,
    label: BusinessCategoryType.ICONICDELICACIES,
  },
  {
    value: BusinessCategoryType.FINEDINING,
    label: BusinessCategoryType.FINEDINING,
  },
  {
    value: BusinessCategoryType.SHORTLET,
    label: BusinessCategoryType.SHORTLET,
  },
  {
    value: BusinessCategoryType.SALONSANDSPA,
    label: BusinessCategoryType.SALONSANDSPA,
  },
  {
    value: BusinessCategoryType.BEACHESRESORTS,
    label: BusinessCategoryType.BEACHESRESORTS,
  },
  {
    value: BusinessCategoryType.BOATYATCHCRUISE,
    label: BusinessCategoryType.BOATYATCHCRUISE,
  },
  {
    value: BusinessCategoryType.BUFFET,
    label: BusinessCategoryType.BUFFET,
  },
  {
    value: BusinessCategoryType.CLUB,
    label: BusinessCategoryType.CLUB,
  },
  {
    value: BusinessCategoryType.PARKSRECREATION,
    label: BusinessCategoryType.PARKSRECREATION,
  },
  {
    value: BusinessCategoryType.HOTELEXPERIENCE,
    label: BusinessCategoryType.HOTELEXPERIENCE,
  },
  {
    value: BusinessCategoryType.NIGHTLIFE,
    label: BusinessCategoryType.NIGHTLIFE,
  },
  {
    value: BusinessCategoryType.BARSLOUNGES,
    label: BusinessCategoryType.BARSLOUNGES,
  },
];

interface BusinessCategorySelectorProps {
  onCategoryChange: (value: BusinessCategoryType) => void;
  initialValue?: string | null;
}

export function BusinessCategorySelector({
  onCategoryChange,
  initialValue = "fine-dining",
}: BusinessCategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    businessCategories.find((category) => category.value === initialValue) ||
      businessCategories[0],
  );

  // Update selected category when initialValue changes
  useEffect(() => {
    const category = businessCategories.find(
      (category) => category.value === initialValue,
    );
    if (category) {
      setSelectedCategory(category);
    }
  }, [initialValue]);

  const handleSelect = (currentValue: string) => {
    const category = businessCategories.find(
      (category) => category.value === currentValue,
    );
    if (category) {
      setSelectedCategory(category);
      onCategoryChange(category.value);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between md:w-[200px]"
        >
          {selectedCategory.label}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 md:w-[200px]">
        <Command>
          <CommandInput placeholder="Search business category..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {businessCategories.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCategory.value === category.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {category.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
