import { BusinessCategoryType } from "@/types/enums";

// ====== Enums (from the Swagger DTOs) ======
export type MobilityCategory = "IN_CITY" | "LUXURY_RENTALS" | "HOUSEHOLD_LOGISTICS";
export type MobilityTripType = "ONE_WAY" | "ROUND_TRIP" | "CHARTER";
export type MobilityBookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED";
export type MobilityBookingSource = "MYPAL_APP" | "WALK_IN" | "PHONE_CALL" | "WEBSITE" | "OTA";
export type MobilityCharterPreset = "HOURS_24" | "ONE_WEEK" | "TWO_WEEKS" | "CUSTOM";
export type VehicleFeature = "AC" | "CHAUFFEUR" | "PREMIUM_INTERIOR" | "GPS" | "MUSIC_SYSTEM";

export const MOBILITY_CATEGORIES: { id: MobilityCategory; label: string; title: string }[] = [
  { id: "IN_CITY", label: "In-City Rides", title: "In-City Rides" },
  { id: "LUXURY_RENTALS", label: "Luxury Rentals", title: "Luxury Rentals" },
  { id: "HOUSEHOLD_LOGISTICS", label: "Logistics", title: "Household Logistics" },
];

/** The business categories that run the mobility dashboard, and their API category */
export const MOBILITY_BUSINESS_CATEGORIES: Partial<Record<string, MobilityCategory>> = {
  [BusinessCategoryType.INCITYRIDES]: "IN_CITY",
  [BusinessCategoryType.LUXURYONDEMAND]: "LUXURY_RENTALS",
  [BusinessCategoryType.HOUSEHOLDLOGISTICS]: "HOUSEHOLD_LOGISTICS",
};

export const isMobilityBusiness = (businessType?: string | null) =>
  Boolean(businessType && MOBILITY_BUSINESS_CATEGORIES[businessType]);

export const TRIP_TYPE_LABELS: Record<MobilityTripType, string> = {
  ONE_WAY: "One-Way",
  ROUND_TRIP: "Round Trip",
  CHARTER: "Charter",
};

