// hooks/useDashboardFilters.ts
import { useState, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { TimeFrame } from "@/types/enums";
import { formatDateForApi } from "@/lib/api-helpers";

export function useDashboardFilters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // Keep 1-based for backend
  const [pageSize, setPageSize] = useState(10); // Add page size state
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame | null>(
    null
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleTimeFrameSelect = useCallback((timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);
    setDateRange(undefined);
    setCurrentPage(1);
  }, []);

  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setSelectedTimeFrame(null);
      setCurrentPage(1);
    }
  }, []);

  // Handle page changes from TanStack Table (0-based) to backend (1-based)
  const handlePageChange = useCallback((page: number) => {
    // Convert from 0-based (TanStack) to 1-based (backend)
    setCurrentPage(page + 1);
  }, []);

  // Handle page size changes
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const getQueryParams = useCallback(
    (status?: string) => ({
      status: status === "all" ? undefined : status,
      page: currentPage, // Already 1-based for backend
      limit: pageSize, // Use dynamic page size
      timeFrame: selectedTimeFrame || undefined,
      startDate: dateRange?.from ? formatDateForApi(dateRange.from) : undefined,
      endDate: dateRange?.to ? formatDateForApi(dateRange.to) : undefined,
    }),
    [currentPage, pageSize, selectedTimeFrame, dateRange]
  );

  const clearAllFilters = useCallback(() => {
    setSelectedTimeFrame(null);
    setDateRange(undefined);
    setSearchTerm("");
    setCurrentPage(1);
    // Don't reset page size when clearing filters
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedTimeFrame,
    dateRange,
    handleTimeFrameSelect,
    handleDateRangeSelect,
    handlePageChange,
    handlePageSizeChange,
    getQueryParams,
    clearAllFilters,
  };
}
