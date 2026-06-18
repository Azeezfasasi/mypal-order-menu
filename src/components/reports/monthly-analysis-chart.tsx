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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_HEIGHTS,
  CHART_MARGINS,
  MONTHLY_CHART_CONFIG,
} from "./chart-configs";
import { processMonthlyChartData } from "./chart-data-utils";

type MonthlyAnalysisFilter =
  | "new-customers"
  | "recurring-customers"
  | "returning-customers"
  | "all-customers";

import { MonthlyAnalysis } from "@/types/reports";

interface MonthlyAnalysisChartProps {
  monthlyData: MonthlyAnalysis | undefined;
  isLoading: boolean;
  customerTypeAnalytics: MonthlyAnalysisFilter;
  year: string;
  onCustomerTypeChange: (type: MonthlyAnalysisFilter) => void;
  onYearChange: (year: string) => void;
}

export default function MonthlyAnalysisChart({
  monthlyData,
  isLoading,
  customerTypeAnalytics,
  year,
  onCustomerTypeChange,
  onYearChange,
}: MonthlyAnalysisChartProps) {
  const chartData = processMonthlyChartData(monthlyData);
  const currentConfig = MONTHLY_CHART_CONFIG[customerTypeAnalytics];

  return (
    <Card>
      <CardHeader className="flex md:flex-col gap-4 flex-row md:items-start items-center md:justify-start justify-between">
        <CardTitle>Monthly Analysis - {currentConfig?.label}</CardTitle>
        <div className="flex md:flex-col gap-3 flex-row">
          <Select
            value={customerTypeAnalytics}
            onValueChange={(value) =>
              onCustomerTypeChange(value as MonthlyAnalysisFilter)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-customers">All customers</SelectItem>
              <SelectItem value="new-customers">New customers</SelectItem>
              <SelectItem value="returning-customers">
                Returning customers
              </SelectItem>
              <SelectItem value="recurring-customers">
                Recurring customers
              </SelectItem>
            </SelectContent>
          </Select>
          <YearPicker
            year={year}
            onYearChange={onYearChange}
            startYear={2010}
            footer={
              <div className="text-xs text-muted-foreground text-center pt-2">
                Only the <strong>year</strong> is relevant — the{" "}
                <strong>day</strong> and <strong>month</strong> will be ignored
                but <strong className="text-red-400">required</strong> for
                selection.
              </div>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            className={`flex md:${CHART_HEIGHTS.mobile} ${CHART_HEIGHTS.desktop} items-center justify-center text-gray-500`}
          >
            Loading analysis...
          </div>
        ) : (
          <div
            className={`w-full md:${CHART_HEIGHTS.mobile} ${CHART_HEIGHTS.desktop}`}
          >
            <ChartContainer
              config={MONTHLY_CHART_CONFIG}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={CHART_MARGINS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {currentConfig && (
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={currentConfig.color}
                      strokeWidth={3}
                      dot={{ fill: currentConfig.color, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
