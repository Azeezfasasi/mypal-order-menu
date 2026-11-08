import {
  ChefHat,
  Car,
  Flame,
  Snowflake,
  Sparkles,
  Tv,
  Umbrella,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { PRICE_UNIT_LABELS, type BookingStatus, type BookingSummary, type ExperiencePriceUnit } from "@/types/beach-house-types";

export const formatNaira = (amount?: number | null) =>
  amount === undefined || amount === null ? "—" : `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export const priceUnitLabel = (unit?: ExperiencePriceUnit | null) => (unit ? PRICE_UNIT_LABELS[unit] ?? unit : "");

/** Best-matching icon for an amenity label such as "Private Pool" or "Free WiFi" */
export const highlightIcon = (label: string): LucideIcon => {
  const l = label.toLowerCase();
  if (l.includes("pool") || l.includes("ocean") || l.includes("lagoon")) return Waves;
  if (l.includes("beach")) return Umbrella;
  if (l.includes("wifi") || l.includes("wi-fi") || l.includes("internet")) return Wifi;
  if (l.includes("kitchen") || l.includes("chef")) return ChefHat;
  if (l.includes("tv")) return Tv;
  if (l.includes("air") || l.includes("ac")) return Snowflake;
  if (l.includes("bbq") || l.includes("grill")) return Flame;
  if (l.includes("parking")) return Car;
  return Sparkles;
};

const BADGES: Record<string, { label: string; className: string }> = {
  MOST_BOOKED: { label: "Most Booked", className: "bg-orange-600" },
  NEW: { label: "New", className: "bg-blue-600" },
  PREMIUM: { label: "Premium", className: "bg-violet-600" },
};

/** Card badge for the API's badge code; unknown codes are shown title-cased ("20% Off" stays as is) */
export const badgeFor = (badge?: string | null) => {
  if (!badge) return null;
  if (BADGES[badge]) return BADGES[badge];
  const label = /[a-z%]/.test(badge)
    ? badge
    : badge
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  return { label, className: /off|%|discount/i.test(badge) ? "bg-blue-700" : "bg-gray-800" };
};

export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Confirmed: "bg-blue-50 text-blue-700",
  CheckedIn: "bg-violet-50 text-violet-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-gray-100 text-gray-600",
  NoShow: "bg-red-50 text-red-700",
  Expired: "bg-gray-50 text-gray-400",
};

/** YYYY-MM-DD as a local date, so the day doesn't shift with the timezone */
const parseDay = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

const short = (value: string) => parseDay(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const stayDates = (b: Pick<BookingSummary, "check_in_date" | "check_out_date">) =>
  !b.check_out_date || b.check_out_date === b.check_in_date ? short(b.check_in_date) : `${short(b.check_in_date)} – ${short(b.check_out_date)}`;

export const guestsSummary = (g?: BookingSummary["guests"]) => {
  if (!g) return "";
  const parts = [`${g.adults} adult${g.adults === 1 ? "" : "s"}`];
  if (g.children) parts.push(`${g.children} child${g.children === 1 ? "" : "ren"}`);
  if (g.infants) parts.push(`${g.infants} infant${g.infants === 1 ? "" : "s"}`);
  return parts.join(", ");
};

/** The API error message (safeApiCall keeps the response on the error) */
export const apiMessage = (error: unknown, fallback = "Something went wrong") => {
  const e = error as { message?: string; response?: { data?: { message?: unknown } } };
  const message = e?.response?.data?.message ?? e?.message;
  return Array.isArray(message) ? message.join(". ") : (message as string) || fallback;
};
