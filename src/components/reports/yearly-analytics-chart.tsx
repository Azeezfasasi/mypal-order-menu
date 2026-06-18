"use client";

import { YearPicker } from "@/components/shared/year-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CustomerAnalytics } from "@/types/reports";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_HEIGHTS,
  CHART_MARGINS,
  YEARLY_CHART_CONFIG,
} from "./chart-configs";
import { processYearlyChartData } from "./chart-data-utils";

interface YearlyAnalyticsChartProps {
  yearlyAnalytics: CustomerAnalytics | undefined;
  isLoading: boolean;
  year: string;
  onYearChange: (year: string) => void;
}

export default function YearlyAnalyticsChart({
  yearlyAnalytics,
  isLoading,
  year,
  onYearChange,
}: YearlyAnalyticsChartProps) {
  const chartData = processYearlyChartData(yearlyAnalytics);

  return (
    <Card>
      <CardHeader className="flex md:flex-col gap-4 flex-row items-center justify-between md:items-start md:justify-start">
        <CardTitle>Yearly Customer Analytics</CardTitle>
        <YearPicker
          year={year}
          onYearChange={onYearChange}
          footer={
            <div className="text-xs text-muted-foreground text-center pt-2">
              Only the <strong>year</strong> is relevant — the{" "}
              <strong>day</strong> and <strong>month</strong> will be ignored,
              but <strong className="text-red-400">required</strong> for
              selection.
            </div>
          }
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            className={`flex md:${CHART_HEIGHTS.mobile} ${CHART_HEIGHTS.desktop} items-center justify-center text-gray-500`}
          >
            Loading analytics...
          </div>
        ) : (
          <div
            className={`w-full md:${CHART_HEIGHTS.mobile} ${CHART_HEIGHTS.desktop}`}
          >
            <ChartContainer
              config={YEARLY_CHART_CONFIG}
              className="h-full w-full p-0"
            >
              <ResponsiveContainer width="100%" height="100%" className="p-0">
                <BarChart data={chartData} margin={CHART_MARGINS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