export const BOOKING_STATUS_LABELS: Record<MobilityBookingStatus, string> = {
  PENDING_PAYMENT: "Pending",
  CONFIRMED: "Active",
  IN_TRANSIT: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const BOOKING_SOURCE_LABELS: Record<MobilityBookingSource, string> = {
  WALK_IN: "Walk-in",
  PHONE_CALL: "Phone call",
  WEBSITE: "Website",
  MYPAL_APP: "MyPal app",
  OTA: "Online travel agency",
};

export const VEHICLE_FEATURE_LABELS: Record<VehicleFeature, string> = {
  AC: "Air Conditioning",
  CHAUFFEUR: "Chauffeur",
  PREMIUM_INTERIOR: "Premium Interior",
  GPS: "GPS",
  MUSIC_SYSTEM: "Music System",
};

export const CHARTER_PRESET_LABELS: Record<MobilityCharterPreset, string> = {
  HOURS_24: "24 hours",
  ONE_WEEK: "1 week",
  TWO_WEEKS: "2 weeks",
  CUSTOM: "Custom",
};

// ====== Models (normalized from the API) ======
export interface MobilityLocation {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface MobilityVehicle {
  id: string;
  make: string;
  model: string;
  vehicle_class: string;
  company_name?: string;
  plate_number: string;
  category?: MobilityCategory;
  seat_count?: number;
  features: VehicleFeature[];
  gallery_images: string[];
  total_units: number;
  available_units: number;
  out_of_service_units: number;
  booked_units?: number;
  /** Naira (converted from base_price_kobo) */
  base_price: number;
  discount_percentage?: number;
  description?: string;
  is_active: boolean;
  out_of_service_reason?: string;
  add_ons: MobilityVehicleAddOn[];
}

export interface MobilityVehicleAddOn {
  id: string;
  name: string;
  description?: string;
  /** Naira per day */
  price_per_day: number;
  is_included: boolean;
}

export interface MobilityDriver {
  id: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  rating?: number;
  total_trips?: number;
}

export interface MobilityBookingAddOn {
  id?: string;
  name: string;
  /** Naira */
  amount?: number;
  days?: number;
  included?: boolean;
}

export interface MobilityBooking {
  id: string;
  reference: string;
  trip_type?: MobilityTripType;
  service_category?: MobilityCategory;
  status: MobilityBookingStatus;
  source?: MobilityBookingSource;
  ota_name?: string;
  rider_name: string;
  rider_phone?: string;
  rider_email?: string;
  vehicle?: MobilityVehicle;
  driver?: MobilityDriver;
  pickup_location?: MobilityLocation;
  dropoff_location?: MobilityLocation;
  return_location?: MobilityLocation;
  pickup_date?: string;
  pickup_time?: string;
  return_time?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  duration_label?: string;
  /** Naira */
  amount: number;
  base_fare?: number;
  vat?: number;
  discount?: number;
  add_ons: MobilityBookingAddOn[];
  notes?: string;
  cancellation_reason?: string;
  created_at?: string;
}

export interface MobilityStats {
  total_rides: number;
  active_bookings: number;
  ongoing_rides: number;
  completed_rides: number;
}

export interface MobilityInventoryMetrics {
  total_vehicles: number;
  available_now: number;
  booked: number;
  out_of_service: number;
  pending_assignment: number;
}

export interface MobilityInventory {
  metrics: MobilityInventoryMetrics;
  vehicles: MobilityVehicle[];
  total: number;
  page: number;
  limit: number;
}

export interface MobilityFare {
  /** All Naira */
  base_fare: number;
  add_ons: number;
  discount: number;
  vat: number;
  total: number;
}

export interface MobilityList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ====== Params & payloads ======
export interface MobilityBookingParams {
  category?: MobilityCategory;
  trip_type?: MobilityTripType;
  status?: MobilityBookingStatus;
  search?: string;
  /** DD-MM-YYYY */
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface MobilityVehicleParams {
  category?: MobilityCategory;
  trip_type?: MobilityTripType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MobilityInventoryParams {
  category?: MobilityCategory;
  /** today | 3-day | weekly | YYYY-MM-DD */
  period?: string;
  page?: number;
  limit?: number;
}

export interface VehiclePayload {
  make: string;
  model: string;
  vehicle_class: string;
  company_name?: string;
  plate_number: string;
  category: MobilityCategory;
  seat_count: number;
  features?: VehicleFeature[];
  gallery_images?: string[];
  total_units: number;
  available_units: number;
  out_of_service_units?: number;
  base_price_kobo: number;
  discount_percentage?: number;
  description?: string;
  is_active?: boolean;
}

export interface VehicleAvailabilityPayload {
  total_units?: number;
  available_units?: number;
  out_of_service_units?: number;
  out_of_service_reason?: string;
  is_active?: boolean;
  base_price_kobo?: number;
}

export interface LocationPayload {
  address: string;
  city: string;
  state: string;
  country: string;
  // The API validates these as strings (Swagger documents numbers)
  latitude: string;
  longitude: string;
}

export interface BookingAddOnPayload {
  vehicle_add_on_id: string;
  days?: number;
}

export interface CreateMobilityBookingPayload {
  business_id: string;
  vehicle_id?: string;
  trip_type: MobilityTripType;
  service_category: MobilityCategory;
  source?: MobilityBookingSource;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  ota_name?: string;
  pickup_date?: string;
  pickup_time?: string;
  return_time?: string;
  duration_hours?: number;
  charter_duration_preset?: MobilityCharterPreset;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  pickup_location: LocationPayload;
  dropoff_location?: LocationPayload;
  selected_add_ons?: BookingAddOnPayload[];
  notes?: string;
}

export interface CalculateFarePayload {
  vehicle_id: string;
  trip_type: MobilityTripType;
  charter_duration_preset?: MobilityCharterPreset;
  selected_add_ons?: BookingAddOnPayload[];
}

export interface UpdateBookingStatusPayload {
  status?: MobilityBookingStatus;
  cancellation_reason?: string;
  notes?: string;
}

export interface DriverPayload {
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
}
