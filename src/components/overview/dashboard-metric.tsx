import { useAuth } from "@/hooks/use-auth";
import { formatDateForApi, getDateRanges } from "@/lib/api-helpers";
import { formatCurrency } from "@/lib/utils";
import { BusinessOverviewAndRevenueApi } from "@/services/api/business-overview-and-revenue-api";
import { BusinessReviewApi } from "@/services/api/business-reviews-api";
import { BusinessCategoryType, ChartFrame } from "@/types/enums";
import { DashboardMetric } from "@/types/home";
import Link from "next/link";
import { useMemo } from "react";

interface DashboardMetricCardProps {
  metric: DashboardMetric;
  businessCategory?: BusinessCategoryType; // Add businessCategory prop
}

export function DashboardMetricCard({
  metric,
  businessCategory,
}: DashboardMetricCardProps) {
  // Determine the dynamic message for the revenue card
  const getRevenueCardMessage = () => {
    switch (businessCategory) {
      case BusinessCategoryType.MAINSTREAM:
        return "Last month's order";
      case BusinessCategoryType.ICONICDELICACIES:
        return "Last month's order";
      case BusinessCategoryType.FINEDINING:
      case BusinessCategoryType.SALONSANDSPA:
      case BusinessCategoryType.BUFFET:
        return "Last month's reservation";
      default:
        return "Last month's transaction"; // Default for other categories
    }
  };

  // Determine if the current business category uses reservations
  const usesReservations =
    businessCategory === BusinessCategoryType.FINEDINING ||
    businessCategory === BusinessCategoryType.SALONSANDSPA;

  return (
    <div
      className={`
      ${
        metric.title === "Total revenue generated"
          ? "bg-[#001529] text-white"
          : "bg-[#1194E5] bg-opacity-15 border border-[#1194E5]"
      } rounded-xl overflow-hidden`}
    >
      <div
        className={`
        p-4 h-full
        ${
          metric.title === "Total revenue generated"
            ? "bg-[#001529] text-white"
            : "bg-white text-black"
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <span
            className={`
            text-sm
            ${
              metric.title === "Total revenue generated"
                ? "text-gray-300"
                : "text-gray-500"
            }`}
          >
            {/* Conditional title based on business type */}
            {metric.title === "Total revenue generated" && usesReservations
              ? "Total Bookings"
              : metric.title}
          </span>
          {metric.title === "Total revenue generated" && (
            <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
              {getRevenueCardMessage()}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          {metric.title === "Customer Satisfaction" && (
            <div className="text-right">
              <Link
                href="/customers"
                className="text-blue-600 text-sm md:text-xs"
              >
                View Information →
              </Link>
            </div>
          )}
          <h2
            className={`
            text-3xl font-bold
            ${
              metric.title === "Total revenue generated"
                ? "text-white"
                : "text-black"
            }`}
          >
            {/* Conditional rendering for currency vs. raw number */}
            {metric.title === "Total revenue generated" && usesReservations ? (
              <>{metric.value}</> // Display raw value for bookings
            ) : metric.currency ? (
              <>
                {formatCurrency(metric.value)}
                <span className="text-gray-400">.00</span>
              </>
            ) : (
              <div className="flex items-center">
                {metric.value}%
                <div
                  className={`
                  ml-2 text-sm
                  ${metric.trend === "up" ? "text-green-500" : "text-red-500"}
                `}
                >
                  {metric.trend === "up" ? "↑" : "↓"} {metric.trendPercentage}%
                </div>
              </div>
            )}
          </h2>
        </div>
      </div>
    </div>
  );
}

export function DashboardMetrics() {
  const { user: business } = useAuth();
  const businessCategory = business?.category?.business_type;
  const businessId = business?.id;

  // Determine which features are enabled for the current business category
  const enableReservations =
    businessCategory === BusinessCategoryType.FINEDINING ||
    businessCategory === BusinessCategoryType.SALONSANDSPA;
  const enableTransactions = !enableReservations;

  // Revenue data fetching based on business type
  const dateRanges = useMemo(() => getDateRanges(30, "past"), []);

  // Revenue query parameters for current period
  const revenueQueryParams = useMemo(
    () => ({
      chartFrame: ChartFrame.MONTHLY,
      startDate: formatDateForApi(dateRanges.lastMonth.start),
      endDate: formatDateForApi(dateRanges.lastMonth.end),
    }),
    [dateRanges],
  );

  // Revenue query parameters for previous period (e.g., two months ago)
  const prevRevenueQueryParams = useMemo(
    () => ({
      chartFrame: ChartFrame.MONTHLY,
      startDate: formatDateForApi(dateRanges.twoMonthsAgo.start),
      endDate: formatDateForApi(dateRanges.twoMonthsAgo.end),
    }),
    [dateRanges],
  );

  // Fetch current revenue data based on business type
  const transactionRevenueQuery =
    BusinessOverviewAndRevenueApi.useGetBusinessTransactionRevenues(
      revenueQueryParams,
      { enabled: enableTransactions },
    );

  const reservationRevenueQuery =
    BusinessOverviewAndRevenueApi.useGetBusinessReservationRevenues(
      revenueQueryParams,
      { enabled: enableReservations },
    );

  // Fetch previous revenue data based on business type
  const prevTransactionRevenueQuery =
    BusinessOverviewAndRevenueApi.useGetBusinessTransactionRevenues(
      prevRevenueQueryParams,
      { enabled: enableTransactions },
    );

  const prevReservationRevenueQuery =
    BusinessOverviewAndRevenueApi.useGetBusinessReservationRevenues(
      prevRevenueQueryParams,
      { enabled: enableReservations },
    );

  // Determine which current revenue data to use
  const revenueData = enableReservations
    ? reservationRevenueQuery.data
    : transactionRevenueQuery.data;

  const isLoadingRevenue = enableReservations
    ? reservationRevenueQuery.isLoading
    : transactionRevenueQuery.isLoading;

  // Determine which previous revenue data to use
  const prevRevenueData = enableReservations
    ? prevReservationRevenueQuery.data
    : prevTransactionRevenueQuery.data;

  // Extract total revenue generated from the current revenue data
  const totalRevenueGenerated = useMemo(() => {
    if (!revenueData) return 0;
    if (Array.isArray(revenueData)) {
      return revenueData.reduce(
        (total, item) => total + (item.revenue || 0),
        0,
      );
    } else if (typeof revenueData === "object" && revenueData !== null) {
      if ("revenue" in revenueData) {
        return revenueData.revenue as number;
      }
      const dataAsRecord = revenueData as unknown as Record<string, number>;
      const keys = Object.keys(dataAsRecord);
      if (keys.length > 0) {
        return dataAsRecord[keys[0]];
      }
    }
    return 0;
  }, [revenueData]);

  // Extract total previous revenue generated
  const totalPrevRevenueGenerated = useMemo(() => {
    if (!prevRevenueData) return 0;
    if (Array.isArray(prevRevenueData)) {
      return prevRevenueData.reduce(
        (total, item) => total + (item.revenue || 0),
        0,
      );
    } else if (
      typeof prevRevenueData === "object" &&
      prevRevenueData !== null
    ) {
      if ("revenue" in prevRevenueData) {
        return prevRevenueData.revenue as number;
      }
      const dataAsRecord = prevRevenueData as unknown as Record<string, number>;
      const keys = Object.keys(dataAsRecord);
      if (keys.length > 0) {
        return dataAsRecord[keys[0]];
      }
    }
    return 0;
  }, [prevRevenueData]);

  // Calculate revenue trend
  const revenueTrend = useMemo(() => {
    if (totalPrevRevenueGenerated === 0) {
      return { trend: "up", percentage: 100 }; // If previous was zero, and current is positive, it's a 100% increase
    }
    const difference = totalRevenueGenerated - totalPrevRevenueGenerated;
    const percentage = Math.abs((difference / totalPrevRevenueGenerated) * 100);
    const trend = difference >= 0 ? "up" : "down";
    return { trend, percentage: parseFloat(percentage.toFixed(2)) };
  }, [totalRevenueGenerated, totalPrevRevenueGenerated]);

  // Customer Satisfaction (Average Rating)
  const { data: averageRatingData, isLoading: isLoadingAverageRating } =
    BusinessReviewApi.useGetAverageRating(businessId || "");

  const customerSatisfaction = useMemo(() => {
    const rating = averageRatingData?.data?.averageRating || 0;
    return rating > 0 ? Math.round((rating / 5) * 100) : 0;
  }, [averageRatingData]);

  // For customer satisfaction trend, we'd need previous rating data.
  // For now, we'll use a placeholder or a simplified logic.
  // Assuming a constant trend for demonstration if no historical data is available.
  const customerSatisfactionTrend = revenueTrend;

  // Dashboard metrics with proper revenue data and dynamic trend
  const dashboardMetrics: DashboardMetric[] = [
    {
      title: "Total revenue generated",
      value: totalRevenueGenerated,
      currency: true,
      trend: revenueTrend.trend as "up" | "down",
      trendPercentage: revenueTrend.percentage,
      isLoading: isLoadingRevenue,
    },
    {
      title: "Customer Satisfaction",
      value: customerSatisfaction,
      currency: false,
      isPercentage: true,
      trend: customerSatisfactionTrend.trend as "up" | "down",
      trendPercentage: customerSatisfactionTrend.percentage,
      isLoading: isLoadingAverageRating,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
      {dashboardMetrics.map((metric, index) => (
        <DashboardMetricCard
          key={index}
          metric={metric}
          businessCategory={businessCategory}
        />
      ))}
    </div>
  );
}
