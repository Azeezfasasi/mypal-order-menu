// types/home.ts
export interface DashboardMetric {
  title: string;
  value: number;
  currency: boolean;
  trend: "up" | "down";
  trendPercentage: number;
  isLoading?: boolean;
  isPercentage?: boolean; // New: indicates if the value should be displayed as a percentage
}

export interface Order {
  id: number;
  name: string;
  avatar: string;
  orderId: string;
  date: string;
  amount: string;
  status: "Completed" | "Pending" | "Cancelled";
}
