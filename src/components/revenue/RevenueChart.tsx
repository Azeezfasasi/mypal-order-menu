// components/revenue/RevenueChart.tsx
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Calendar as CalendarIcon } from "lucide-react";
import { formatCurrencyForChart, capitalize } from "@/lib/utils";

interface ChartData {
  label: string;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartData[];
  isLoading: boolean;
  isCompareMode: boolean;
  selectedPeriod: string;
  hasDateRange: boolean;
  barColor?: string;
  revenueLabel?: string;
  emptyStateMessage?: string;
  compareEmptyMessage?: string;
}

export function RevenueChart({
  data,
  isLoading,
  isCompareMode,
  selectedPeriod,
  hasDateRange,
  barColor = "#001529",
  revenueLabel = "Revenue",
  emptyStateMessage = "No revenue data available for this period",
  compareEmptyMessage = "Please select start and end dates to compare progress",
}: RevenueChartProps) {
  return (
    <div className="h-[400px] w-full">
      {isCompareMode && !hasDateRange ? (
        <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
          <CalendarIcon className="h-12 w-12 text-gray-300" />
          <p className="text-lg">{compareEmptyMessage}</p>
          <p className="text-sm">
            Choose a date range above to view revenue comparison
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading chart data...</span>
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" />
            <YAxis tickFormatter={formatCurrencyForChart} width={60} />
            <Tooltip
              formatter={(value: number) => [
                formatCurrencyForChart(value),
                revenueLabel,
              ]}
              labelFormatter={(label) =>
                isCompareMode
                  ? `Period: ${label}`
                  : `${capitalize(selectedPeriod)}: ${label}`
              }
            />
            <Bar
              dataKey="revenue"
              fill={barColor}
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          {emptyStateMessage}
        </div>
      )}
    </div>
  );
}
