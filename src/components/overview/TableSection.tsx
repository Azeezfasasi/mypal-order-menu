// components/dashboard/TableSection.tsx
import { Bookmark, Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface TableSectionProps {
  title: string;
  totalCount: number;
  isLoading: boolean;
  onRefetch: () => void;
  statusTabs: ReactNode;
  filterControls: ReactNode;
  table: ReactNode;
  headerBgColor?: string;
}

export function TableSection({
  title,
  totalCount,
  isLoading,
  // onRefetch,
  statusTabs,
  filterControls,
  table,
  headerBgColor = "bg-[#FFEFEF] bg-opacity-50",
}: TableSectionProps) {
  return (
    <div className="space-y-4 border rounded-md">
      <div className={`space-y-5 ${headerBgColor} p-3 rounded-sm`}>
        {/* Header */}
        <div className="flex items-center justify-between md:flex-col md:justify-start md:items-start gap-3">
          <div className="flex items-center gap-2">
            <Bookmark className="text-primary-400" />
            <h2 className="text-2xl font-bold text-primary-500 font-sora">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                totalCount
              )}
            </h2>
            <span className="text-lg">{title}</span>
          </div>
          {/* <Button variant="outline" className="gap-2" onClick={onRefetch}>
            <DownloadIcon className="h-4 w-4" /> Download PDF
          </Button> */}
        </div>
        <hr className="border-t border-t-[#838383]" />
        {/* Status Tabs */}
        {statusTabs}
      </div>
      <div className="space-y-4 px-4">
        {/* Filter Controls */}
        {filterControls}
        {/* Table */}
        {table}
      </div>
    </div>
  );
}

// components/dashboard/DashboardMetrics.tsx
import { DashboardMetricCard } from "@/components/overview/dashboard-metric";
import { DashboardMetric } from "@/types/home";

interface DashboardMetricsProps {
  metrics: DashboardMetric[];
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
      {metrics.map((metric, index) => (
        <DashboardMetricCard key={index} metric={metric} />
      ))}
    </div>
  );
}
