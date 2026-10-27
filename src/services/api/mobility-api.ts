import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import type {
  CalculateFarePayload,
  CreateMobilityBookingPayload,
  DriverPayload,
  MobilityBooking,
  MobilityBookingAddOn,
  MobilityBookingParams,
  MobilityBookingSource,
  MobilityBookingStatus,
  MobilityCategory,
  MobilityDriver,
  MobilityFare,
  MobilityInventory,
  MobilityInventoryParams,
  MobilityList,
  MobilityLocation,
  MobilityStats,
  MobilityTripType,
  MobilityVehicle,
  MobilityVehicleParams,
  UpdateBookingStatusPayload,
  VehicleAvailabilityPayload,
  VehicleFeature,
  VehiclePayload,
} from "@/types/mobility-types";
import { MOBILITY_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

type RawRecord = Record<string, unknown>;

/** Decimal and kobo columns come back as strings (e.g. "850000") */
const toNumber = (value: unknown): number => {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const removeEmptyParams = (params: object) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

// Swagger documents the request DTOs but every response as `data: null`, so the
// normalizers below accept snake_case or camelCase keys, kobo or naira amounts,
// and the usual list wrappers.

const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** First defined value among the keys, checking each key's camelCase form too */
const get = (raw: RawRecord | undefined, ...keys: string[]): unknown => {
  if (!raw) return undefined;
  for (const key of keys) {
    const value = raw[key] ?? raw[camel(key)];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const asRecord = (value: unknown): RawRecord | undefined =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : undefined;

const str = (value: unknown): string | undefined =>
  typeof value === "string" || typeof value === "number" ? String(value) : undefined;

const optNumber = (value: unknown): number | undefined =>
  value === undefined || value === null || value === "" ? undefined : toNumber(value);

/** Naira amount from `<base>_kobo` (preferred) or a plain naira `<base>` field */
const money = (raw: RawRecord | undefined, ...bases: string[]): number | undefined => {
  for (const base of bases) {
    const kobo = get(raw, `${base}_kobo`);
    if (kobo !== undefined) return toNumber(kobo) / 100;
  }
  for (const base of bases) {
    const naira = get(raw, base);
    if (naira !== undefined && typeof naira !== "object") return toNumber(naira);
  }
  return undefined;
};

export const toKobo = (naira: number) => Math.round(naira * 100);

const DEFAULT_PAGE_SIZE = 20;

/**
 * The bookings/inventory/vehicles endpoints reject `page` and `limit` sent as
 * query strings ("page must be an integer number"), so the defaults are left
 * out and only other pages are requested explicitly.
 */
const pageParams = (page: number, limit: number) => ({
  page: page === 1 ? undefined : page,
  limit: limit === DEFAULT_PAGE_SIZE ? undefined : limit,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message.join("\n");
  return typeof message === "string" && message ? message : fallback;
};

// ====== Normalizers ======
const normalizeLocation = (value: unknown, fallbackAddress?: unknown): MobilityLocation | undefined => {
  if (typeof value === "string" && value) return { address: value };
  const raw = asRecord(value);
  const address = str(get(raw, "address", "formatted_address", "name")) ?? str(fallbackAddress);
  if (!address) return undefined;
  return {
    address,
    city: str(get(raw, "city")),
    state: str(get(raw, "state")),
    country: str(get(raw, "country")),
    latitude: optNumber(get(raw, "latitude", "lat")),
    longitude: optNumber(get(raw, "longitude", "lng", "long")),
  };
};

const CATEGORY_IDS: MobilityCategory[] = ["IN_CITY", "LUXURY_RENTALS", "HOUSEHOLD_LOGISTICS"];
const TRIP_TYPES: MobilityTripType[] = ["ONE_WAY", "ROUND_TRIP", "CHARTER"];

const enumValue = <T extends string>(value: unknown, allowed: T[]): T | undefined => {
  const normalized = str(value)?.toUpperCase().replace(/[\s-]+/g, "_");
  return allowed.find((v) => v === normalized);
};

const normalizeStatus = (value: unknown): MobilityBookingStatus => {
  const status = str(value)?.toUpperCase().replace(/[\s-]+/g, "_") ?? "";
  if (["CONFIRMED", "ACTIVE"].includes(status)) return "CONFIRMED";
  if (["IN_TRANSIT", "ONGOING", "IN_PROGRESS"].includes(status)) return "IN_TRANSIT";
  if (status === "COMPLETED") return "COMPLETED";
  if (["CANCELLED", "CANCELED"].includes(status)) return "CANCELLED";
  return "PENDING_PAYMENT";
};

export const normalizeVehicle = (raw: RawRecord): MobilityVehicle => {
  // Inventory rows may wrap the vehicle as `vehicle` alongside the unit counts
  const vehicle = asRecord(raw.vehicle) ?? raw;
  const images = get(vehicle, "gallery_images", "images", "image_urls");
  const features = get(vehicle, "features");
  return {
    id: String(get(vehicle, "id") ?? get(raw, "vehicle_id", "id") ?? ""),
    make: str(get(vehicle, "make")) ?? "",
    model: str(get(vehicle, "model")) ?? "",
    vehicle_class: str(get(vehicle, "vehicle_class", "class")) ?? "",
    company_name: str(get(vehicle, "company_name")),
    plate_number: str(get(vehicle, "plate_number", "plate")) ?? "",
    category: enumValue(get(vehicle, "category", "service_category"), CATEGORY_IDS),
    seat_count: optNumber(get(vehicle, "seat_count", "seats")),
    features: Array.isArray(features) ? (features as VehicleFeature[]) : [],
    gallery_images: Array.isArray(images)
      ? images.filter((url): url is string => typeof url === "string")
      : [],
    total_units: toNumber(get(raw, "total_units") ?? get(vehicle, "total_units")),
    available_units: toNumber(get(raw, "available_units", "available") ?? get(vehicle, "available_units")),
    out_of_service_units: toNumber(
      get(raw, "out_of_service_units", "unavailable_units", "unavailable") ??
        get(vehicle, "out_of_service_units")
    ),
    booked_units: optNumber(get(raw, "booked_units", "booked", "in_use_units")),
    base_price: money(raw, "base_price", "price") ?? money(vehicle, "base_price", "price") ?? 0,
    discount_percentage: optNumber(get(vehicle, "discount_percentage")),
    description: str(get(vehicle, "description")),
    is_active: (get(vehicle, "is_active") ?? true) !== false,
    out_of_service_reason: str(get(raw, "out_of_service_reason") ?? get(vehicle, "out_of_service_reason")),
    add_ons: Array.isArray(vehicle.add_ons)
      ? (vehicle.add_ons as RawRecord[])
          .filter((addOn) => addOn.is_active !== false)
          .map((addOn) => ({
            id: String(addOn.id ?? ""),
            name: str(addOn.name) ?? "Add-on",
            description: str(addOn.description),
            price_per_day: money(addOn, "price_per_day", "price") ?? 0,
            is_included: addOn.is_included === true,
          }))
      : [],
  };
};

export const normalizeDriver = (raw: RawRecord): MobilityDriver => {
  const first = str(get(raw, "first_name"));
  const last = str(get(raw, "last_name"));
  return {
    id: String(get(raw, "id") ?? ""),
    full_name:
      str(get(raw, "full_name", "name")) ?? ([first, last].filter(Boolean).join(" ") || "Unnamed driver"),
    phone_number: str(get(raw, "phone_number", "phone")),
    avatar_url: str(get(raw, "avatar_url", "avatar", "profile_image")),
    rating: optNumber(get(raw, "rating")),
    total_trips: optNumber(get(raw, "total_trips", "trips")),
  };
};

const normalizeAddOn = (raw: RawRecord): MobilityBookingAddOn => {
  const nested = asRecord(get(raw, "vehicle_add_on", "add_on", "addon"));
  return {
    id: str(get(raw, "vehicle_add_on_id", "id")),
    name: str(get(raw, "name", "title") ?? get(nested, "name", "title")) ?? "Add-on",
    amount:
      money(raw, "total", "amount", "price", "price_per_day", "daily_rate") ??
      money(nested, "price_per_day", "price", "amount", "daily_rate"),
    days: optNumber(get(raw, "days")),
    included: (get(raw, "included", "is_included") ?? get(nested, "is_included")) === true,
  };
};

const personName = (raw: RawRecord | undefined) => {
  if (!raw) return undefined;
  const full = str(get(raw, "full_name", "name"));
  if (full) return full;
  const name = [str(get(raw, "first_name", "firstname")), str(get(raw, "last_name", "lastname"))]
    .filter(Boolean)
    .join(" ");
  return name || undefined;
};

export const normalizeBooking = (raw: RawRecord): MobilityBooking => {
  const user = asRecord(get(raw, "user", "customer", "rider"));
  const vehicle = asRecord(raw.vehicle);
  const driver = asRecord(get(raw, "driver", "assigned_driver", "chauffeur"));
  const addOns = get(raw, "selected_add_ons", "add_ons", "addons", "booking_add_ons");
  const fare = asRecord(get(raw, "fare_breakdown", "breakdown", "fare")) ?? raw;
  const id = String(get(raw, "id") ?? "");

  return {
    id,
    reference:
      str(get(raw, "booking_ref", "booking_reference", "reference", "ref", "booking_code")) ??
      id.slice(0, 8).toUpperCase(),
    trip_type: enumValue(get(raw, "trip_type"), TRIP_TYPES),
    service_category: enumValue(get(raw, "service_category", "category"), CATEGORY_IDS),
    status: normalizeStatus(get(raw, "status")),
    source: str(get(raw, "source")) as MobilityBookingSource | undefined,
    ota_name: str(get(raw, "ota_name")),
    rider_name:
      str(get(raw, "guest_name", "rider_name", "customer_name")) ?? personName(user) ?? "Guest",
    rider_phone:
      str(get(raw, "guest_phone", "rider_phone", "customer_phone")) ??
      str(get(user, "phone_number", "phone")),
    rider_email: str(get(raw, "guest_email", "customer_email")) ?? str(get(user, "email")),
    vehicle: vehicle ? normalizeVehicle(vehicle) : undefined,
    driver: driver ? normalizeDriver(driver) : undefined,
    pickup_location: normalizeLocation(get(raw, "pickup_location"), get(raw, "pickup_address")),
    dropoff_location: normalizeLocation(get(raw, "dropoff_location"), get(raw, "dropoff_address")),
    return_location: normalizeLocation(get(raw, "return_location")),
    pickup_date: str(get(raw, "pickup_date")),
    pickup_time: str(get(raw, "pickup_time")),
    return_time: str(get(raw, "return_time")),
    start_date: str(get(raw, "start_date")),
    start_time: str(get(raw, "start_time")),
    end_date: str(get(raw, "end_date")),
    end_time: str(get(raw, "end_time")),
    duration_label: str(get(raw, "duration_label", "duration")),
    amount:
      money(raw, "total_amount", "final_amount", "collected_amount", "total_fare", "amount", "total") ??
      money(fare, "total", "final_amount", "collected_amount") ??
      0,
    base_fare: money(fare, "base_fare", "vehicle_fare", "base_price"),
    vat: money(fare, "vat", "vat_amount"),
    discount: money(fare, "discount", "discount_amount"),
    add_ons: Array.isArray(addOns) ? (addOns as RawRecord[]).map(normalizeAddOn) : [],
    notes: str(get(raw, "notes", "note")),
    cancellation_reason: str(get(raw, "cancellation_reason")),
    created_at: str(get(raw, "created_at")),
  };
};

const normalizeStats = (value: unknown): MobilityStats => {
  const outer = asRecord(value);
  const raw = asRecord(get(outer, "stats", "metrics")) ?? outer;
  return {
    total_rides: toNumber(get(raw, "total_rides", "total_bookings", "total")),
    // The API sends `activeBooking`
    active_bookings: toNumber(get(raw, "active_booking", "active_bookings", "active_rides", "active")),
    ongoing_rides: toNumber(get(raw, "ongoing_rides", "ongoing", "in_transit")),
    completed_rides: toNumber(get(raw, "completed_rides", "completed")),
  };
};

/** `{ data|items|<key>: [...], meta|pagination: {...} }` or a bare array */
function normalizePaged<T>(
  value: unknown,
  mapItem: (item: RawRecord) => T,
  fallback: { page: number; limit: number },
  ...listKeys: string[]
): MobilityList<T> {
  if (Array.isArray(value)) {
    return { items: (value as RawRecord[]).map(mapItem), total: value.length, ...fallback };
  }
  const raw = asRecord(value) ?? {};
  const list = [...listKeys, "items", "data", "results"].map((k) => raw[k]).find(Array.isArray);
  const items = (list ?? []) as RawRecord[];
  const meta = asRecord(get(raw, "meta", "pagination")) ?? raw;
  return {
    items: items.map(mapItem),
    total: get(meta, "total", "total_items", "count") !== undefined
      ? toNumber(get(meta, "total", "total_items", "count"))
      : items.length,
    page: toNumber(get(meta, "page", "current_page")) || fallback.page,
    limit: toNumber(get(meta, "limit", "per_page")) || fallback.limit,
  };
}

const normalizeInventory = (
  value: unknown,
  fallback: { page: number; limit: number }
): MobilityInventory => {
  const raw = asRecord(value) ?? {};
  const metrics = asRecord(get(raw, "metrics", "summary", "stats", "top_metrics")) ?? raw;
  const list = normalizePaged(value, normalizeVehicle, fallback, "vehicles", "inventory", "rows");
  return {
    metrics: {
      total_vehicles: toNumber(get(metrics, "total_vehicles", "total_units", "total")),
      available_now: toNumber(get(metrics, "available_now", "available_units", "available")),
      booked: toNumber(get(metrics, "booked_in_use", "booked", "in_use", "booked_units")),
      out_of_service: toNumber(get(metrics, "out_of_service", "out_of_service_units", "unavailable")),
      pending_assignment: toNumber(get(metrics, "pending_assignment", "pending_assignments", "pending")),
    },
    vehicles: list.items,
    total: list.total,
    page: list.page,
    limit: list.limit,
  };
};

const normalizeFare = (value: unknown): MobilityFare => {
  const outer = asRecord(value);
  const raw = asRecord(get(outer, "breakdown", "fare_breakdown", "fare")) ?? outer;
  const base = money(raw, "base_fare", "vehicle_fare", "base_price") ?? 0;
  const addOns = money(raw, "add_ons_total", "addons_total", "add_ons") ?? 0;
  const discount = money(raw, "discount", "discount_amount") ?? 0;
  const vat = money(raw, "vat", "vat_amount") ?? 0;
  const total =
    money(raw, "total", "total_amount", "final_amount", "collected_amount", "amount") ??
    money(outer, "total", "total_amount", "final_amount") ??
    base + addOns - discount + vat;
  return { base_fare: base, add_ons: addOns, discount, vat, total };
};

// ====== API ======
const createMobilityApi = () => {
  const useInvalidateMobility = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.all });
  };

  return {
    useStats: (category?: MobilityCategory) => {
      const params = removeEmptyParams({ category });
      return useQuery<MobilityStats>({
        queryKey: MOBILITY_QUERY_KEYS.stats(params),
        queryFn: async () => {
          const res = await apiClient.get<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.STATS, { params });
          return normalizeStats(res.data?.data);
        },
      });
    },

    useInventory: (params: MobilityInventoryParams = {}, options?: { refetchInterval?: number }) => {
      const page = params.page ?? 1;
      const limit = params.limit ?? DEFAULT_PAGE_SIZE;
      const query = removeEmptyParams({ ...params, ...pageParams(page, limit) });
      return useQuery<MobilityInventory>({
        queryKey: MOBILITY_QUERY_KEYS.inventory(query),
        queryFn: async () => {
          const res = await apiClient.get<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.INVENTORY, {
            params: query,
          });
          return normalizeInventory(res.data?.data, { page, limit });
        },
        placeholderData: keepPreviousData,
        refetchInterval: options?.refetchInterval,
      });
    },

    useVehicles: (params: MobilityVehicleParams = {}, options?: { enabled?: boolean }) => {
      const page = params.page ?? 1;
      const limit = params.limit ?? DEFAULT_PAGE_SIZE;
      const query = removeEmptyParams({ ...params, ...pageParams(page, limit) });
      return useQuery<MobilityList<MobilityVehicle>>({
        queryKey: MOBILITY_QUERY_KEYS.vehicles(query),
        queryFn: async () => {
          const res = await apiClient.get<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.VEHICLES, {
            params: query,
          });
          return normalizePaged(res.data?.data, normalizeVehicle, { page, limit }, "vehicles");
        },
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
      });
    },

    useBookings: (params: MobilityBookingParams = {}) => {
      const page = params.page ?? 1;
      const limit = params.limit ?? DEFAULT_PAGE_SIZE;
      // The list filters by `service_category`; `category` is also accepted
      const query = removeEmptyParams({
        ...params,
        service_category: params.category,
        ...pageParams(page, limit),
      });
      return useQuery<MobilityList<MobilityBooking>>({
        queryKey: MOBILITY_QUERY_KEYS.bookings(query),
        queryFn: async () => {
          const res = await apiClient.get<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.BOOKINGS, {
            params: query,
          });
          return normalizePaged(res.data?.data, normalizeBooking, { page, limit }, "bookings");
        },
        placeholderData: keepPreviousData,
      });
    },

    useBooking: (id: string) =>
      useQuery<MobilityBooking>({
        queryKey: MOBILITY_QUERY_KEYS.booking(id),
        queryFn: async () => {
          const res = await apiClient.get<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.BOOKING(id));
          const data = asRecord(res.data?.data) ?? {};
          return normalizeBooking(asRecord(data.booking) ?? data);
        },
        enabled: Boolean(id),
      }),

    useDrivers: (params: { page?: number; limit?: number } = {}) => {
      const page = params.page ?? 1;
      const limit = params.limit ?? 50;
      const query = { page, limit };
      return useQuery<MobilityList<MobilityDriver>>({
        queryKey: MOBILITY_QUERY_KEYS.drivers(query),
        queryFn: async () => {
          const res = await apiClient.get<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.DRIVERS, {
            params: query,
          });
          return normalizePaged(res.data?.data, normalizeDriver, { page, limit }, "drivers");
        },
        placeholderData: keepPreviousData,
      });
    },

    useCreateVehicle: () => {
      const invalidate = useInvalidateMobility();
      return useSafeMutation<BaseApiResponse<unknown>, VehiclePayload>({
        maxRetries: 0,
        mutationFn: async (payload) =>
          (await apiClient.post<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.VEHICLES, payload)).data,
        onSuccess: (data) => {
          toast.success(data.message || "Vehicle added");
          invalidate();
        },
        onError: (error) =>
          toast.error("Could not add vehicle", { description: getErrorMessage(error, "Please try again.") }),
      });
    },

    useUpdateVehicle: () => {
      const invalidate = useInvalidateMobility();
      return useSafeMutation<BaseApiResponse<unknown>, { id: string; payload: Partial<VehiclePayload> }>({
        maxRetries: 0,
        mutationFn: async ({ id, payload }) =>
          (await apiClient.patch<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.VEHICLE(id), payload)).data,
        onSuccess: (data) => {
          toast.success(data.message || "Vehicle updated");
          invalidate();
        },
        onError: (error) =>
          toast.error("Could not update vehicle", { description: getErrorMessage(error, "Please try again.") }),
      });
    },

    useUpdateAvailability: () => {
      const invalidate = useInvalidateMobility();
      return useSafeMutation<BaseApiResponse<unknown>, { id: string; payload: VehicleAvailabilityPayload }>({
        maxRetries: 0,
        mutationFn: async ({ id, payload }) =>
          (await apiClient.patch<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.VEHICLE_AVAILABILITY(id), payload))
            .data,
        onSuccess: (data) => {
          toast.success(data.message || "Availability updated");
          invalidate();
        },
        onError: (error) =>
          toast.error("Could not update availability", {
            description: getErrorMessage(error, "Please try again."),
          }),
      });
    },

    useCreateBooking: () => {
      const invalidate = useInvalidateMobility();
      return useSafeMutation<BaseApiResponse<unknown>, CreateMobilityBookingPayload>({
        // Creating a booking is not idempotent — never retry automatically
        maxRetries: 0,
        mutationFn: async (payload) =>
          (await apiClient.post<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.BOOKINGS, payload)).data,
        onSuccess: (data) => {
          toast.success(data.message || "Booking created");
          invalidate();
        },
        onError: (error) =>
          toast.error("Could not create booking", { description: getErrorMessage(error, "Please try again.") }),
      });
    },

    useUpdateBookingStatus: () => {
      const invalidate = useInvalidateMobility();
      return useSafeMutation<BaseApiResponse<unknown>, { id: string; payload: UpdateBookingStatusPayload }>({
        maxRetries: 0,
        mutationFn: async ({ id, payload }) =>
          (await apiClient.patch<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.BOOKING_STATUS(id), payload)).data,
        onSuccess: (data) => {
          toast.success(data.message || "Booking updated");
          invalidate();
        },
        onError: (error) =>
          toast.error("Could not update booking", { description: getErrorMessage(error, "Please try again.") }),
      });
    },

    useAssignDriver: () => {
      const invalidate = useInvalidateMobility();
      return useSafeMutation<BaseApiResponse<unknown>, { id: string; driverId?: string }>({
        maxRetries: 0,
        mutationFn: async ({ id, driverId }) =>
          (
            await apiClient.patch<BaseApiResponse<unknown>>(
              ENDPOINTS.MOBILITY.BOOKING_ASSIGN_DRIVER(id),
              // Omitting driver_id un-assigns
              driverId ? { driver_id: driverId } : {}
            )
          ).data,
        onSuccess: (data) => {
          toast.success(data.message || "Chauffeur assignment updated");
          invalidate();
        },
        onError: (error) =>
          toast.error("Could not assign chauffeur", { description: getErrorMessage(error, "Please try again.") }),
      });
    },

    useCreateDriver: () => {
      const invalidate = useInvalidateMobility();
      return useSafeMutation<BaseApiResponse<unknown>, DriverPayload>({
        maxRetries: 0,
        mutationFn: async (payload) =>
          (await apiClient.post<BaseApiResponse<unknown>>(ENDPOINTS.MOBILITY.DRIVERS, payload)).data,
        onSuccess: (data) => {
          toast.success(data.message || "Chauffeur added");
          invalidate();
        },
        onError: (error) =>
          toast.error("Could not add chauffeur", { description: getErrorMessage(error, "Please try again.") }),
      });
    },

    /** Fare for the manual booking modal; recalculated as the vehicle/trip changes */
    useCalculateFare: (payload: CalculateFarePayload | null) =>
      useQuery<MobilityFare>({
        queryKey: [...MOBILITY_QUERY_KEYS.all, "fare", payload],
        queryFn: async () => {
          const res = await apiClient.post<BaseApiResponse<unknown>>(
            ENDPOINTS.MOBILITY.CALCULATE_FARE,
            payload
          );
          return normalizeFare(res.data?.data);
        },
        enabled: Boolean(payload?.vehicle_id && payload.trip_type),
        retry: false,
      }),
  };
};

export const MobilityApi = createMobilityApi();
