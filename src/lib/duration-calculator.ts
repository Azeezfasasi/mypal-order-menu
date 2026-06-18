import { convertTo24Hour } from "@/lib/utils";

/**
 * Calculates the duration between start and end date/time, date only, or time only.
 * @param startDate - Start date in YYYY-MM-DD format (optional)
 * @param startTime - Start time in 12-hour format (e.g., "09:00 AM") (optional)
 * @param endDate - End date in YYYY-MM-DD format (optional)
 * @param endTime - End time in 12-hour format (e.g., "06:00 PM") (optional)
 * @returns Formatted duration string
 */
export const calculateDuration = (
  startDate?: string,
  startTime?: string,
  endDate?: string,
  endTime?: string
): string => {
  // If all are missing, return empty
  if (!startDate && !startTime && !endDate && !endTime) return "";

  // Date only mode
  if (startDate && endDate && !startTime && !endTime) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start)
        return "";
      const diffDays = Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays === 1 ? "1 Day" : `${diffDays} Days`;
    } catch {
      return "";
    }
  }

  // Time only mode
  if (!startDate && !endDate && startTime && endTime) {
    try {
      const start24 = convertTo24Hour(startTime);
      const end24 = convertTo24Hour(endTime);
      // Use arbitrary date, e.g., 1970-01-01
      const start = new Date(`1970-01-01T${start24}:00`);
      const end = new Date(`1970-01-01T${end24}:00`);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start)
        return "";
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours > 0) {
        const remainingMinutes = diffMinutes % 60;
        if (remainingMinutes === 0) {
          return diffHours === 1 ? "1 Hour" : `${diffHours} Hours`;
        } else {
          const hourText = diffHours === 1 ? "Hour" : "Hours";
          const minuteText = remainingMinutes === 1 ? "Minute" : "Minutes";
          return `${diffHours} ${hourText} ${remainingMinutes} ${minuteText}`;
        }
      } else if (diffMinutes > 0) {
        return diffMinutes === 1 ? "1 Minute" : `${diffMinutes} Minutes`;
      } else {
        return "Less than 1 minute";
      }
    } catch {
      return "";
    }
  }

  // Date + time mode (default)
  if (startDate && startTime && endDate && endTime) {
    try {
      const start24Hour = convertTo24Hour(startTime);
      const end24Hour = convertTo24Hour(endTime);
      const startDateTime = new Date(`${startDate}T${start24Hour}:00`);
      const endDateTime = new Date(`${endDate}T${end24Hour}:00`);
      if (
        isNaN(startDateTime.getTime()) ||
        isNaN(endDateTime.getTime()) ||
        endDateTime <= startDateTime
      )
        return "";
      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        const remainingHours = diffHours % 24;
        if (remainingHours === 0) {
          return diffDays === 1 ? "1 Day" : `${diffDays} Days`;
        } else {
          const dayText = diffDays === 1 ? "Day" : "Days";
          const hourText = remainingHours === 1 ? "Hour" : "Hours";
          return `${diffDays} ${dayText} ${remainingHours} ${hourText}`;
        }
      } else if (diffHours > 0) {
        const remainingMinutes = diffMinutes % 60;
        if (remainingMinutes === 0) {
          return diffHours === 1 ? "1 Hour" : `${diffHours} Hours`;
        } else {
          const hourText = diffHours === 1 ? "Hour" : "Hours";
          const minuteText = remainingMinutes === 1 ? "Minute" : "Minutes";
          return `${diffHours} ${hourText} ${remainingMinutes} ${minuteText}`;
        }
      } else if (diffMinutes > 0) {
        return diffMinutes === 1 ? "1 Minute" : `${diffMinutes} Minutes`;
      } else {
        return "Less than 1 minute";
      }
    } catch {
      return "";
    }
  }

  // If not enough info, return empty
  return "";
};

/**
 * Validates that end date/time is after start date/time
 * @param startDate - Start date in YYYY-MM-DD format (optional)
 * @param startTime - Start time in 12-hour format (optional)
 * @param endDate - End date in YYYY-MM-DD format (optional)  
 * @param endTime - End time in 12-hour format (optional)
 * @returns true if end is after start, false otherwise
 */
export const isValidDateTimeRange = (
  startDate?: string,
  startTime?: string,
  endDate?: string,
  endTime?: string
): boolean => {
  // Handle different modes
  if (startDate && endDate && !startTime && !endTime) {
    // Date only mode
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
    } catch {
      return false;
    }
  }

  if (!startDate && !endDate && startTime && endTime) {
    // Time only mode
    try {
      const start24 = convertTo24Hour(startTime);
      const end24 = convertTo24Hour(endTime);
      const start = new Date(`1970-01-01T${start24}:00`);
      const end = new Date(`1970-01-01T${end24}:00`);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
    } catch {
      return false;
    }
  }

  if (startDate && startTime && endDate && endTime) {
    // Date + time mode
    try {
      const start24Hour = convertTo24Hour(startTime);
      const end24Hour = convertTo24Hour(endTime);
      const startDateTime = new Date(`${startDate}T${start24Hour}:00`);
      const endDateTime = new Date(`${endDate}T${end24Hour}:00`);
      return (
        !isNaN(startDateTime.getTime()) &&
        !isNaN(endDateTime.getTime()) &&
        endDateTime > startDateTime
      );
    } catch {
      return false;
    }
  }

  return false;
};