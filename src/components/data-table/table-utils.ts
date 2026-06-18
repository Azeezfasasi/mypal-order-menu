// Utility functions for DataTable and GeneralColumnCell
import { ExtendedBadgeVariant } from "../shared/status-badge";

export function formatDate(date: string | Date, format?: string): string {
  const d = new Date(date);
  if (format === "relative") {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }
  return d.toLocaleDateString();
}

export function formatPercentage(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

export function getStatusColor(
  status: string,
  colorMap: Record<string, string>
): string {
  return colorMap[status] || "default";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isObjectWithName(obj: unknown): obj is { name: string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    typeof (obj as { name: unknown }).name === "string"
  );
}

export function isStringOrNumber(val: unknown): val is string | number {
  return typeof val === "string" || typeof val === "number";
}

export function isArrayOfStringOrNumber(
  val: unknown
): val is (string | number)[] {
  return Array.isArray(val) && val.every(isStringOrNumber);
}

// Enhanced status color mapping function
export const getEnhancedStatusColor = (
  status: string,
  colorMap: Record<string, ExtendedBadgeVariant> = {}
): ExtendedBadgeVariant => {
  // Check custom color map first
  if (colorMap[status]) {
    return colorMap[status];
  }

  // Default mappings for common status values
  const defaultMappings: Record<string, ExtendedBadgeVariant> = {
    // Success states
    active: "success",
    completed: "success",
    approved: "success",
    published: "success",
    online: "success",
    verified: "success",
    confirmed: "success",
    paid: "success",
    delivered: "success",

    // Warning states
    pending: "warning",
    review: "warning",
    draft: "warning",
    scheduled: "warning",
    processing: "warning",
    waiting: "warning",
    partial: "warning",
    suspended: "warning",

    // Error states
    inactive: "destructive",
    rejected: "destructive",
    failed: "destructive",
    offline: "destructive",
    cancelled: "destructive",
    deleted: "destructive",
    expired: "destructive",
    blocked: "destructive",

    // Info states
    new: "info",
    updated: "info",
    modified: "info",
    assigned: "info",
    in_progress: "info",
    reviewing: "info",

    // Default/other states
    unknown: "outline",
    other: "default",
    archived: "secondary",
  };

  const lowerStatus = status.toLowerCase().replace(/\s+/g, "_");
  return defaultMappings[lowerStatus] || "default";
};

/**
 * Utility function to format column keys into readable labels
 */
export const formatColumnLabel = (key: string): string => {
  return (
    key
      // Handle camelCase: insert space before uppercase letters
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // Handle snake_case: replace underscores with spaces
      .replace(/_/g, " ")
      // Capitalize first letter of each word
      .replace(/\b\w/g, (match) => match.toUpperCase())
      // Clean up any double spaces
      .replace(/\s+/g, " ")
      .trim()
  );
};
