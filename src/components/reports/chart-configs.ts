// Chart configuration constants
export const YEARLY_CHART_CONFIG = {
  newCustomers: { label: "New Customers", color: "#001529" },
  returningCustomers: { label: "Returning Customers", color: "#1677ff" },
  recurringCustomers: { label: "Recurring Customers", color: "#52c41a" },
  allCustomers: { label: "All Customers", color: "#ff4d4f" },
} as const;

export const MONTHLY_CHART_CONFIG = {
  "new-customers": { label: "New Customers", color: "#001529" },
  "returning-customers": { label: "Returning Customers", color: "#1677ff" },
  "recurring-customers": { label: "Recurring Customers", color: "#52c41a" },
  "all-customers": { label: "All Customers", color: "#ff4d4f" },
} as const;

// Chart margin constants
export const CHART_MARGINS = {
  top: 20,
  right: 30,
  bottom: 5,
} as const;

// Chart height constants
export const CHART_HEIGHTS = {
  mobile: "h-[300px]",
  desktop: "h-[400px]",
} as const;
