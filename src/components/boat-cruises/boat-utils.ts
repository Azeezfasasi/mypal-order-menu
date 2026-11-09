import {
  Anchor,
  Bath,
  Beer,
  Cake,
  Fish,
  Flame,
  Heart,
  Home,
  Mic,
  Music,
  Sailboat,
  Ship,
  Snowflake,
  Sparkles,
  Sun,
  Sunset,
  User,
  Utensils,
  Waves,
  Wifi,
  BedDouble,
  ChefHat,
  type LucideIcon,
} from "lucide-react";
import type { BoatBookingStatus, BoatCard, DepartureLocation, GridState } from "@/types/boat-cruise-types";

export const formatNaira = (amount?: number | null) =>
  amount === undefined || amount === null ? "—" : `₦${Number(amount).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

/** 120 → "2 Hours", 90 → "1.5 Hours", 30 → "30 Minutes" */
export const formatDuration = (minutes?: number | null) => {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} Minutes`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} Hour${hours === 1 ? "" : "s"}`;
};

/** 30-minute steps from 30 minutes to 12 hours */
export const DURATION_OPTIONS = Array.from({ length: 24 }, (_, i) => (i + 1) * 30);

/** "09:00" → "09:00 AM" */
export const formatTime = (time?: string | null) => {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** Every half hour of the day as HH:mm */
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

export const minutesBetween = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
};

export const locationLabel = (loc?: BoatCard["departure_location"]) => {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  return [loc.name, loc.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ") || loc.address || "";
};

export const fullAddress = (loc?: DepartureLocation | null) =>
  loc ? loc.address || [loc.name, loc.city, loc.state].filter(Boolean).join(", ") : "";

const AMENITY_ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  home: Home,
  snowflake: Snowflake,
  bed: BedDouble,
  cabin: BedDouble,
  music: Music,
  mic: Mic,
  utensils: Utensils,
  "chef-hat": ChefHat,
  chef: ChefHat,
  flame: Flame,
  beer: Beer,
  wine: Beer,
  waves: Waves,
  fish: Fish,
  bath: Bath,
  jacuzzi: Bath,
  sunset: Sunset,
  ship: Ship,
  sailboat: Sailboat,
  anchor: Anchor,
  gift: Cake,
  cake: Cake,
  heart: Heart,
  wifi: Wifi,
  user: User,
  restroom: User,
};

/** Icon for an amenity, from its icon name or label */
export const amenityIcon = (icon?: string | null, label = ""): LucideIcon => {
  const key = (icon ?? "").toLowerCase();
  if (AMENITY_ICONS[key]) return AMENITY_ICONS[key];
  const l = label.toLowerCase();
  if (l.includes("deck") || l.includes("sun")) return Sun;
  if (l.includes("lounge")) return Home;
  if (l.includes("air")) return Snowflake;
  if (l.includes("cabin")) return BedDouble;
  if (l.includes("dj") || l.includes("sound")) return Music;
  if (l.includes("music")) return Mic;
  if (l.includes("chef")) return ChefHat;
  if (l.includes("dining") || l.includes("food")) return Utensils;
  if (l.includes("bbq") || l.includes("grill")) return Flame;
  if (l.includes("bar") || l.includes("drink")) return Beer;
  if (l.includes("jet") || l.includes("swim")) return Waves;
  if (l.includes("fish")) return Fish;
  if (l.includes("jacuzzi")) return Bath;
  if (l.includes("sunset")) return Sunset;
  if (l.includes("island")) return Sailboat;
  if (l.includes("birthday") || l.includes("party")) return Cake;
  if (l.includes("romantic")) return Heart;
  if (l.includes("wi-fi") || l.includes("wifi")) return Wifi;
  if (l.includes("restroom")) return User;
  return Sparkles;
};

export const BOOKING_STATUS_STYLES: Record<BoatBookingStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  CONFIRMED: "border-blue-200 bg-blue-50 text-blue-700",
  CHECKED_IN: "border-violet-200 bg-violet-50 text-violet-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-gray-200 bg-gray-100 text-gray-600",
  EXPIRED: "border-gray-200 bg-gray-50 text-gray-400",
  NO_SHOW: "border-red-200 bg-red-50 text-red-700",
};

export const GRID_STYLES: Record<GridState, string> = {
  AVAILABLE: "bg-[#DDFFE6] text-[#001633]",
  LOW: "bg-[#FFDED3] text-[#001633]",
  SOLD_OUT: "bg-[#FF3033] text-white",
  BLOCKED: "bg-[#EFEFEF] text-[#001633]",
};

/** YYYY-MM-DD as a local date (no timezone shift) */
export const parseDay = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatDay = (value?: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  value ? parseDay(value).toLocaleDateString("en-GB", opts) : "—";

export const formatTimestamp = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const toIsoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Lagos local date-time of a booking's departure / return */
const at = (day: string, time: string) => {
  const [h, m] = time.split(":").map(Number);
  const d = parseDay(day);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

/**
 * Which actions a booking allows right now (the API has no action flags for boats):
 * check-in from 1 hour before departure until return; complete once checked in, or
 * confirmed and ended; no-show after departure; cancel while confirmed.
 */
export const bookingActions = (b: { status: BoatBookingStatus; booking_date: string; start_time: string; end_time: string }, now = Date.now()) => {
  const start = at(b.booking_date, b.start_time);
  let end = at(b.booking_date, b.end_time);
  if (end <= start) end += 24 * 60 * 60 * 1000;
  const confirmed = b.status === "CONFIRMED";
  return {
    checkIn: confirmed && now >= start - 60 * 60 * 1000 && now <= end,
    complete: b.status === "CHECKED_IN" || (confirmed && now >= end),
    noShow: confirmed && now >= start,
    cancel: confirmed && now < start,
  };
};

/** The API error message (safeApiCall keeps the response on the error) */
export const apiMessage = (error: unknown, fallback = "Something went wrong") => {
  const e = error as { message?: string; response?: { data?: { message?: unknown } } };
  const message = e?.response?.data?.message ?? e?.message;
  return Array.isArray(message) ? message.join(". ") : (message as string) || fallback;
};

export const apiStatus = (error: unknown) => (error as { status?: number })?.status;
