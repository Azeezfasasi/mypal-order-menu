// Beach Houses — business dashboard (docs/BEACH_HOUSES_FRONTEND_INTEGRATION_GUIDE.md).
// Money is whole naira; dates YYYY-MM-DD; times HH:mm (24h, Lagos).

export type ListingStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
export type PropertyType = "ENTIRE_PROPERTY" | "INDIVIDUAL_UNITS";
export type StayOption = "DAY_ACCESS" | "OVERNIGHT" | "WEEKLY" | "MONTHLY";
export type ExperiencePriceUnit =
  | "PER_TRIP"
  | "PER_SESSION"
  | "PER_SETUP"
  | "PER_PERSON"
  | "PER_HOUR"
  | "PER_DAY"
  | "PER_BOOKING"
  | "PER_SEAT_HOUR";
export type ExperienceBookingMode = "BOOKABLE" | "INQUIRY";
export type AmenityType = "Amenity" | "Attraction";
export type ExperienceChargeType = "SERVICE CHARGE" | "VAT" | "TOURISM FEE";

export const STAY_OPTION_LABELS: Record<StayOption, string> = {
  DAY_ACCESS: "Day Access",
  OVERNIGHT: "Overnight Stay",
  WEEKLY: "Weekly Stay",
  MONTHLY: "Monthly Stay",
};

export const PRICE_UNIT_LABELS: Record<ExperiencePriceUnit, string> = {
  PER_TRIP: "trip",
  PER_SESSION: "session",
  PER_SETUP: "setup",
  PER_PERSON: "person",
  PER_HOUR: "hour",
  PER_DAY: "day",
  PER_BOOKING: "booking",
  PER_SEAT_HOUR: "seater / hour",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  UNPUBLISHED: "Unpublished",
};

export interface Paged<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ListingLocation {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface ListingSpecifications {
  guestCapacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  pools?: number;
}

export interface ListingCard {
  id: string;
  apartment_name: string;
  image_url?: string | null;
  location?: ListingLocation | null;
  category?: { id: string; name: string } | null;
  property_type?: PropertyType;
  total_units?: number;
  specifications?: ListingSpecifications;
  from_price?: number | null;
  from_price_unit?: string | null;
  package_types?: StayOption[];
  status: ListingStatus;
  branch_id?: string | null;
  updatedAt?: string;
}

export interface DayAccess {
  weekday_price: number;
  weekend_price: number;
  start_time: string;
  end_time: string;
}

export interface DurationDiscount {
  minNights: number;
  percentage: number;
}

export interface HouseRules {
  check_in_time: string;
  check_out_time: string;
  allow_parties?: boolean;
  allow_pets?: boolean;
}

export interface HouseRulesDocument {
  url: string;
  file_name: string;
  mime_type?: string;
  size_bytes?: number;
  version: number;
  uploaded_at?: string;
}

export interface ListingExperience {
  optional_experience_id: string;
  name?: string;
  description?: string;
  icon?: string | null;
  price: number;
  price_unit: ExperiencePriceUnit;
  is_enabled: boolean;
  is_available?: boolean;
}

export interface ListingAmenity {
  id: string;
  label: string;
  icon?: string | null;
  image_url?: string | null;
}

export interface ListingPackage {
  id: string;
  type: StayOption;
  title: string;
  description?: string | null;
  weekday_price?: number | null;
  weekend_price?: number | null;
  from_price?: number;
  unit?: string;
  start_time?: string | null;
  end_time?: string | null;
  is_active?: boolean;
}

export interface ListingDetail extends ListingCard {
  apartment_description?: string | null;
  image_urls?: string[];
  booking_options?: StayOption[];
  price_per_night?: number | null;
  weekend_price_per_night?: number | null;
  day_access?: DayAccess | null;
  weekly_price?: number | null;
  monthly_price?: number | null;
  discounts?: DurationDiscount[];
  cleaning_fee?: number | null;
  security_deposit?: number | null;
  extra_guest_fee?: number | null;
  max_extra_guests?: number | null;
  rules?: HouseRules | null;
  cancellation_policy?: { id: string; title: string } | null;
  house_rules_document?: HouseRulesDocument | null;
  experiences?: ListingExperience[];
  amenities?: ListingAmenity[];
  attractions?: ListingAmenity[];
  packages?: ListingPackage[];
}

export interface ListingPayload {
  apartment_name?: string;
  category_id?: string;
  apartment_description?: string;
  total_units?: number;
  specifications?: ListingSpecifications;
  property_type?: PropertyType;
  booking_options?: StayOption[];
  price_per_night?: number;
  weekend_price_per_night?: number;
  day_access?: DayAccess;
  weekly_price?: number;
  monthly_price?: number;
  discounts?: DurationDiscount[];
  cleaning_fee?: number;
  security_deposit?: number;
  extra_guest_fee?: number;
  max_extra_guests?: number;
  rules?: HouseRules;
  cancellation_policy_id?: string;
  experiences?: Array<Pick<ListingExperience, "optional_experience_id" | "price" | "price_unit" | "is_enabled">>;
  amenities?: { amenity_ids: string[]; attraction_ids: string[] };
  location?: Required<Pick<ListingLocation, "address" | "city" | "state" | "country" | "latitude" | "longitude">>;
  image_urls?: string[];
  publish?: boolean;
}

export interface ListingsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ListingStatus;
  category_id?: string;
  package_type?: StayOption;
  sort?: "newest" | "name" | "price_asc" | "price_desc";
}

