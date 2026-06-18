/* eslint-disable @typescript-eslint/no-explicit-any */
import { IStoredBusiness } from "@/stores/auth-store";
import { IBusiness } from "@/types/auth-types";
import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { parseISO } from "date-fns/parseISO";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { getErrorMessage } from "./handle-error";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to capitalize period names for display
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Helper function to get initials from names
export const getInitials = (firstName = "", lastName = "") => {
  const firstInitial = firstName ? firstName.charAt(0) : "";
  const lastInitial = lastName ? lastName.charAt(0) : "";
  return `${firstInitial}${lastInitial}`.toUpperCase() || "??"; // Fallback
};

// Helper functions for time conversion

/**
 * Represents a time string in 24-hour format (e.g., "14:30", "09:05").
 */
type Time24 = string;

/**
 * Represents a time string in 12-hour format (e.g., "2:30 PM", "09:05 AM").
 */
type Time12 = string;

/**
 * Regular expression to validate 12-hour time format.
 * Matches formats like "1:00 AM", "12:30 PM", "05:45 AM".
 */
const timeRegex: RegExp = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;

/**
 * Converts a 24-hour time string to a 12-hour time string.
 *
 * @param time24 - The time in 24-hour format (e.g., "14:30", "00:00", "23:59").
 * Returns an empty string if the input is null, undefined,
 * does not contain ":", or is an invalid time.
 * @returns The time in 12-hour format (e.g., "2:30 PM", "12:00 AM", "11:59 PM"),
 * or an empty string if conversion fails.
 */
export function convertTo12Hour(
  time24: Time24 | null | undefined,
): Time12 | "" {
  // Check for null, undefined, or invalid format early
  if (!time24 || typeof time24 !== "string" || !time24.includes(":")) {
    console.warn(
      "convertTo12Hour: Invalid input. Expected a string in HH:mm format.",
    );
    return "";
  }

  try {
    // Parse HH:mm string
    const [hoursStr, minutesStr] = time24.split(":");
    const hoursNum = parseInt(hoursStr, 10);
    const minutesNum = parseInt(minutesStr, 10);

    // Validate parsed numbers
    if (
      isNaN(hoursNum) ||
      isNaN(minutesNum) ||
      hoursNum < 0 ||
      hoursNum > 23 || // Ensure hours are within 0-23 range
      minutesNum < 0 ||
      minutesNum > 59 // Ensure minutes are within 0-59 range
    ) {
      console.warn(`convertTo12Hour: Invalid time value provided: ${time24}`);
      return "";
    }

    // Convert to 12-hour format
    const period: "AM" | "PM" = hoursNum >= 12 ? "PM" : "AM";
    let hours12: number = hoursNum % 12;
    if (hours12 === 0) {
      // Convert 0 to 12 for 12 AM (midnight) and 12 PM (noon)
      hours12 = 12;
    }

    // Format hours and minutes with a leading zero if needed
    const formattedHours: string = hours12.toString().padStart(2, "0"); // Added zero-padding for hours
    const formattedMinutes: string = minutesNum.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes} ${period}`;
  } catch (e) {
    console.error("Error converting to 12-hour format:", e, "Input:", time24);
    return ""; // Return empty string on any unexpected error
  }
}

/**
 * Converts a 12-hour time string to a 24-hour time string.
 *
 * @param time12 - The time in 12-hour format (e.g., "2:30 PM", "12:00 AM").
 * It should match the `timeRegex`.
 * Returns an empty string if the input is null, undefined,
 * or does not match the expected format.
 * @returns The time in 24-hour format (e.g., "14:30", "00:00"),
 * or an empty string if conversion fails.
 */
export function convertTo24Hour(
  time12: Time12 | null | undefined,
): Time24 | "" {
  // Check for null, undefined, or invalid format early
  if (!time12 || typeof time12 !== "string" || !time12.match(timeRegex)) {
    console.warn(
      "convertTo24Hour: Invalid input. Expected a string like 'h:mm AM/PM' or 'hh:mm AM/PM'. Input:",
      time12,
    );
    return "";
  }

  try {
    // Parse the 12-hour format
    const parts = time12.toUpperCase().split(" "); // Convert to uppercase to handle "am/pm"
    const timePart = parts[0];
    const period = parts[1] as "AM" | "PM"; // Type assertion

    const [hoursStr, minutesStr] = timePart.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Validate parsed numbers (though regex should catch most issues)
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 1 ||
      hours > 12 || // 12-hour format hours are 1-12
      minutes < 0 ||
      minutes > 59
    ) {
      console.warn(
        `convertTo24Hour: Invalid time value in parsed 12-hour string: ${time12}`,
      );
      return "";
    }

    // Convert to 24-hour
    if (period === "PM" && hours < 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      // Midnight case (12 AM is 00 hours)
      hours = 0;
    }

    // Format with leading zeros for both hours and minutes
    const formattedHours: string = hours.toString().padStart(2, "0");
    const formattedMinutes: string = minutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}`;
  } catch (e) {
    console.error("Error converting to 24-hour format:", e, "Input:", time12);
    return ""; // Return empty string on any unexpected error
  }
}

