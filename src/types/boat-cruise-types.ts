// Boat & Yacht Cruises — business dashboard (docs/BOAT_CRUISES_FRONTEND_INTEGRATION_GUIDE.md).
// Every boat is a private charter priced per hour. Money is whole naira; dates
// YYYY-MM-DD; times HH:mm (24h, Lagos).

export type VesselClass = "BOAT" | "YACHT";
export type BoatStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
export type FuelType = "DIESEL" | "PETROL" | "ELECTRIC" | "HYBRID" | "SAIL";
export type PolicyTemplate = "FLEXIBLE" | "MODERATE" | "STRICT" | "CUSTOM";

export const VESSEL_CLASS_LABELS: Record<VesselClass, string> = { BOAT: "Boat", YACHT: "Yacht" };
export const BOAT_STATUS_LABELS: Record<BoatStatus, string> = { DRAFT: "Draft", PUBLISHED: "Published", UNPUBLISHED: "Unpublished" };
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  DIESEL: "Diesel",
  PETROL: "Petrol",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  SAIL: "Sail",
};
/** 0 = Sunday … 6 = Saturday; shown Monday first */
export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export interface Paged<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface DepartureLocation {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface BoatSpecifications {
  length_ft?: number | null;
  manufacturer?: string | null;
  year_built?: number | null;
  cabins?: number | null;
  bathrooms?: number | null;
  crew_members?: number | null;
  fuel_type?: FuelType | null;
}

export interface DurationRate {
  id?: string;
  label: string;
  duration_minutes: number;
  price: number;
}

export interface PolicyRule {
  timeframe: string;
  cancellationFee?: string;
  refundPercentage?: number;
  min_hours_before?: number;
  fee_percentage?: number;
}

export interface BoatCancellationPolicy {
  id?: string;
  title: string;
  description?: string | null;
  no_show_fee_percentage?: number | null;
  rules?: PolicyRule[];
}

export interface PolicyTemplateOption extends BoatCancellationPolicy {
  template: Exclude<PolicyTemplate, "CUSTOM">;
}

export interface BoatAmenity {
  id: string;
  label: string;
  icon?: string | null;
  is_default?: boolean;
}

export interface BoatType {
  id: string;
  name: string;
  icon?: string | null;
  vessel_class: VesselClass;
  is_default?: boolean;
}

export interface BoatCard {
  id: string;
  name: string;
  image_url?: string | null;
  vessel_class?: VesselClass | null;
  boat_type?: { id: string; name: string } | null;
  /** The list returns the marina name; the detail returns the full location */
  departure_location?: string | DepartureLocation | null;
  city?: string | null;
  capacity?: number | null;
  min_duration_minutes?: number | null;
  price_per_hour?: number | null;
  status: BoatStatus;
  is_active: boolean;
  updated_at?: string;
}

export interface BoatDetail extends Omit<BoatCard, "departure_location"> {
  departure_location?: DepartureLocation | null;
  boat_type_id?: string | null;
  description?: string | null;
  tags?: string[];
  images?: string[];
  specifications?: BoatSpecifications | null;
  amenities?: BoatAmenity[];
  max_duration_minutes?: number | null;
  duration_rates?: DurationRate[];
  extra_hour_rate?: number | null;
  cleaning_fee?: number | null;
  operating_days?: number[];
  operating_start?: string | null;
  operating_end?: string | null;
  available_from?: string | null;
  available_to?: string | null;
  cancellation_policy_template?: PolicyTemplate | null;
  cancellation_policy?: BoatCancellationPolicy | null;
  cancellation_policy_details?: string | null;
  terms_text?: string | null;
  terms_document?: { url: string; file_name?: string; size_bytes?: number; mime_type?: string } | null;
  terms_version?: number;
  published_at?: string | null;
}

/** POST / PATCH body — every field is optional except name on create */
export interface BoatPayload {
  name?: string;
  vessel_class?: VesselClass;
  boat_type_id?: string;
  description?: string;
  tags?: string[];
  departure_location?: DepartureLocation;
  capacity?: number;
  is_active?: boolean;
  images?: string[];
  specifications?: BoatSpecifications;
  amenity_ids?: string[];
  price_per_hour?: number;
  min_duration_minutes?: number;
  duration_rates?: DurationRate[];
  extra_hour_rate?: number | null;
  cleaning_fee?: number | null;
  operating_days?: number[];
  operating_start?: string;
  operating_end?: string;
  available_from?: string | null;
  available_to?: string | null;
  cancellation_policy_template?: PolicyTemplate;
  cancellation_policy_id?: string;
  cancellation_policy_details?: string;
  terms_text?: string;
  publish?: boolean;
}

export interface BoatsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BoatStatus;
  vessel_class?: VesselClass;
  boat_type_id?: string;
  sort?: "newest" | "name" | "price_asc" | "price_desc";
}

// ---------- Bookings ----------
export type BoatBookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "NO_SHOW";
export type BoatBookingSource = "MOBILE" | "DASHBOARD" | "THIRD_PARTY" | "WALK_IN" | "PHONE_CALL" | "WEBSITE" | "OTA";

export const BOAT_BOOKING_STATUS_LABELS: Record<BoatBookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  NO_SHOW: "No-show",
};

