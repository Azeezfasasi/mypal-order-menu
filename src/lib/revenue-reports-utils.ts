// ============= SHARED UTILITIES =============
// utils/revenue-utils.ts
import { ChartFrame } from "@/types/enums";
import { CompareRevenueData, RevenueData } from "@/types/overview";

// Map period to ChartFrame enum
export const periodToChartFrame: Record<string, ChartFrame> = {
  daily: ChartFrame.DAILY,
  weekly: ChartFrame.WEEKLY,
  monthly: ChartFrame.MONTHLY,
  quarterly: ChartFrame.QUARTERLY,
  "6months": ChartFrame.SIXMONTH,
  yearly: ChartFrame.YEARLY,
};

export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Data transformation functions for different periods
// Helper to format a date string 'YYYY-MM-DD' to 'MMM DD'
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}

// Helper to format a week range 'YYYY-MM-DD to YYYY-MM-DD' to 'MMM DD–DD'
function formatWeekLabel(rangeStr: string) {
  const [start, end] = rangeStr.split(" to ");
  if (!start || !end) return rangeStr;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return rangeStr;
  // If same month, show 'Jul 01–07', else 'Jun 28–Jul 04'
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${monthNames[startDate.getMonth()]} ${String(
      startDate.getDate()
    ).padStart(2, "0")} - ${String(endDate.getDate()).padStart(2, "0")}`;
  } else {
    return `${monthNames[startDate.getMonth()]} ${String(
      startDate.getDate()
    ).padStart(2, "0")} - ${monthNames[endDate.getMonth()]} ${String(
      endDate.getDate()
    ).padStart(2, "0")}`;
  }
}

export const transformRevenueData = (
  data: CompareRevenueData | RevenueData[] | Record<string, number>,
  period: string,
  isCompareMode?: boolean
) => {
  if (!data) return [];

  switch (period) {
    case "daily":
      return Object.entries(data).map(([key, value]) => ({
        label: isCompareMode
          ? formatDateLabel(key)
          : key.replace("day", "Day "),
        revenue: Number(value) || 0,
      }));

    case "weekly":
      return Object.entries(data).map(([key, value]) => ({
        label: isCompareMode
          ? formatWeekLabel(key)
          : key.replace("day", "Day "),
        revenue: Number(value) || 0,
      }));

    case "monthly":
      return Object.entries(data).map(([key, value]) => ({
        label: key.replace("day", "Day "),
        revenue: Number(value) || 0,
      }));

    case "quarterly":
      return Object.entries(data).map(([key, value]) => ({
        label: key.replace("Quarter", "Q"),
        revenue: Number(value) || 0,
      }));

    case "6months":
      return Object.entries(data).map(([key, value]) => ({
        label: key,
        revenue: Number(value) || 0,
      }));

    case "yearly":
      return Object.entries(data).map(([key, value], index) => ({
        label: isCompareMode ? key : monthNames[index] || key,
        revenue: Number(value) || 0,
      }));

    default:
      return [];
  }
};

export const calculateAgeRange = (birthday: string | number | Date | null) => {
  if (!birthday) return "Unknown";
  const age = new Date().getFullYear() - new Date(birthday).getFullYear();
  if (age < 18) return "Under 18";
  if (age <= 25) return "18-25";
  if (age <= 30) return "26-30";
  if (age <= 35) return "31-35";
  if (age <= 40) return "36-40";
  if (age <= 55) return "41-55";
  return "55+";
};
