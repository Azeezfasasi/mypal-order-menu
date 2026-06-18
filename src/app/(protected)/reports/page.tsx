"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback, useMemo, useState } from "react";

import CustomerDemographicsSection from "@/components/reports/customer-demographics-section";
import { ProcessedCustomer } from "@/components/reports/customer-demographics-table";
import MetricsSection from "@/components/reports/metric-section";
import MonthlyAnalysisChart from "@/components/reports/monthly-analysis-chart";
import YearlyAnalyticsChart from "@/components/reports/yearly-analytics-chart";
import YearlyComparisonChart from "@/components/reports/yearly-comparison-chart";
import { ReportsApi } from "@/services/api/reports-api";
import { FilterType } from "@/types/reports";

// Type definitions
type CustomerDemographicsFilter = FilterType | "all";
type MonthlyAnalysisFilter =
  | "new-customers"
  | "recurring-customers"
  | "returning-customers"
  | "all-customers";
type AnalyticsTimeframe = "yearly" | "compare";

export default function ReportsAndAnalyticsPage() {
  const currentYear = useMemo(() => new Date().getFullYear().toString(), []);
  const previousYear = useMemo(
    () => (new Date().getFullYear() - 1).toString(),
    []
  );

  // State management
  const [customerType, setCustomerType] =
    useState<CustomerDemographicsFilter>("all");
  const [location, setLocation] = useState("all");
  const [analyticsTimeframe, setAnalyticsTimeframe] =
    useState<AnalyticsTimeframe>("yearly");
  const [customerTypeAnalytics, setCustomerTypeAnalytics] =
    useState<MonthlyAnalysisFilter>("new-customers");
  const [compareYear1, setCompareYear1] = useState(previousYear);
  const [compareYear2, setCompareYear2] = useState(currentYear);
  const [yearForYearlyAnalytics, setYearForYearlyAnalytics] =
    useState(currentYear);
  const [yearForMonthlyAnalysis, setYearForMonthlyAnalysis] =
    useState(currentYear);

  // API parameters
  const customerDemographicsParams = useMemo(
    () => ({
      filter: customerType === "all" ? "all-customers" : customerType,
      location: location === "all" ? undefined : location,
      year: yearForYearlyAnalytics,
    }),
    [customerType, location, yearForYearlyAnalytics]
  );

  const monthlyAnalysisParams = useMemo(
    () => ({
      type: customerTypeAnalytics,
      year: yearForMonthlyAnalysis,
      monthly_analysis: true,
    }),
    [customerTypeAnalytics, yearForMonthlyAnalysis]
  );

  const yearlyComparisonParams = useMemo(
    () => ({
      year1: compareYear1,
      year2: compareYear2,
    }),
    [compareYear1, compareYear2]
  );

  // API calls
  const { data: todayData, isLoading: loadingToday } =
    ReportsApi.useGetCustomerStats({ filter: "day" });
  const { data: weekData, isLoading: loadingWeek } =
    ReportsApi.useGetCustomerStats({ filter: "week" });
  const { data: monthData, isLoading: loadingMonth } =
    ReportsApi.useGetCustomerStats({ filter: "month" });
  const { data: filteredCustomersData, isLoading: loadingFiltered } =
    ReportsApi.useGetCustomerDemographics(customerDemographicsParams);
  const { data: yearlyAnalytics, isLoading: loadingYearly } =
    ReportsApi.useGetYearlyAnalytics({ year: yearForYearlyAnalytics });
  const { data: monthlyData, isLoading: loadingMonthly } =
    ReportsApi.useGetMonthlyAnalysis(monthlyAnalysisParams);
  const { data: yearlyComparisonData, isLoading: loadingYearlyComparison } =
    ReportsApi.useCompareYears(yearlyComparisonParams);

  // Event handlers
  const handleCustomerTypeChange = useCallback(
    (value: CustomerDemographicsFilter) => {
      setCustomerType(value);
    },
    []
  );

  const handleLocationChange = useCallback((value: string) => {
    setLocation(value);
  }, []);

  const handleAnalyticsTimeframeChange = useCallback((value: string) => {
    setAnalyticsTimeframe(value as AnalyticsTimeframe);
  }, []);

  const handleCustomerTypeAnalyticsChange = useCallback(
    (value: MonthlyAnalysisFilter) => {
      setCustomerTypeAnalytics(value);
    },
    []
  );

  const handleViewCustomer = useCallback((customer: ProcessedCustomer) => {
    console.log("View customer:", customer);
  }, []);

  const handleCustomerSelectionChange = useCallback(
    (selectedCustomers: ProcessedCustomer[]) => {
      console.log("Selected customers:", selectedCustomers);
    },
    []
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600">
          View deep and strategic insights on business data and customer
          demographics
        </p>
      </div>

      {/* Metrics Cards */}
      <MetricsSection
        todayData={todayData}
        weekData={weekData}
        monthData={monthData}
        loadingToday={loadingToday}
        loadingWeek={loadingWeek}
        loadingMonth={loadingMonth}
      />

      {/* Customer Demographics */}
      <CustomerDemographicsSection
        customerType={customerType}
        location={location}
        filteredCustomersData={filteredCustomersData}
        loadingFiltered={loadingFiltered}
        onCustomerTypeChange={handleCustomerTypeChange}
        onLocationChange={handleLocationChange}
        onViewCustomer={handleViewCustomer}
        onSelectionChange={handleCustomerSelectionChange}
      />

      {/* Customer Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between md:flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Customer Analytics</h2>
          <Select
            value={analyticsTimeframe}
            onValueChange={handleAnalyticsTimeframeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="compare">Compare Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {analyticsTimeframe === "yearly" && (
          <YearlyAnalyticsChart
            yearlyAnalytics={yearlyAnalytics}
            isLoading={loadingYearly}
            year={yearForYearlyAnalytics}
            onYearChange={setYearForYearlyAnalytics}
          />
        )}

        {analyticsTimeframe === "compare" && (
          <YearlyComparisonChart
            yearlyComparisonData={yearlyComparisonData}
            isLoading={loadingYearlyComparison}
            compareYear1={compareYear1}
            compareYear2={compareYear2}
            onCompareYear1Change={setCompareYear1}
            onCompareYear2Change={setCompareYear2}
          />
        )}
      </div>

      <MonthlyAnalysisChart
        monthlyData={monthlyData}
        isLoading={loadingMonthly}
        customerTypeAnalytics={customerTypeAnalytics}
        year={yearForMonthlyAnalysis}
        onCustomerTypeChange={handleCustomerTypeAnalyticsChange}
        onYearChange={setYearForMonthlyAnalysis}
      />
    </div>
  );
}