// Helper function to format review date (with error handling)

export const formatDateDistance = (dateString: string): string => {
  try {
    const date = parseISO(dateString); // Use parseISO for standard ISO strings

    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error parsing review date:", error);

    return "Invalid date"; // Fallback for invalid dates
  }
};

// Status class utility
export function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "px-2 py-1 rounded-full bg-green-100 text-green-600 text-sm";
    case "pending":
      return "px-2 py-1 rounded-full bg-primary-100 text-primary-600 text-sm";
    case "cancelled":
      return "px-2 py-1 rounded-full bg-red-100 text-red-600 text-sm";
    default:
      return "px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-sm";
  }
}

// Utility function to generate page numbers
export function generatePageNumbers(
  totalPages: number,
  currentPage: number,
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // const pages: (number | string)[] = [];

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage > totalPages - 4) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

/**
 * Boolean flag indicating if the environment is in development mode.
 *
 * @constant {boolean}
 */
export const __DEV__ = process.env.NODE_ENV === "development";

/**
 * Formats a number into a localized currency string.
 *
 * @param {number} amount - The amount to format.
 * @param {string} [currency="NGN"] - The currency code (e.g., "NGN", "USD").
 * @param {string} [locale="en-NG"] - The locale string (e.g., "en-NG", "en-US").
 * @param {number} [minFraction=0] - The minimum number of fraction digits.
 * @param {number} [maxFraction=0] - The maximum number of fraction digits.
 * @returns {string} The formatted currency string.
 */
export const formatCurrency = (
  amount: number,
  currency: string = "NGN",
  locale: string = "en-NG",
  minFraction: number = 0,
  maxFraction: number = 3,
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: minFraction,
    maximumFractionDigits: maxFraction,
  }).format(amount);
};

// Format currency for chart
export const formatCurrencyForChart = (value: number) => {
  if (typeof value !== "number" || isNaN(value)) {
    return "₦0";
  }
  if (value >= 1000000) {
    return `₦${(value / 1000000).toFixed(1)}m`;
  }
  if (value >= 1000) {
    return `₦${(value / 1000).toFixed(0)}k`;
  }
  return `₦${value.toFixed(0)}`;
};

/**
 * Converts a string from snake_case to camelCase.
 *
 * @param {string} str - The snake_case string.
 * @returns {string} The camelCase version of the string.
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", ""),
  );
};

/**
 * Converts a string from camelCase to snake_case.
 *
 * @param {string} str - The camelCase string.
 * @returns {string} The snake_case version of the string.
 */
export const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
};

/**
 * Recursively converts object keys from snake_case to camelCase.
 *
 * @template T
 * @param {T} obj - The object with snake_case keys.
 * @returns {any} A new object with camelCase keys.
 */
export const snakeToCamelObject = <T extends object>(obj: T): any => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelObject);
  }

  const result: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const camelKey = toCamelCase(key);

    // Recursively convert nested objects
    result[camelKey] =
      value !== null && typeof value === "object"
        ? snakeToCamelObject(value)
        : value;
  });

  return result;
};

/**
 * Recursively converts object keys from camelCase to snake_case.
 *
 * @template T
 * @param {T} obj - The object with camelCase keys.
 * @returns {any} A new object with snake_case keys.
 */
export const camelToSnakeObject = <T extends object>(obj: T): any => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnakeObject);
  }

  const result: Record<string, any> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const snakeKey = toSnakeCase(key);

    // Recursively convert nested objects
    result[snakeKey] =
      value !== null && typeof value === "object"
        ? camelToSnakeObject(value)
        : value;
  });

  return result;
};

/**
 * Recursively converts object keys from snake_case to camelCase (version 2).
 * This version explicitly handles nested arrays and objects.
 *
 * @param {Record<string, any>} obj - The object with snake_case keys.
 * @returns {Record<string, any>} A new object with camelCase keys.
 */
