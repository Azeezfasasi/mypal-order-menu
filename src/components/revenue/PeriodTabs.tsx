// components/revenue/PeriodTabs.tsx
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartFrame } from "@/types/enums";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  CalendarX2,
  CalendarClock,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";

interface PeriodTabsProps {
  selectedPeriod: ChartFrame | string;
  onPeriodChange: (period: ChartFrame | string) => void;
  isLoading?: boolean;
  gridCols?: string;
}

const periods = [
  { value: "daily", label: "Daily", shortLabel: "Daily", icon: Calendar },
  {
    value: "weekly",
    label: "Weekly",
    shortLabel: "Weekly",
    icon: CalendarDays,
  },
  {
    value: "monthly",
    label: "Monthly",
    shortLabel: "Monthly",
    icon: CalendarRange,
  },
  {
    value: "quarterly",
    label: "Quarterly",
    shortLabel: "Qt'ly",
    icon: CalendarX2,
  },
  {
    value: "6months",
    label: "Bi-annual",
    shortLabel: "6M",
    icon: CalendarClock,
  },
  {
    value: "yearly",
    label: "Yearly",
    shortLabel: "Yearly",
    icon: CalendarCheck,
  },
  {
    value: "compare",
    label: "Compare Progress",
    shortLabel: "Compare",
    icon: TrendingUp,
  },
];

export function PeriodTabs({
  selectedPeriod,
  onPeriodChange,
  isLoading = false,
  gridCols = "grid-cols-7",
}: PeriodTabsProps) {
  return (
    <Tabs value={selectedPeriod} onValueChange={onPeriodChange}>
      <TabsList
        className={`
        w-full bg-transparent p-0 h-auto gap-2 
        grid ${gridCols} md:grid-cols-3 sm:grid-cols-2
      `}
      >
        {periods.map((period) => (
          <TabsTrigger
            key={period.value}
            value={period.value}
            disabled={isLoading}
            className="
              flex items-center justify-center gap-1 rounded-md py-2 px-2 min-w-0 h-auto
              bg-[#7A828926] text-gray-700 
              data-[state=active]:bg-primary-700 data-[state=active]:text-white
              hover:bg-[#7A828940] data-[state=active]:hover:bg-primary-700
              border-0 shadow-none transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            "
          >
            <div className="flex items-center gap-1 min-w-0">
              <period.icon className="h-4 w-4 flex-shrink-0" />
              <span className="sm:text-xs text-sm truncate hidden sm:block">
                {period.shortLabel}
              </span>
              <span className="sm:text-xs text-sm truncate sm:hidden block">
                {period.label}
              </span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