export const BOAT_BOOKING_SOURCE_LABELS: Record<BoatBookingSource, string> = {
  MOBILE: "MyPal app",
  DASHBOARD: "Dashboard",
  THIRD_PARTY: "Third party",
  WALK_IN: "Walk-in",
  PHONE_CALL: "Phone call",
  WEBSITE: "Website",
  OTA: "Travel agency",
};

export interface BoatBookingSummary {
  id: string;
  reference: string;
  status: BoatBookingStatus;
  payment_status?: string | null;
  source?: BoatBookingSource | null;
  ota_name?: string | null;
  boat?: { id: string; name: string; image_url?: string | null; boat_type?: string | null; departure_location?: string | null } | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  guests?: { adults?: number; children?: number; total?: number } | null;
  reserver?: { name?: string | null; phone?: string | null; email?: string | null } | null;
  total_amount: number;
  created_at: string;
}

export interface BoatPriceLine {
  code?: string;
  label: string;
  amount: number;
  detail?: string;
}

export interface BoatBookingDetail extends BoatBookingSummary {
  start_at?: string;
  end_at?: string;
  price_breakdown?: {
    lines?: BoatPriceLine[];
    charges?: { type: string; amount: number; percentage?: number }[];
    subtotal?: number;
    total?: number;
    pricing_basis?: string;
  } | null;
  cancellation_policy?: BoatCancellationPolicy | null;
  payment?: { method?: string; reference?: string } | null;
  notes?: string | null;
  terms_version?: number | null;
  terms_accepted_at?: string | null;
  checked_in_at?: string | null;
  completed_at?: string | null;
  cancellation?: { cancelled_at?: string; cancelled_by?: string; reason?: string; refund_amount?: number } | null;
  /** What the guest gets back if the business cancels now (always 100%) */
  business_cancellation_refund?: number | null;
}

export interface BoatBookingsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BoatBookingStatus;
  listing_id?: string;
  source?: BoatBookingSource;
  from?: string;
  to?: string;
  sort?: "start_asc" | "start_desc" | "created_desc";
}

export interface BoatReview {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  listing?: { id: string; name: string } | null;
  boat?: { id: string; name: string } | null;
  user?: { id?: string; name: string } | null;
  business_reply?: string | null;
  replied_at?: string | null;
}

export interface BoatReviewsParams {
  page?: number;
  limit?: number;
  listing_id?: string;
  rating?: number;
  replied?: boolean;
}

// ---------- Availability & Inventory grid ----------
export type GridState = "AVAILABLE" | "LOW" | "SOLD_OUT" | "BLOCKED";

export interface BoatGridCell {
  price?: number | null;
  total: number;
  left: number;
  booked?: number;
  is_blocked: boolean;
  state: GridState;
}

export interface BoatGridRow {
  /** Boat type id */
  id: string;
  name: string;
  type: "Boat";
  section: VesselClass;
  total_capacity: number;
  boats?: { id: string; name: string; is_active: boolean }[];
  cells: Record<string, BoatGridCell>;
}

export interface BoatGrid {
  dates: string[];
  offerings: BoatGridRow[];
}

// ---------- Add Manual Booking ----------
export type ManualSource = "WALK_IN" | "PHONE_CALL" | "WEBSITE" | "OTA";

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  subtitle?: string | null;
  capacity?: number | null;
  price?: number | null;
  price_unit?: string | null;
  operating_hours?: { start: string; end: string } | null;
}

export interface TravelAgency {
  id: string;
  name: string;
  logo_url?: string | null;
  is_default?: boolean;
}

export interface BoatManualBookingPayload {
  entity_type: "Boat";
  entity_id: string;
  source: ManualSource;
  travel_agency_id?: string;
  guest_name: string;
  start_date: string;
  start_time: string;
  end_time: string;
  no_of_guests?: number;
  amount: number;
  notes?: string;
}

// ---------- Business mobile day view (Operations app) ----------
export interface BoatDayItem {
  id: string;
  name: string;
  image_url?: string | null;
  /** e.g. POPULAR, MOST_BOOKED, NEW */
  badge?: string | null;
  boat_type?: string | null;
  vessel_class?: VesselClass | null;
  departure_location?: string | null;
  capacity?: number | null;
  min_duration_minutes?: number | null;
  /** The minimum-duration price */
  price?: { amount: number; duration_minutes: number } | null;
  is_active: boolean;
  available_on_date: boolean;
  unavailable_reason?: string | null;
  bookings_count: number;
}

export interface BoatDayView {
  date: string;
  total_bookings: number;
  items: BoatDayItem[];
}

export interface BoatDayBooking {
  id: string;
  reference: string;
  status: BoatBookingStatus;
  source?: BoatBookingSource | null;
  start_time: string;
  end_time: string;
  reserver_name?: string | null;
  reserver_phone?: string | null;
  guests?: number | null;
  total_amount: number;
}

export interface BoatListingDay {
  id: string;
  name: string;
  date: string;
  is_active: boolean;
  is_blocked: boolean;
  operating_hours?: { start: string; end: string } | null;
  bookings: BoatDayBooking[];
  free_start_times: string[];
}

/** "Boat and Yacht cruises" (API) or "Boat and Yachts cruises" (older enum) */
export const isBoatCruiseBusiness = (category?: string | null) => /boat/i.test(category ?? "") && /yacht/i.test(category ?? "");
