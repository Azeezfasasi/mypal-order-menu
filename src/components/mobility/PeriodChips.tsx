"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PERIOD_LABELS, type Period } from "./mobility-utils";

interface PeriodChipsProps {
  value: Period;
  customRange?: DateRange;
  onChange: (period: Period, customRange?: DateRange) => void;
}

const chipClass = (active: boolean) =>
  cn(
    "flex min-w-[110px] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors md:min-w-0 md:flex-1",
    active ? "bg-orange-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  );

/** Today / 3-day / Weekly, or a custom date range */
export function PeriodChips({ value, customRange, onChange }: PeriodChipsProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(customRange);

  return (
    <div className="flex flex-wrap gap-3 md:gap-2">
      {(["today", "3-day", "weekly"] as const).map((period) => (
        <button key={period} type="button" onClick={() => onChange(period)} className={chipClass(value === period)}>
          {PERIOD_LABELS[period]}
        </button>
      ))}

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setDraft(customRange);
        }}
      >
        <PopoverTrigger asChild>
          <button type="button" className={chipClass(value === "custom")}>
            <CalendarDays className="h-4 w-4" />
            {value === "custom" && customRange?.from
              ? `${format(customRange.from, "d MMM")}${customRange.to ? ` – ${format(customRange.to, "d MMM")}` : ""}`
              : PERIOD_LABELS.custom}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={draft}
            onSelect={setDraft}
            defaultMonth={draft?.from}
          />
          <div className="flex justify-end gap-2 border-t p-3">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!draft?.from}
              onClick={() => {
                onChange("custom", { from: draft?.from, to: draft?.to ?? draft?.from });
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