export const snakeToCamelObjectv2 = <T extends Record<string, any>>(
  obj: T,
): Record<string, any> => {
  const result: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    const camelKey = toCamelCase(key);
    const value = obj[key];

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[camelKey] = snakeToCamelObjectv2(value);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === "object" && item !== null
          ? snakeToCamelObjectv2(item)
          : item,
      );
    } else {
      result[camelKey] = value;
    }
  });

  return result;
};

/**
 * Recursively converts object keys from camelCase to snake_case (version 2).
 * This version explicitly handles nested arrays and objects.
 *
 * @param {Record<string, any>} obj - The object with camelCase keys.
 * @returns {Record<string, unknown>} A new object with snake_case keys.
 */
export const camelToSnakeObjectV2 = <T extends Record<string, any>>(
  obj: T,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.keys(obj).forEach((key) => {
    const snakeKey = toSnakeCase(key);
    const value = obj[key];

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[snakeKey] = camelToSnakeObjectV2(value);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map((item) =>
        typeof item === "object" && item !== null
          ? camelToSnakeObjectV2(item)
          : item,
      );
    } else {
      result[snakeKey] = value;
    }
  });

  return result;
};

// src/utils/formDataUtils.ts
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();

  for (const key in data) {
    if (
      Object.prototype.hasOwnProperty.call(data, key) &&
      data[key] !== undefined
    ) {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    }
  }

  return formData;
};

export const handleApiOperation = async (
  apiCall: Promise<any>,
  loadingMessage: string = "Processing...",
  successMessage: string,
  errorMessage: string,
  toastId: string = "operation",
  refetchCallback?: () => void,
) => {
  try {
    toast.promise(apiCall, {
      id: toastId,
      loading: loadingMessage,
      success: successMessage,
      error: (err) => {
        return getErrorMessage(err);
      },
    });
    if (refetchCallback) refetchCallback();
  } catch (error: any) {
    toast.error(errorMessage, {
      id: "operation",
      description: `${error?.data?.error[0]}`,
    });
  }
};

export function pickBusiness(
  business: IBusiness,
  token: string,
): IStoredBusiness {
  return {
    id: business.id,
    email: business.email,
    role: business.role,
    business_name: business.business_name,
    image_url: business.image_url,
    category: business.category,
    business_type: business.business_type!,
    business_start_date: business.business_start_date!,
    is_active: business.is_active,
    is_verified: business.is_verified,
    verification_notes: business.verification_notes,
    verification_requirements: business.verification_requirements,
    wallet: business.wallet,
    business_number: business.business_number || null,
    tax_identification_number: business.tax_identification_number || null,
    description: business.description || null,
    address: business.address || null,
    long: business.long || null,
    lat: business.lat || null,
    business_bank_name: business.business_bank_name || null,
    business_acc_name: business.business_acc_name || null,
    business_acc_number: business.business_acc_number || null,
    cac_document: business.cac_document || null,
    memat: business.memat || null,
    director_identity: business.director_identity || null,
    directors_address: business.directors_address || null,
    shareholders_address: business.shareholders_address || null,
    // Onboarding fields - CRITICAL for invite flow routing
    businessOnboardingStatus: business.onboarding_status ?? null,
    onboarding_source: business.onboarding_source ?? null,
    available_categories: Array.isArray((business as any).available_categories)
      ? (business as any).available_categories.map((c: any) => ({
          id: c.id,
          name: c.name,
          image_url: c.image_url ?? null,
          business_type: c.business_type ?? null,
        }))
      : undefined,
    linkedBusinesses: Array.isArray((business as any).linkedBusinesses)
      ? (business as any).linkedBusinesses.map((lb: any) => ({
          id: lb.id,
          business_name: lb.business_name,
          image_url: lb.image_url ?? null,
          category: lb.category
            ? { id: lb.category.id, name: lb.category.name }
            : undefined,
          is_primary: lb.is_primary ?? false,
        }))
      : undefined,
    current_token: token,
  };
}

export function hasMeaningfulValues(obj: Record<string, any>) {
  return Object.values(obj).some((v) => {
    if (typeof v === "string") return v.trim().length > 0;
    if (v === null || v === undefined) return false;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  });
}

export function hashStringToNumber(str: string): number {
  let hash = 5381; // DJB2 initial value
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i); // hash * 33 + c
  }
  return hash >>> 0; // Force unsigned 32‑bit integer
}
/**
 * Formats a date string or Date object into a human-readable format.
 * @param {string | Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Utility to format "HH:mm" to "hh:mm AM/PM"
export function formatTimeToAMPM(time: string) {
  if (!time) return "";
  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
}
