/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RansackParams {
  q: {
    [key: string]: any;
  };
  page?: number;
  limit?: number;
  // Flag indicating if the *input* `params.page` is 0-based.
  // If false or undefined, the input page is assumed to be 1-based (e.g., from UI).
  inputZeroBased?: boolean;
  // Flag indicating if the *API* expects 0-based page numbers.
  // If false or undefined, the API is assumed to expect 1-based.
  apiZeroBased?: boolean;
}

export const buildRansackQuery = (params: RansackParams) => {
  const queryString = Object.entries(params.q)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  // Determine the raw page number from input, defaulting to 1 if not provided.
  // This `rawInputPage` is still in the base provided by the caller (UI).
  const rawInputPage = typeof params.page === "number" ? params.page : 1;

  // Step 1: Normalize the input page to be 1-based.
  // If the input was 0-based (e.g., 0 for first page), convert it to 1 (0 + 1 = 1).
  // If the input was already 1-based (or default 1), keep it as is.
  const normalizedPageOneBased = params.inputZeroBased
    ? rawInputPage + 1
    : rawInputPage;

  // Step 2: Convert the 1-based normalized page to the API's expected base.
  // If the API expects 0-based (e.g., 0 for first page), convert from 1-based (1 - 1 = 0).
  // If the API expects 1-based, keep it as is.
  const finalPageForApi = params.apiZeroBased
    ? normalizedPageOneBased - 1
    : normalizedPageOneBased;

  const limit = typeof params.limit === "number" ? params.limit : 10;

  return `${queryString}&page=${finalPageForApi}&limit=${limit}`;
};

export function appendFormData(
  formData: FormData,
  data: any,
  parentKey = "",
  recursive = true // Add this parameter to control recursion
) {
  Object.keys(data).forEach((key) => {
    const fullKey = parentKey ? `${parentKey}[${key}]` : key;
    const value = data[key];

    if (value instanceof Date) {
      formData.append(fullKey, value.toISOString());
    } else if (value instanceof File) {
      formData.append(fullKey, value);
    } else if (typeof value === "object" && value !== null) {
      if (recursive) {
        // Recurse if the recursive flag is true
        appendFormData(formData, value, fullKey, recursive);
      } else {
        // Otherwise, stringify the nested object
        formData.append(fullKey, JSON.stringify(value));
      }
    } else {
      formData.append(fullKey, value);
    }
  });
}

// HANDLE ARRAYS
export function appendFormDataV2(
  formData: FormData,
  data: any,
  parentKey = "",
  processNested = true // New parameter to control recursion
) {
  Object.keys(data).forEach((key) => {
    const fullKey = parentKey ? `${parentKey}[${key}]` : key;
    const value = data[key];

    if (value instanceof Date) {
      formData.append(fullKey, value.toISOString());
    } else if (value instanceof File) {
      formData.append(fullKey, value);
    } else if (Array.isArray(value)) {
      // Handle arrays specifically
      value.forEach((item, index) => {
        const arrayKey = `${fullKey}[${index}]`;
        if (typeof item === "object" && item !== null && processNested) {
          appendFormData(formData, item, arrayKey, processNested);
        } else {
          formData.append(arrayKey, JSON.stringify(item));
        }
      });
    } else if (typeof value === "object" && value !== null) {
      if (processNested) {
        // Recursively process nested objects
        appendFormData(formData, value, fullKey, processNested);
      } else {
        // JSON.stringify the nested object
        formData.append(fullKey, JSON.stringify(value));
      }
    } else {
      formData.append(fullKey, value);
    }
  });
}

export const appendField = (formData: FormData, key: string, value: any) => {
  if (value !== undefined && value !== null) {
    if (typeof value === "object" && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value)); // Serialize objects
    } else {
      formData.append(key, value); // Append primitive types or files
    }
  }
};

/**
 * Recursively builds FormData from a given data object.
 *
 * @param formData - The FormData object to append to.
 * @param data - The data to convert to FormData.
 * @param parentKey - The key under which to nest the data.
 */

export function buildFormData(
  formData: FormData,
  data: unknown,
  parentKey?: string
): void {
  if (
    data &&
    typeof data === "object" &&
    !(data instanceof Date) &&
    !(data instanceof File) &&
    !(data instanceof Blob)
  ) {
    Object.keys(data).forEach((key) => {
      // Flatten the key structure if needed
      const flattenedKey = parentKey ? `${parentKey}.${key}` : key;
      buildFormData(
        formData,
        (data as Record<string, unknown>)[key],
        flattenedKey
      );
    });
  } else {
    const value = data == null ? "" : data;
    formData.append(parentKey || "", value as string | Blob);
  }
}

/**
 * Converts a JSON object to FormData.
 *
 * @param data - The JSON object to convert.
 * @returns The generated FormData.
 */
export function jsonToFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  buildFormData(formData, data);
  return formData;
}

export function createFlatFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      if (value instanceof Date) {
        formData.append(key, value.toISOString()); // Handle dates if needed
      } else if (typeof value === "object" && !(value instanceof File)) {
        // Decide if you want to stringify simple objects or skip them for flat structure
        // Stringifying might be okay for some APIs, but often flat means only primitives/Files
        // Let's assume we only append primitives and Files for a truly flat structure:
        // If you NEED to stringify, use: formData.append(key, JSON.stringify(value));
        console.warn(
          `Skipping object value for key "${key}" in createFlatFormData. Stringify or handle differently if needed.`
        );
      } else {
        formData.append(key, value); // Append primitives (string, number, boolean) and Files
      }
    }
  });
  return formData;
}

