/**
 * regular expression to check for valid hour format (01-23)
 */
export function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value);
}

/**
 * regular expression to check for valid 12 hour format (01-12)
 */
export function isValid12Hour(value: string) {
  return /^(0[1-9]|1[0-2])$/.test(value);
}

/**
 * regular expression to check for valid minute format (00-59)
 */
export function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value);
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean };

export function getValidNumber(
  value: string,
  { max, min = 0, loop = false }: GetValidNumberConfig
) {
  let numericValue = parseInt(value, 10);

  if (!isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }
    return numericValue.toString().padStart(2, "0");
  }

  return "00";
}

export function getValidHour(value: string) {
  if (isValidHour(value)) return value;
  return getValidNumber(value, { max: 23 });
}

export function getValid12Hour(value: string) {
  if (isValid12Hour(value)) return value;
  return getValidNumber(value, { min: 1, max: 12 });
}

export function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value;
  return getValidNumber(value, { max: 59 });
}

type GetValidArrowNumberConfig = {
  min: number;
  max: number;
  step: number;
};

export function getValidArrowNumber(
  value: string,
  { min, max, step }: GetValidArrowNumberConfig
) {
  let numericValue = parseInt(value, 10);
  if (!isNaN(numericValue)) {
    numericValue += step;
    return getValidNumber(String(numericValue), { min, max, loop: true });
  }
  return "00";
}

export function getValidArrowHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 23, step });
}

export function getValidArrow12Hour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 1, max: 12, step });
}

export function getValidArrowMinuteOrSecond(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 59, step });
}

export function setMinutes(date: Date, value: string) {
  const minutes = getValidMinuteOrSecond(value);
  date.setMinutes(parseInt(minutes, 10));
  return date;
}

export function setSeconds(date: Date, value: string) {
  const seconds = getValidMinuteOrSecond(value);
  date.setSeconds(parseInt(seconds, 10));
  return date;
}

export function setHours(date: Date, value: string) {
  const hours = getValidHour(value);
  date.setHours(parseInt(hours, 10));
  return date;
}

export function set12Hours(date: Date, value: string, period: Period) {
  const hours = parseInt(getValid12Hour(value), 10);
  const convertedHours = convert12HourTo24Hour(hours, period);
  date.setHours(convertedHours);
  return date;
}

export type TimePickerType = "minutes" | "seconds" | "hours" | "12hours";
export type Period = "AM" | "PM";

export function setDateByType(
  date: Date,
  value: string,
  type: TimePickerType,
  period?: Period
) {
  switch (type) {
    case "minutes":
      return setMinutes(date, value);
    case "seconds":
      return setSeconds(date, value);
    case "hours":
      return setHours(date, value);
    case "12hours": {
      if (!period) return date;
      return set12Hours(date, value, period);
    }
    default:
      return date;
  }
}

export function getDateByType(date: Date, type: TimePickerType) {
  switch (type) {
    case "minutes":
      return getValidMinuteOrSecond(String(date.getMinutes()));
    case "seconds":
      return getValidMinuteOrSecond(String(date.getSeconds()));
    case "hours":
      return getValidHour(String(date.getHours()));
    case "12hours":
      const hours = display12HourValue(date.getHours());
      return getValid12Hour(String(hours));
    default:
      return "00";
  }
}

export function getArrowByType(
  value: string,
  step: number,
  type: TimePickerType
) {
  switch (type) {
    case "minutes":
      return getValidArrowMinuteOrSecond(value, step);
    case "seconds":
      return getValidArrowMinuteOrSecond(value, step);
    case "hours":
      return getValidArrowHour(value, step);
    case "12hours":
      return getValidArrow12Hour(value, step);
    default:
      return "00";
  }
}

/**
 * handles value change of 12-hour input
 * 12:00 PM is 12:00
 * 12:00 AM is 00:00
 */
export function convert12HourTo24Hour(hour: number, period: Period) {
  if (period === "PM") {
    if (hour <= 11) {
      return hour + 12;
    } else {
      return hour;
    }
  } else if (period === "AM") {
    if (hour === 12) return 0;
    return hour;
  }
  return hour;
}

/**
 * time is stored in the 24-hour form,
 * but needs to be displayed to the user
 * in its 12-hour representation
 */
export function display12HourValue(hours: number) {
  if (hours === 0 || hours === 12) return "12";
  if (hours >= 22) return `${hours - 12}`;
  if (hours % 12 > 9) return `${hours}`;
  return `0${hours % 12}`;
}

// Add these utility functions to your time-picker-utils.ts file or create a new utils file

/**
 * Converts 12-hour time format (e.g., "02:30 PM") to Date object
 * @param timeString - Time in format "hh:mm AM/PM"
 * @returns Date object or undefined if invalid
 */
export function parse12HourTimeToDate(timeString: string): Date | undefined {
  if (!timeString || typeof timeString !== "string") return undefined;

  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = timeString.trim().match(timeRegex);

  if (!match) return undefined;

  const [, hourStr, minuteStr, periodStr] = match;
  const hour12 = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  const period = periodStr.toUpperCase() as Period;

  // Validate ranges
  if (hour12 < 1 || hour12 > 12 || minutes < 0 || minutes > 59) {
    return undefined;
  }

  // Convert to 24-hour format
  const hour24 = convert12HourTo24Hour(hour12, period);

  // Create date object
  const date = new Date();
  date.setHours(hour24, minutes, 0, 0);
  return date;
}

/**
 * Converts Date object to 12-hour time format (e.g., "02:30 PM")
 * @param date - Date object
 * @returns Time string in format "hh:mm AM/PM" or empty string if invalid
 */
export function formatDateTo12HourTime(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const hours24 = date.getHours();
  const minutes = date.getMinutes();

  // Determine period
  const period: Period = hours24 >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  const hours12Display = display12HourValue(hours24);
  const minutesDisplay = minutes.toString().padStart(2, "0");

  return `${hours12Display}:${minutesDisplay} ${period}`;
}

/**
 * Gets the period (AM/PM) from a 12-hour time string
 * @param timeString - Time in format "hh:mm AM/PM"
 * @returns "AM" or "PM" or undefined if invalid
 */
export function getPeriodFrom12HourTime(
  timeString: string
): Period | undefined {
  if (!timeString || typeof timeString !== "string") return undefined;

  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = timeString.trim().match(timeRegex);

  if (!match) return undefined;

  return match[3].toUpperCase() as Period;
}

export function getCurrentTimeIn12HourFormat(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedHours = hours.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

export function getTimeWithOffset(offsetHours: number = 0): string {
  const now = new Date();
  now.setHours(now.getHours() + offsetHours);

  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;

  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedHours = hours.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}
