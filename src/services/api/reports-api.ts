// src/services/api/reports-api.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import type { BaseApiResponse, PaginationResult } from "@/types/api";
import type {
  FilterType,
  CustomerAnalytics,
  MonthlyAnalysis,
  YearlyComparison,
} from "@/types/reports";
import { IUser } from "@/types";

// Define endpoint mapping for different query types
const QUERY_ENDPOINTS = {
  "customer-demographics": ENDPOINTS.USER.USERS_FILTER,
  "customer-stats": ENDPOINTS.USER.USERS_FILTER,
  "yearly-analytics": ENDPOINTS.USER.USERS_FILTER,
  "monthly-analysis": ENDPOINTS.USER.USERS_FILTER,
  "yearly-comparison": ENDPOINTS.USER.USERS_FILTER,
} as const;

type QueryType = keyof typeof QUERY_ENDPOINTS;

/**
 * A generic factory for creating report queries with proper endpoint routing
 */
const useReportQuery = <TData>(
  queryType: QueryType,
  queryKey: (string | object)[],
  params: Record<string, string | number | boolean | undefined>,
  enabled = true
): UseQueryResult<TData, Error> => {
  return useQuery<TData, Error>({
    queryKey: [queryType, ...queryKey],
    queryFn: async () => {
      // Filter out undefined params before creating search string
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      );

      const searchParams = new URLSearchParams(
        filteredParams as Record<string, string>
      );

      const endpoint = QUERY_ENDPOINTS[queryType];
      const url = searchParams.toString()
        ? `${endpoint}?${searchParams.toString()}`
        : endpoint;

      const response = await apiClient.get<BaseApiResponse<TData>>(url);
      return response.data.data;
    },
    enabled,
    // Add stale time to prevent unnecessary refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Keep data fresh for 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
  });
};

interface CustomerDemographicsParams {
  filter: FilterType;
  year?: string;
  location?: string;
  page?: number;
  limit?: number;
}

interface CustomerStatsParams {
  filter: "day" | "week" | "month";
  page?: number;
  limit?: number;
}

interface YearlyAnalyticsParams {
  year: string;
}

interface MonthlyAnalysisParams {
  type:
    | "new-customers"
    | "recurring-customers"
    | "returning-customers"
    | "all-customers";
  year: string;
  monthly_analysis: boolean;
}

interface CompareYearsParams {
  year1: string;
  year2: string;
}

const createReportsApi = () => {
  return {
    /**
     * Fetches paginated customer data based on various filters.
     */
    useGetCustomerDemographics: (params: CustomerDemographicsParams) =>
      useReportQuery<PaginationResult<IUser[]>>(
        "customer-demographics",
        [params],
        {
          filter: params.filter,
          year: params.year,
          location: params.location,
          page: params.page,
          limit: params.limit,
        },
        !!params.filter
      ),

    /**
     * Fetches customer counts for today, this week, or this month.
     */
    useGetCustomerStats: (params: CustomerStatsParams) =>
      useReportQuery<PaginationResult<IUser>>(
        "customer-stats",
        [params],
        {
          filter: params.filter,
          page: params.page,
          limit: params.limit,
        },
        !!params.filter
      ),

    /**
     * Fetches a yearly summary of customer analytics.
     */
    useGetYearlyAnalytics: (params: YearlyAnalyticsParams) =>
      useReportQuery<CustomerAnalytics>(
        "yearly-analytics",
        [params],
        {
          filter: "yearly-summary",
          year: params.year,
        },
        !!params.year
      ),

    /**
     * Fetches monthly customer analysis based on customer type.
     */
    useGetMonthlyAnalysis: (params: MonthlyAnalysisParams) =>
      useReportQuery<MonthlyAnalysis>(
        "monthly-analysis",
        [params],
        {
          filter: params.type,
          year: params.year,
          monthly_analysis: params.monthly_analysis,
        },
        !!params.year && !!params.type && !!params.monthly_analysis
      ),

    /**
     * Fetches a comparison of yearly stats between two years.
     */
    useCompareYears: (params: CompareYearsParams) =>
      useReportQuery<YearlyComparison>(
        "yearly-comparison",
        [params],
        {
          filter: "compare-years",
          year1: params.year1,
          year2: params.year2,
        },
        !!params.year1 && !!params.year2
      ),
  };
};

export const ReportsApi = createReportsApi();