// Refined utility function matching the successful manual logic
export function createFlatFormDataV2(data: Record<string, any>): FormData {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];

    // Check for undefined and null (manual code only checked undefined, null is safer)
    if (value !== undefined && value !== null) {
      // Handle File instance specifically, like the manual code
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        // For ALL other types (string, number, boolean, Date, other objects),
        // append directly. FormData handles string conversion.
        // This mimics the successful manual approach.
        formData.append(key, value);
      }
    }
  });

  return formData;
}

/**
 * Generates an object containing various predefined and custom date ranges.
 *
 * @param {number} [rangeInDays] - Optional. If provided, specifies a custom range in days.
 * - When `direction` is "past", it calculates a range ending today and extending `rangeInDays` into the past.
 * - When `direction` is "future", it calculates a range starting today and extending `rangeInDays` into the future.
 * @param {"past" | "future"} [direction="past"] - Optional. Determines the direction of the `customRange` if `rangeInDays` is provided.
 * @returns {object} An object containing various date range objects. Each date range object has `start` and `end` properties, both of which are `Date` objects.
 * @property {object} thisWeek - The current week, starting from Monday and ending on Sunday.
 * @property {object} thisMonth - The current calendar month, from the 1st day to the last day.
 * @property {object} lastMonth - The previous calendar month, from the 1st day to the last day.
 * @property {object} lastMonthLast14Days - The last 14 days of the *previous* calendar month. This range ends on the last day of the previous month.
 * @property {object} twoMonthsAgoLast14Days - The last 14 days of the month that was *two months prior* to the current month. This range ends on the last day of the month two months ago.
 * @property {object} [customRange] - Optional. Only included if `rangeInDays` is provided. Represents a custom date range based on the `rangeInDays` and `direction` parameters.
 */
export const getDateRanges = (
  rangeInDays?: number,
  direction: "past" | "future" = "past"
) => {
  const now = new Date();

  // This week (Monday to Sunday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // This month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Last month
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Two months ago (full month)
  const startOfTwoMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 2,
    1
  );
  const endOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0);

  // Last 14 days of last month
  const lastMonthLast14DaysEnd = new Date(endOfLastMonth); // last day of last month
  const lastMonthLast14DaysStart = new Date(endOfLastMonth);
  lastMonthLast14DaysStart.setDate(lastMonthLast14DaysEnd.getDate() - 13);

  // Two months ago (last 14 days of the month before last month)
  const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0); // Last day of the month two months ago
  const twoMonthsAgoLast14DaysEnd = new Date(twoMonthsAgoEnd);
  const twoMonthsAgoLast14DaysStart = new Date(twoMonthsAgoEnd);
  twoMonthsAgoLast14DaysStart.setDate(twoMonthsAgoLast14DaysEnd.getDate() - 13);

  // Custom range (past or future from today)
  let customRange;
  if (rangeInDays) {
    const start = new Date(now);
    const end = new Date(now);

    if (direction === "past") {
      start.setDate(now.getDate() - (rangeInDays - 1));
    } else if (direction === "future") {
      end.setDate(now.getDate() + (rangeInDays - 1));
    }

    customRange = {
      start: direction === "past" ? start : now,
      end: direction === "past" ? now : end,
    };
  }

  return {
    thisWeek: { start: startOfWeek, end: endOfWeek },
    thisMonth: { start: startOfMonth, end: endOfMonth },
    lastMonth: { start: startOfLastMonth, end: endOfLastMonth },
    lastMonthLast14Days: {
      start: lastMonthLast14DaysStart,
      end: lastMonthLast14DaysEnd,
    },
    twoMonthsAgo: {
      // Added the full two months ago range
      start: startOfTwoMonthsAgo,
      end: endOfTwoMonthsAgo,
    },
    twoMonthsAgoLast14Days: {
      // Added the new range
      start: twoMonthsAgoLast14DaysStart,
      end: twoMonthsAgoLast14DaysEnd,
    },
    ...(customRange && { customRange }),
  };
};

// // Get default date ranges
// const ranges = getDateRanges();
// console.log("This Week:", ranges.thisWeek.start, "-", ranges.thisWeek.end);
// console.log("Last Month's Last 14 Days:", ranges.lastMonthLast14Days.start, "-", ranges.lastMonthLast14Days.end);
// console.log("Two Months Ago (Last 14 Days):", ranges.twoMonthsAgoLast14Days.start, "-", ranges.twoMonthsAgoLast14Days.end);

// // Get a custom range of the last 30 days
// const past30Days = getDateRanges(30, "past");
// console.log("Last 30 Days:", past30Days.customRange?.start, "-", past30Days.customRange?.end);

// // Get a custom range of the next 7 days
// const next7Days = getDateRanges(7, "future");
// console.log("Next 7 Days:", next7Days.customRange?.start, "-", next7Days.customRange?.end);

// Helper function to format date for API (DD-MM-YY)
export const formatDateForApi = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};

export const validateDateRange = (
  startDate?: string,
  endDate?: string,
  timeFrame?: string
): boolean => {
  const hasDateRange = !!(startDate && endDate);
  const hasTimeFrame = !!timeFrame;

  if (hasDateRange && hasTimeFrame) {
    throw new Error(
      "Please provide either a date range or a time frame, not both"
    );
  }

  return true;
};
