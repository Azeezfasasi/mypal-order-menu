import { monthNames } from "@/lib/revenue-reports-utils";
import {
  CustomerAnalytics,
  MonthlyAnalysis,
  YearlyComparison,
} from "@/types/reports";
import { YEARLY_CHART_CONFIG } from "./chart-configs";

// Utility functions for processing chart data
export const processYearlyChartData = (
  yearlyAnalytics: CustomerAnalytics | undefined
) => {
  if (!yearlyAnalytics) return [];
  return [
    {
      category: "New",
      value: yearlyAnalytics.newCustomers,
      fill: YEARLY_CHART_CONFIG.newCustomers.color,
    },
    {
      category: "Returning",
      value: yearlyAnalytics.returningCustomers,
      fill: YEARLY_CHART_CONFIG.returningCustomers.color,
    },
    {
      category: "Recurring",
      value: yearlyAnalytics.recurringCustomers,
      fill: YEARLY_CHART_CONFIG.recurringCustomers.color,
    },
    {
      category: "All",
      value: yearlyAnalytics.allCustomers,
      fill: YEARLY_CHART_CONFIG.allCustomers.color,
    },
  ];
};

export const processYearlyComparisonData = (
  yearlyComparisonData: YearlyComparison | undefined,
  compareYear1: string,
  compareYear2: string
) => {
  if (!yearlyComparisonData) return [];
  const categories: (keyof CustomerAnalytics)[] = [
    "newCustomers",
    "returningCustomers",
    "recurringCustomers",
    "allCustomers",
  ];
  const labels = ["New", "Returning", "Recurring", "All"];
  return categories.map((category, index) => ({
    category: labels[index],
    [compareYear1]: yearlyComparisonData[compareYear1]?.[category] || 0,
    [compareYear2]: yearlyComparisonData[compareYear2]?.[category] || 0,
  }));
};

export const processMonthlyChartData = (
  monthlyData: MonthlyAnalysis | undefined
) => {
  const data = monthlyData ? Object.values(monthlyData) : [];
  return monthNames.map((month, index) => ({
    month,
    value: data[index] || 0,
  }));
};