export interface Collection {
  id: string;
  name: string;
  subtitle?: string;
  listing_count?: number;
}

export interface Amenity {
  id: string;
  source: "DEFAULT" | "CUSTOM";
  label: string;
  icon?: string | null;
  image_url?: string | null;
  group?: string | null;
  selected: boolean;
}

export interface ExperienceCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  is_default: boolean;
  sort_order: number;
  item_count: number;
}

export interface OptionalExperience {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  image_url?: string | null;
  location_label?: string | null;
  category?: { id: string; name: string; icon?: string | null; color?: string | null } | null;
  price: number;
  price_unit: ExperiencePriceUnit;
  min_guests?: number | null;
  max_guests?: number | null;
  duration_minutes?: number | null;
  booking_mode: ExperienceBookingMode;
  whatsapp_number?: string | null;
  is_available: boolean;
  rating?: number | null;
  rating_count?: number;
  /** Detail only: the accommodations offering it, with their per-listing price */
  linked_listings?: Array<{ id: string; name?: string; price?: number; price_unit?: ExperiencePriceUnit; is_enabled?: boolean }>;
}

export interface ExperiencePayload {
  name: string;
  category_id: string;
  description?: string;
  icon?: string;
  image_url?: string;
  location_label?: string;
  price: number;
  price_unit: ExperiencePriceUnit;
  min_guests?: number;
  max_guests?: number;
  duration_minutes?: number;
  booking_mode?: ExperienceBookingMode;
  whatsapp_number?: string;
  is_available?: boolean;
  listing_ids?: string[];
}

export interface ExperiencesParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  is_available?: boolean;
  sort?: "newest" | "name" | "price_asc" | "price_desc";
}

export interface ExperienceCharge {
  id: string | null;
  type: ExperienceChargeType;
  percentage: number;
  isActive: boolean;
}

export interface CancellationRule {
  min_hours_before: number;
  fee_percentage: number;
  timeframe?: string;
  cancellationFee?: string;
}

export interface CancellationPolicy {
  id: string;
  title: string;
  description?: string | null;
  no_show_fee_percentage?: number;
  rules: CancellationRule[];
}

export interface CancellationPolicyPayload {
  title: string;
  description?: string;
  no_show_fee_percentage: number;
  rules: Array<Pick<CancellationRule, "min_hours_before" | "fee_percentage">>;
}

// ---------- Bookings (guide §6) ----------
export type BookingStatus = "Pending" | "Confirmed" | "CheckedIn" | "Completed" | "Cancelled" | "NoShow" | "Expired";
export type DepositStatus = "HELD" | "REFUNDED" | "PARTIALLY_REFUNDED" | "FORFEITED";
export type BookingSource = "MOBILE" | "WALK_IN" | "PHONE_CALL" | "THIRD_PARTY";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  Pending: "Pending",
  Confirmed: "Confirmed",
  CheckedIn: "Checked in",
  Completed: "Completed",
  Cancelled: "Cancelled",
  NoShow: "No-show",
  Expired: "Expired",
};

export const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
  HELD: "Held",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
  FORFEITED: "Forfeited",
};

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  MOBILE: "MyPal app",
  WALK_IN: "Walk-in",
  PHONE_CALL: "Phone call",
  THIRD_PARTY: "Third party",
};

export interface BookingGuest {
  id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
}

export interface BookingActions {
  check_in: boolean;
  complete: boolean;
  no_show: boolean;
  cancel: boolean;
  claim_deposit: boolean;
  release_deposit: boolean;
}

