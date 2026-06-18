"use client";

import { YearPicker } from "@/components/shared/year-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_HEIGHTS, CHART_MARGINS } from "./chart-configs";
import { processYearlyComparisonData } from "./chart-data-utils";

import { YearlyComparison } from "@/types/reports";

interface YearlyComparisonChartProps {
  yearlyComparisonData: YearlyComparison | undefined;
  isLoading: boolean;
  compareYear1: string;
  compareYear2: string;
  onCompareYear1Change: (year: string) => void;
  onCompareYear2Change: (year: string) => void;
}

export default function YearlyComparisonChart({
  yearlyComparisonData,
  isLoading,
  compareYear1,
  compareYear2,
  onCompareYear1Change,
  onCompareYear2Change,
}: YearlyComparisonChartProps) {
  const chartData = processYearlyComparisonData(
    yearlyComparisonData,
    compareYear1,
    compareYear2
  );

  return (
    <Card>
      <CardHeader className="flex md:flex-col gap-4 flex-row items-center justify-between md:items-start">
        <div>
          <CardTitle>Year over Year Comparison</CardTitle>
          <CardDescription>
            {`Customers comparison between ${compareYear1} and ${compareYear2}`}
          </CardDescription>
        </div>

        <div className="flex md:flex-col gap-3 flex-row">
          <YearPicker year={compareYear1} onYearChange={onCompareYear1Change} />
          <YearPicker year={compareYear2} onYearChange={onCompareYear2Change} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            className={`flex md:${CHART_HEIGHTS.mobile} ${CHART_HEIGHTS.desktop} items-center justify-center text-gray-500`}
          >
            Loading comparison...
          </div>
        ) : (
          <div
            className={`w-full md:${CHART_HEIGHTS.mobile} ${CHART_HEIGHTS.desktop}`}
          >
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={CHART_MARGINS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend />
                  <Bar
                    dataKey={compareYear1}
                    fill="#001529"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey={compareYear2}
                    fill="#1677ff"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
