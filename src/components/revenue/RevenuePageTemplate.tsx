// components/revenue/RevenuePageTemplate.tsx (Enhanced)
"use client";

import { TrendingUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
// import { Button } from "@/components/ui/button";
import ErrorHandler from "@/components/shared/error-handler";
import Loader from "@/components/shared/loading-spinner";
import { ChartFrame } from "@/types/enums";

import { useRevenueData } from "@/hooks/use-revenue-data";

import { YearPicker } from "@/components/shared/year-picker";
import { formatDateForApi, getDateRanges } from "@/lib/api-helpers";
import type { RevenueQueryParams } from "@/services/api/business-overview-and-revenue-api";
import { IBusinessErrorResponse } from "@/types/api";
import type { CompareRevenueData, RevenueData } from "@/types/overview";
import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { CompareTypeDropdown } from "./CompareTypeDropdown";
import { DateRangePicker } from "./DateRangePicker";
import { PeriodTabs } from "./PeriodTabs";
import { RevenueCard } from "./RevenueCard";
import { RevenueChart } from "./RevenueChart";

interface ChartData {
  label: string;
  revenue: number;
}

interface RevenuePageTemplateProps {
  title: string;
  description: string;
  buttonLabel: string;
  revenueCardTitle: string;
  previousRevenueCardTitle: string;
  sectionTitle: string;
  backgroundColor: string;
  barColor: string;
  iconColor: string;
  revenueLabel: string;
  useRevenueHook: (
    params: RevenueQueryParams,
    options?: Omit<
      UseQueryOptions<
        RevenueData[] | CompareRevenueData,
        IBusinessErrorResponse
      >,
      "queryKey" | "queryFn"
    >
  ) => UseQueryResult<RevenueData[] | CompareRevenueData, unknown>;
  loadingMessage: string;
  errorMessage: string;
  emptyStateMessage: string;
  compareEmptyMessage: string;
  isTransactionalBusiness?: boolean; // Optional prop to indicate if the business is transactional
}

export function RevenuePageTemplate({
  title,
  description,
  // buttonLabel,
  revenueCardTitle,
  sectionTitle,
  backgroundColor,
  barColor,
  iconColor,
  revenueLabel,
  useRevenueHook,
  loadingMessage,
  errorMessage,
  emptyStateMessage,
  compareEmptyMessage,
  isTransactionalBusiness,
}: RevenuePageTemplateProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ChartFrame | string>(
    ChartFrame.WEEKLY
  );
  const [selectedYear, setSelectedYear] = useState(new Date());
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [compareType, setCompareType] = useState<ChartFrame>(ChartFrame.DAILY);
  const [isDateRangeComplete, setIsDateRangeComplete] = useState(false);

  // Store last successful data for smooth UX
  const lastChartDataRef = useRef<ChartData[]>([]);
  const { isCompareMode, apiParams, shouldFetchData, transformChartData } =
    useRevenueData(
      selectedPeriod,
      selectedYear,
      startDate,
      endDate,
      compareType
    );

  // Only fetch data if not in compare mode OR if in compare mode and date range is complete
  const shouldFetchCompareData =
    !isCompareMode || (isCompareMode && isDateRangeComplete);

  // Get date ranges for the three cards
  const dateRanges = useMemo(() => getDateRanges(14, "past"), []);

  // API calls for the three different periods
  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    error: revenueError,
  } = useRevenueHook(apiParams, {
    // Disable query if in compare mode but date range is not complete
    enabled:
      shouldFetchData && shouldFetchCompareData && !!apiParams.chartFrame,
  });

  // This Week Revenue
  const { data: thisWeekRevenueData, isLoading: isLoadingThisWeek } =
    useRevenueHook({
      chartFrame: ChartFrame.DAILY,
    });

  // This Month Revenue
  const { data: thisMonthRevenueData, isLoading: isLoadingThisMonth } =
    useRevenueHook({
      chartFrame: ChartFrame.MONTHLY,
    });

  // Last Month Revenue
  const { data: lastMonthRevenueData, isLoading: isLoadingLastMonth } =
    useRevenueHook({
      chartFrame: ChartFrame.MONTHLY,
      startDate: formatDateForApi(dateRanges.lastMonthLast14Days.start),
      endDate: formatDateForApi(dateRanges.lastMonthLast14Days.end),
    });

  // Transform data for chart
  const chartData: ChartData[] = useMemo(() => {
    const transformed = transformChartData(revenueData ?? null) as ChartData[];
    if (transformed && transformed.length > 0) {
      lastChartDataRef.current = transformed;
    }
    return transformed;
  }, [revenueData, transformChartData]);

  // Calculate revenues for each period
  const thisWeekRevenue = useMemo(() => {
    if (!thisWeekRevenueData) return 0;
    const weekData = transformChartData(thisWeekRevenueData) as ChartData[];
    return weekData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  }, [thisWeekRevenueData, transformChartData]);

  const thisMonthRevenue = useMemo(() => {
    if (!thisMonthRevenueData) return 0;
    const monthData = transformChartData(thisMonthRevenueData) as ChartData[];
    return monthData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  }, [thisMonthRevenueData, transformChartData]);

  const lastMonthRevenue = useMemo(() => {
    if (!lastMonthRevenueData) return 0;
    const lastMonthData = transformChartData(
      lastMonthRevenueData
    ) as ChartData[];
    return lastMonthData?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  }, [lastMonthRevenueData, transformChartData]);

  // Reset dates when compare type changes
  const handleCompareTypeChange = (newType: ChartFrame) => {
    setCompareType(newType);
    setStartDate(undefined);
    setEndDate(undefined);
    setIsDateRangeComplete(false);
  };

  // Handle date range completion status
  const handleDateRangeComplete = (isComplete: boolean) => {
    setIsDateRangeComplete(isComplete);
  };

  // Loading and error states
  if (
    !lastChartDataRef.current.length &&
    isLoadingRevenue &&
    shouldFetchData &&
    shouldFetchCompareData
  ) {
    return (
      <div className="space-y-6">
        <Loader message={loadingMessage} />
      </div>
    );
  }

  if (
    revenueError &&
    shouldFetchData &&
    shouldFetchCompareData &&
    !lastChartDataRef.current.length
  ) {
    return (
      <div className="space-y-6">
        <ErrorHandler
          message={
            (revenueError as { message?: string })?.message || errorMessage
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-xl">{title}</h1>
          <p className="text-gray-600 md:text-sm">{description}</p>
        </div>
        {/* <Button className="bg-primary-100 shadow-sm text-primary-600 hover:bg-primary-100">
          {buttonLabel}
        </Button> */}
      </div>

      {/* Revenue Cards - Three cards layout */}
      <div className="grid md:grid-cols-1 grid-cols-3 gap-6">
        <RevenueCard
          title={revenueCardTitle}
          amount={thisWeekRevenue}
          period="This Week"
          isLoading={isLoadingThisWeek}
          isTransactionalBusiness={isTransactionalBusiness} // Pass the prop to indicate if it's transactional
        />
        <RevenueCard
          title={revenueCardTitle}
          amount={lastMonthRevenue}
          period="Last Month"
          isPrevious
          isLoading={isLoadingLastMonth}
          isTransactionalBusiness={isTransactionalBusiness} // Pass the prop to
        />
        <RevenueCard
          title={revenueCardTitle}
          amount={thisMonthRevenue}
          period="This Month"
          isLoading={isLoadingThisMonth}
          isTransactionalBusiness
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="space-y-4">
        <div className={`${backgroundColor} p-3 rounded-lg space-y-4`}>
          <div className="flex items-center gap-2">
            <TrendingUp className={iconColor} />
            <h2 className="text-xl font-semibold md:text-md">{sectionTitle}</h2>
          </div>
          <PeriodTabs
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        <div className={`${backgroundColor} rounded-lg p-6 relative`}>
          {/* Subtle loading overlay if loading and we have previous data */}
          {isLoadingRevenue && lastChartDataRef.current.length > 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-start justify-center z-10 pointer-events-none">
              <div className="m-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 opacity-70" />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6 md:flex-wrap">
            <h3 className="text-lg font-semibold">
              {isCompareMode
                ? "Compare Progress"
                : `${
                    selectedPeriod.charAt(0).toUpperCase() +
                    selectedPeriod.slice(1)
                  } Revenue`}
            </h3>

            {isCompareMode ? (
              <div className="flex items-center gap-4 md:flex-wrap">
                <CompareTypeDropdown
                  selectedType={compareType}
                  onTypeChange={handleCompareTypeChange}
                />
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  compareType={compareType}
                  onRangeComplete={handleDateRangeComplete}
                />
              </div>
            ) : (
              <YearPicker
                year={selectedYear.getFullYear().toString()}
                onYearChange={(yearStr) =>
                  setSelectedYear(new Date(parseInt(yearStr), 0, 1))
                }
              />
            )}
          </div>
          <RevenueChart
            data={
              isLoadingRevenue && lastChartDataRef.current.length > 0
                ? lastChartDataRef.current
                : chartData
            }
            isLoading={
              isLoadingRevenue &&
              !lastChartDataRef.current.length &&
              shouldFetchData &&
              shouldFetchCompareData
            }
            isCompareMode={isCompareMode}
            selectedPeriod={selectedPeriod}
            hasDateRange={isDateRangeComplete}
            barColor={barColor}
            revenueLabel={revenueLabel}
            emptyStateMessage={emptyStateMessage}
            compareEmptyMessage={compareEmptyMessage}
          />
        </div>
      </div>
    </div>
  );
}
