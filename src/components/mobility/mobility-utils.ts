import { addDays, format, isValid, parse, parseISO } from "date-fns";
import type { MobilityAddress } from "./LocationField";
import type {
  LocationPayload,
  MobilityBooking,
  MobilityBookingStatus,
  MobilityTripType,
  MobilityVehicle,
} from "@/types/mobility-types";

export const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

/** The mobility API takes dates as DD-MM-YYYY */
export const toApiDate = (date: Date) => format(date, "dd-MM-yyyy");

/** ...and times as "hh:mm AM" */
export const toApiTime = (date: Date) => format(date, "hh:mm a");

/** Accepts DD-MM-YYYY (the API's request format) or ISO */
export const parseApiDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const ddmmyyyy = parse(value, "dd-MM-yyyy", new Date());
  if (isValid(ddmmyyyy)) return ddmmyyyy;
  const iso = parseISO(value);
  return isValid(iso) ? iso : undefined;
};

export const formatDate = (value?: string, pattern = "MMM d, yyyy") => {
  const date = parseApiDate(value);
  return date ? format(date, pattern) : value ?? "—";
};

export type Period = "today" | "3-day" | "weekly" | "custom" | "all";

export const PERIOD_LABELS: Record<Exclude<Period, "all">, string> = {
  today: "Today",
  "3-day": "3-day",
  weekly: "Weekly",
  custom: "Custom",
};

/** Today, the next 3 days or the next 7 days, starting today */
export const getPeriodRange = (period: Period): { from: Date; to: Date } | undefined => {
  const today = new Date();
  if (period === "today") return { from: today, to: today };
  if (period === "3-day") return { from: today, to: addDays(today, 2) };
  if (period === "weekly") return { from: today, to: addDays(today, 6) };
  return undefined;
};

export const STATUS_STYLES: Record<MobilityBookingStatus, string> = {
  CONFIRMED: "bg-green-50 text-green-700",
  PENDING_PAYMENT: "bg-orange-50 text-orange-600",
  IN_TRANSIT: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-600",
};

export const TRIP_TYPE_STYLES: Record<MobilityTripType, string> = {
  ONE_WAY: "bg-red-50 text-red-600",
  ROUND_TRIP: "bg-amber-100 text-amber-700",
  CHARTER: "bg-blue-50 text-blue-700",
};

/** Next status the business can move a booking to (per the status endpoint's transitions) */
export const NEXT_STATUS: Partial<
  Record<MobilityBookingStatus, { status: MobilityBookingStatus; label: string }>
> = {
  PENDING_PAYMENT: { status: "CONFIRMED", label: "Confirm booking" },
  CONFIRMED: { status: "IN_TRANSIT", label: "Start trip" },
  IN_TRANSIT: { status: "COMPLETED", label: "Mark as completed" },
};

export const canCancel = (status: MobilityBookingStatus) =>
  status !== "COMPLETED" && status !== "CANCELLED";

/** Date shown in lists: the pickup date, or the charter's start date */
export const bookingDate = (booking: MobilityBooking) =>
  booking.pickup_date ?? booking.start_date ?? booking.created_at;

/** "10:00 PM – 4:00 AM", the charter window, or just the pickup time */
export const bookingTime = (booking: MobilityBooking) => {
  if (booking.trip_type === "CHARTER" && booking.start_time) {
    return [booking.start_time, booking.end_time].filter(Boolean).join(" – ");
  }
  return [booking.pickup_time, booking.return_time].filter(Boolean).join(" – ") || "—";
};

export const vehicleName = (vehicle?: { make: string; model: string; vehicle_class?: string }) =>
  vehicle ? [vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.vehicle_class || "Vehicle" : "—";

/** Units neither available nor out of service are booked */
export const bookedUnits = (v: MobilityVehicle) =>
  v.booked_units ?? Math.max(0, v.total_units - v.available_units - v.out_of_service_units);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** The address picker's result in the shape the booking API expects */
export const toLocationPayload = (address: MobilityAddress): LocationPayload => ({
  address: address.formatted_address,
  city: address.city,
  state: address.state,
  country: address.country,
  latitude: String(address.lat ?? 0),
  longitude: String(address.long ?? 0),
});