export interface BookingSummary {
  id: string;
  reservation_id: string;
  status: BookingStatus;
  listing?: { id: string; name: string; image_url?: string | null; area?: string | null } | null;
  package_type: StayOption;
  package_title?: string;
  check_in_date: string;
  check_out_date: string;
  start_time?: string | null;
  end_time?: string | null;
  guests: { adults: number; children: number; infants: number };
  total: number;
  deposit_status?: DepositStatus | null;
  guest?: BookingGuest | null;
  source?: BookingSource;
  experiences_count?: number;
  created_at: string;
  /** Present on listing-day results */
  actions?: BookingActions;
}

export interface PriceLine {
  code?: string;
  label: string;
  amount: number;
}

export interface PriceCharge {
  type: string;
  amount: number;
  percentage?: number;
}

export interface PriceSection {
  lines: PriceLine[];
  total: number;
  charges?: PriceCharge[];
  discounts?: Array<{ label?: string; amount: number; percentage?: number }>;
}

export interface PriceBreakdown {
  stay?: PriceSection;
  experiences?: PriceSection;
  security_deposit?: { amount: number; refundable?: boolean };
  total: number;
  package?: { title?: string; nights?: number; units?: number; unit_price?: number };
  deposit_claim_evidence?: string[];
}

export interface BookingDetail extends BookingSummary {
  price_breakdown?: PriceBreakdown;
  experiences?: Array<{
    optional_experience_id?: string;
    name: string;
    quantity?: number;
    price_unit?: ExperiencePriceUnit;
    total?: number;
    scheduled_date?: string | null;
  }>;
  security_deposit?: {
    amount: number;
    status?: DepositStatus | null;
    claim_amount?: number | null;
    claim_reason?: string | null;
    settled_at?: string | null;
  } | null;
  house_rules_version?: number | null;
  terms_accepted_at?: string | null;
  checked_in_at?: string | null;
  completed_at?: string | null;
  cancellation?: { cancelled_at?: string; cancelled_by?: string; reason?: string; refund_amount?: number } | null;
  notes?: string | null;
  payment?: { reference?: string } | null;
  actions: BookingActions;
}

export interface BookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  package_type?: StayOption;
  listing_id?: string;
  from?: string;
  to?: string;
  search?: string;
  sort?: "check_in_asc" | "check_in_desc" | "created_desc";
}

export interface ManualBookingPayload {
  stay_package_id: string;
  check_in_date: string;
  check_out_date?: string;
  no_of_adults: number;
  no_of_children: number;
  no_of_infants?: number;
  experiences?: Array<{ optional_experience_id: string; quantity?: number; scheduled_date?: string }>;
  guest_name: string;
  guest_phone?: string;
  guest_email?: string;
  source: Exclude<BookingSource, "MOBILE">;
  payment_received?: boolean;
  notes?: string;
}

export interface CalendarDay {
  date: string;
  is_blocked: boolean;
  day_access_available: boolean;
  overnight_available: boolean;
  bookings: number;
}

export interface ListingCalendar {
  listing: { id: string; name: string };
  month: string;
  days: CalendarDay[];
}

export interface ListingDay {
  listing: { id: string; name: string; status?: ListingStatus };
  date: string;
  is_blocked: boolean;
  day_access_available: boolean;
  overnight_available: boolean;
  bookings: BookingSummary[];
}

export interface ScheduledExperience {
  date: string;
  date_is_flexible: boolean;
  experience: { id: string; name: string };
  quantity: number;
  price_unit: ExperiencePriceUnit;
  total: number;
  booking: { id: string; reservation_id: string; status: BookingStatus; guest?: BookingGuest | null; listing?: { id: string; name: string } | null };
}

export interface ListingReview {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  listing?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  business_reply?: string | null;
  replied_at?: string | null;
}

// ---------- Business mobile "Edit by day" (B5) ----------
export interface DayViewItem {
  id: string;
  name: string;
  image_url?: string | null;
  /** e.g. MOST_BOOKED, NEW */
  badge?: string | null;
  guest_capacity?: number | null;
  bedrooms?: number | null;
  highlights?: string[];
  price?: { amount: number; package_type: StayOption; unit?: string | null } | null;
  /** False when the day is blocked */
  is_available: boolean;
  bookings_on_date: number;
  status: ListingStatus;
}

export interface DayView {
  date: string;
  total_units: number;
  items: DayViewItem[];
}

export interface DayViewParams {
  date: string;
  package_type?: StayOption;
  search?: string;
}
