import type { BookingStatus, BookingSummary, DepositStatus } from "@/types/beach-house-types";

export const STATUS_STYLES: Record<BookingStatus, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  CheckedIn: "border-violet-200 bg-violet-50 text-violet-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-gray-200 bg-gray-100 text-gray-600",
  NoShow: "border-red-200 bg-red-50 text-red-700",
  Expired: "border-gray-200 bg-gray-50 text-gray-400",
};

export const DEPOSIT_STYLES: Record<DepositStatus, string> = {
  HELD: "text-amber-700",
  REFUNDED: "text-emerald-700",
  PARTIALLY_REFUNDED: "text-blue-700",
  FORFEITED: "text-red-700",
};

/** YYYY-MM-DD read as a local date (no timezone shift) */
export const parseDay = (value?: string | null) => {
  if (!value) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

export const formatDay = (value?: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => {
  const date = parseDay(value);
  return date ? date.toLocaleDateString("en-GB", opts) : "—";
};

export const formatTimestamp = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/** "6 Nov 2026" for a day stay, "6 – 8 Nov 2026" across days */
export const stayDates = (b: Pick<BookingSummary, "check_in_date" | "check_out_date">) =>
  !b.check_out_date || b.check_out_date === b.check_in_date
    ? formatDay(b.check_in_date)
    : `${formatDay(b.check_in_date, { day: "numeric", month: "short" })} – ${formatDay(b.check_out_date)}`;

export const guestsSummary = (g?: BookingSummary["guests"]) => {
  if (!g) return "—";
  const parts = [`${g.adults} adult${g.adults === 1 ? "" : "s"}`];
  if (g.children) parts.push(`${g.children} child${g.children === 1 ? "" : "ren"}`);
  if (g.infants) parts.push(`${g.infants} infant${g.infants === 1 ? "" : "s"}`);
  return parts.join(", ");
};

export const toIsoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** The API error message (safeApiCall keeps the response on the error) */
export const apiMessage = (error: unknown, fallback = "Something went wrong") => {
  const e = error as { message?: string; status?: number; response?: { data?: { message?: unknown } } };
  const message = e?.response?.data?.message ?? e?.message;
  return Array.isArray(message) ? message.join(". ") : (message as string) || fallback;
};

export const apiStatus = (error: unknown) => (error as { status?: number })?.status;
