/**
 * Defines the structure for the yearly customer analytics summary.
 * This now includes a count for all customers.
 */
export interface CustomerAnalytics {
  newCustomers: number;
  recurringCustomers: number;
  returningCustomers: number;
  allCustomers: number;
}

/**
 * Defines the structure for monthly analysis data, mapping each month to a numeric value.
 */
export interface MonthlyAnalysis {
  January: number;
  February: number;
  March: number;
  April: number;
  May: number;
  June: number;
  July: number;
  August: number;
  September: number;
  October: number;
  November: number;
  December: number;
}

/**
 * Defines the available filter types for fetching reports.
 * Added 'all-customers' to fetch all customer types and 'yearly-summary' for the annual analytics object.
 */
export type FilterType =
  | "day"
  | "week"
  | "month"
  | "new-customers"
  | "recurring-customers"
  | "returning-customers"
  | "all-customers"
  | "yearly-summary";

export interface YearlyComparison {
  [year: string]: CustomerAnalytics;
}
