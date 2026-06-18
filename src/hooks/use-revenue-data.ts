// hooks/useRevenueData.ts (Enhanced)
import { useMemo } from "react";
import { ChartFrame } from "@/types/enums";
import { periodToChartFrame } from "@/lib/revenue-reports-utils";
import { CompareRevenueData, RevenueData } from "@/types/overview";
import { transformRevenueData } from "@/lib/revenue-reports-utils";
import { formatDateForApi } from "@/lib/api-helpers";

export function useRevenueData(
  selectedPeriod: string,
  selectedYear: Date,
  startDate?: Date,
  endDate?: Date,
  compareType?: ChartFrame
) {
  const isCompareMode = selectedPeriod === "compare";
  const chartFrame = periodToChartFrame[selectedPeriod];

  // Prepare API parameters
  const apiParams = useMemo(() => {
    if (isCompareMode) {
      return {
        chartFrame: compareType || ChartFrame.DAILY,
        startDate: startDate ? formatDateForApi(startDate) : undefined,
        endDate: endDate ? formatDateForApi(endDate) : undefined,
        year: selectedYear.getFullYear(),
      };
    } else {
      return {
        chartFrame,
        year: selectedYear.getFullYear(),
      };
    }
  }, [
    isCompareMode,
    startDate,
    endDate,
    chartFrame,
    selectedYear,
    compareType,
  ]);

  // Determine if we should enable the API call
  const shouldFetchData = useMemo(() => {
    if (isCompareMode) {
      // Only allow API calls when ALL three parameters are present
      return !!(startDate && endDate && compareType);
    }
    return !!chartFrame;
  }, [isCompareMode, startDate, endDate, chartFrame, compareType]);

  // Transform API data for chart
  const transformChartData = useMemo(() => {
    return (revenueData: RevenueData[] | CompareRevenueData | null) => {
      if (!revenueData) return [];

      if (Array.isArray(revenueData)) {
        return revenueData.map((item, index) => ({
          label: item.period || `Item ${index + 1}`,
          revenue: item.revenue || 0,
        }));
      }

      if (isCompareMode) {
        const compareTypePeriod =
          compareType === ChartFrame.DAILY
            ? "daily"
            : compareType === ChartFrame.WEEKLY
            ? "weekly"
            : compareType === ChartFrame.MONTHLY
            ? "monthly"
            : "yearly";
        return transformRevenueData(
          revenueData,
          compareTypePeriod,
          isCompareMode
        );
      }

      return transformRevenueData(revenueData, selectedPeriod);
    };
  }, [selectedPeriod, isCompareMode, compareType]);

  return {
    isCompareMode,
    chartFrame,
    apiParams: {
      ...apiParams,
      chartFrame: apiParams.chartFrame || ChartFrame.YEARLY,
    },
    shouldFetchData,
    transformChartData,
  };
}
