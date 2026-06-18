// components/dashboard/StatusTabs.tsx
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface TabConfig<T extends string> {
  status: T;
  icon: LucideIcon;
  label: string;
  count: number;
}

export interface StatusTabsProps<T extends string> {
  tabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (status: T) => void;
  isLoading?: boolean;
  gridCols?: string;
}

export function StatusTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  isLoading = false,
  gridCols = "grid-cols-4",
}: StatusTabsProps<T>) {
  return (
    <div className={`grid ${gridCols} gap-4 md:grid-cols-2 sm:grid-cols-1`}>
      {tabs.map((tab) => (
        <Button
          key={tab.status}
          variant="ghost"
          className={`flex items-center justify-center gap-2 rounded-md py-3 ${
            activeTab === tab.status
              ? "bg-primary-700 text-white"
              : "bg-[#7A828926] text-gray-700"
          }`}
          onClick={() => onTabChange(tab.status)}
        >
          <div className="flex items-center gap-2">
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </div>
          <span className="text-sm font-semibold">
            {isLoading ? "..." : tab.count}
          </span>
        </Button>
      ))}
    </div>
  );
}
