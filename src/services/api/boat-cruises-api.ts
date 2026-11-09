// Boat & Yacht Cruises business API: boats (wizard), the Availability & Inventory
// grid, Add Manual Booking, bookings and reviews.
// The X-Branch-Id header is added by the request interceptor from the branch selector.

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { IBusinessErrorResponse, IBusinessSuccessResponse } from "@/types/api";
import type {
  BoatAmenity,
  BoatBookingDetail,
  BoatBookingsParams,
  BoatBookingSummary,
  BoatCancellationPolicy,
  BoatCard,
  BoatDayView,
  BoatListingDay,
  BoatDetail,
  BoatGrid,
  BoatManualBookingPayload,
  BoatPayload,
  BoatReview,
  BoatReviewsParams,
  BoatsParams,
  BoatStatus,
  BoatType,
  InventoryItem,
  Paged,
  PolicyTemplateOption,
  TravelAgency,
  VesselClass,
} from "@/types/boat-cruise-types";
import { BOAT_CRUISE_QUERY_KEYS } from "../query-keys";
import { apiClient, safeApiCall } from "./api-client";
import { ENDPOINTS } from "./endpoints";

const B = ENDPOINTS.BOAT_CRUISES;
type Res<T> = IBusinessSuccessResponse<T> | IBusinessErrorResponse;

const clean = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));

const get = <T>(url: string, params?: object) => safeApiCall<T>(() => apiClient.get<Res<T>>(url, { params: params && clean(params) }));

/** The API error message and, for 422 publish errors, the fields still missing */
export const boatError = (error: unknown) => {
  const e = error as { message?: string; status?: number; response?: { data?: { message?: unknown; data?: { missing?: string[] } } } };
  const message = e?.response?.data?.message ?? e?.message;
  return {
    status: e?.status,
    message: Array.isArray(message) ? message.join(". ") : (message as string) || "Something went wrong",
    missing: e?.response?.data?.data?.missing ?? [],
  };
};

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return (key: readonly unknown[] = BOAT_CRUISE_QUERY_KEYS.all) => queryClient.invalidateQueries({ queryKey: key });
};

const multipart = { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 };

export const BoatCruisesApi = {
  // ---------- Boats ----------
  useBoats: (params: BoatsParams) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.boats({ ...params }),
      queryFn: () => get<Paged<BoatCard>>(B.LISTINGS, params),
      placeholderData: keepPreviousData,
    }),

  useBoat: (id?: string) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.boat(id ?? ""),
      queryFn: () => get<BoatDetail>(B.LISTING(id!)),
      enabled: Boolean(id),
    }),

  /** Step 1 "Next" on a new boat. Errors are handled by the wizard. */
  useCreateBoat: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<BoatDetail, BoatPayload>({
      mutationFn: (payload) => safeApiCall<BoatDetail>(() => apiClient.post<Res<BoatDetail>>(B.LISTINGS, payload)),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  /** Each later wizard step (partial). Errors are handled by the wizard. */
  useUpdateBoat: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<BoatDetail, { id: string; payload: BoatPayload }>({
      mutationFn: ({ id, payload }) => safeApiCall<BoatDetail>(() => apiClient.patch<Res<BoatDetail>>(B.LISTING(id), payload)),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  /** Publish / unpublish. 422 → data.missing, 403 → business not verified. */
  useSetBoatStatus: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, { id: string; status: Exclude<BoatStatus, "DRAFT"> }>({
      mutationFn: ({ id, status }) => safeApiCall(() => apiClient.patch<Res<unknown>>(B.LISTING_STATUS(id), { status })),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  /** Availability toggle on the card */
  useSetBoatActive: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, { id: string; is_active: boolean }>({
      mutationFn: ({ id, is_active }) => safeApiCall(() => apiClient.patch<Res<unknown>>(B.LISTING_ACTIVE(id), { is_active })),
      maxRetries: 0,
      onSuccess: () => invalidate(),
    });
  },

  /** 409 with upcoming_bookings while the boat has upcoming bookings */
  useDeleteBoat: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, string>({
      mutationFn: (id) => safeApiCall(() => apiClient.delete<Res<unknown>>(B.LISTING(id))),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  /** Up to 10 images per call → their URLs */
  uploadImages: async (files: File[]) => {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i += 10) {
      const form = new FormData();
      files.slice(i, i + 10).forEach((file) => form.append("images", file));
      const data = await safeApiCall<{ urls: string[] }>(() => apiClient.post<Res<{ urls: string[] }>>(B.IMAGES, form, multipart));
      urls.push(...(data?.urls ?? []));
    }
    return urls;
  },

  useUploadTermsDocument: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, { id: string; file: File }>({
      mutationFn: ({ id, file }) => {
        const form = new FormData();
        form.append("file", file);
        return safeApiCall(() => apiClient.post<Res<unknown>>(B.TERMS_DOCUMENT(id), form, multipart));
      },
      maxRetries: 0,
      onSuccess: () => invalidate(),
    });
  },

  useRemoveTermsDocument: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, string>({
      mutationFn: (id) => safeApiCall(() => apiClient.delete<Res<unknown>>(B.TERMS_DOCUMENT(id))),
      maxRetries: 0,
      onSuccess: () => invalidate(),
    });
  },

  // ---------- Wizard lookups ----------
  useBoatTypes: () =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.boatTypes(),
      queryFn: () => get<{ boats: BoatType[]; yachts: BoatType[] }>(B.BOAT_TYPES),
      staleTime: 10 * 60 * 1000,
    }),

  useCreateBoatType: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<BoatType, { name: string; vessel_class: VesselClass }>({
      mutationFn: (body) => safeApiCall<BoatType>(() => apiClient.post<Res<BoatType>>(B.BOAT_TYPES, body)),
      maxRetries: 0,
      onSuccess: () => invalidate(BOAT_CRUISE_QUERY_KEYS.boatTypes()),
    });
  },

  useAmenities: () =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.amenities(),
      queryFn: () => get<BoatAmenity[]>(B.AMENITIES),
      staleTime: 10 * 60 * 1000,
    }),

  useCreateAmenity: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<BoatAmenity, { label: string; icon?: string }>({
      mutationFn: (body) => safeApiCall<BoatAmenity>(() => apiClient.post<Res<BoatAmenity>>(B.AMENITIES, body)),
      maxRetries: 0,
      onSuccess: () => invalidate(BOAT_CRUISE_QUERY_KEYS.amenities()),
    });
  },

  usePolicyTemplates: () =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.policyTemplates(),
      queryFn: () => get<PolicyTemplateOption[]>(B.POLICY_TEMPLATES),
      staleTime: 30 * 60 * 1000,
    }),

  /** The business's own policies, for "Custom" */
  useBusinessPolicies: () =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.businessPolicies(),
      queryFn: async () => {
        const data = await get<BoatCancellationPolicy[] | { items: BoatCancellationPolicy[] }>(ENDPOINTS.CANCELLATION_POLICIES.GET_ALL);
        return Array.isArray(data) ? data : (data?.items ?? []);
      },
    }),

  // ---------- Availability & Inventory ----------
  useGrid: (start: string, end: string) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.grid(start, end),
      queryFn: () => get<BoatGrid>(B.INVENTORY_GRID, { start_date: start, end_date: end, category: "Boat" }),
      placeholderData: keepPreviousData,
      refetchInterval: 30_000,
    }),

  /** entity_id = a boat type (row) blocks every boat of that type; a boat id blocks one boat */
  useBlockSlot: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, { entity_id: string; dates: string[]; is_blocked: boolean }>({
      mutationFn: (body) => safeApiCall(() => apiClient.patch<Res<unknown>>(B.INVENTORY_BLOCK, { entity_type: "Boat", ...body })),
      maxRetries: 0,
      onSuccess: () => invalidate(),
    });
  },

  // ---------- Add Manual Booking ----------
  useInventoryItems: (enabled = true) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.inventoryItems(),
      queryFn: () => get<InventoryItem[]>(B.INVENTORY_ITEMS, { category: "Boat" }),
      enabled,
    }),

  useTravelAgencies: (enabled = true) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.travelAgencies(),
      queryFn: () => get<TravelAgency[]>(B.TRAVEL_AGENCIES),
      enabled,
    }),

  useCreateTravelAgency: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<TravelAgency, { name: string }>({
      mutationFn: (body) => safeApiCall<TravelAgency>(() => apiClient.post<Res<TravelAgency>>(B.TRAVEL_AGENCIES, body)),
      maxRetries: 0,
      onSuccess: () => invalidate(BOAT_CRUISE_QUERY_KEYS.travelAgencies()),
    });
  },

  /** Created CONFIRMED / PAID_OFFLINE. 409 if booked or blocked; 400 outside hours or below the minimum. */
  useCreateManualBooking: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<{ id?: string; reference?: string; online_quote_total?: number }, BoatManualBookingPayload>({
      mutationFn: (payload) => safeApiCall(() => apiClient.post<Res<{ id?: string; reference?: string }>>(B.MANUAL_BOOKING, payload)),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  // ---------- Bookings ----------
  useBookings: (params: BoatBookingsParams, enabled = true) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.bookings({ ...params }),
      queryFn: () => get<Paged<BoatBookingSummary>>(B.BOOKINGS, params),
      placeholderData: keepPreviousData,
      enabled,
    }),

  useBooking: (id?: string) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.booking(id ?? ""),
      queryFn: () => get<BoatBookingDetail>(B.BOOKING(id!)),
      enabled: Boolean(id),
    }),

  /** check-in / complete / no-show. Errors are toasted by the caller. */
  useBookingAction: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, { id: string; action: "check-in" | "complete" | "no-show" }>({
      mutationFn: ({ id, action }) => safeApiCall(() => apiClient.patch<Res<unknown>>(B.BOOKING_ACTION(id, action))),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  /** The guest is refunded 100% to their wallet */
  useCancelBooking: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, { id: string; reason: string }>({
      mutationFn: ({ id, reason }) => safeApiCall(() => apiClient.post<Res<unknown>>(B.BOOKING_CANCEL(id), { reason })),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  // ---------- Day view (Operations app) ----------
  useDayView: (params: { date: string; vessel_class?: VesselClass; search?: string }) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.dayView({ ...params }),
      queryFn: () => get<BoatDayView>(B.DAY_VIEW, params),
      placeholderData: keepPreviousData,
      refetchInterval: 30_000,
    }),

  /** "View Details": a boat's bookings and free start times on a date */
  useListingDay: (id?: string, date?: string) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.listingDay(id ?? "", date ?? ""),
      queryFn: () => get<BoatListingDay>(B.LISTING_DAY(id!), { date }),
      enabled: Boolean(id && date),
    }),

  /** Block or open whole days for one boat */
  useSetDayAvailability: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, { id: string; dates: string[]; is_blocked: boolean }>({
      mutationFn: ({ id, dates, is_blocked }) => safeApiCall(() => apiClient.put<Res<unknown>>(B.LISTING_AVAILABILITY(id), { dates, is_blocked })),
      maxRetries: 0,
      onSuccess: () => invalidate(),
    });
  },

  // ---------- Reviews ----------
  useReviews: (params: BoatReviewsParams) =>
    useQuery({
      queryKey: BOAT_CRUISE_QUERY_KEYS.reviews({ ...params }),
      queryFn: () => get<Paged<BoatReview>>(B.REVIEWS, params),
      placeholderData: keepPreviousData,
    }),

  useReplyToReview: () => {
    const invalidate = useInvalidate();
    return useSafeMutation<unknown, { id: string; reply: string }>({
      mutationFn: ({ id, reply }) => safeApiCall(() => apiClient.post<Res<unknown>>(B.REVIEW_REPLY(id), { reply })),
      maxRetries: 0,
      onSuccess: () => invalidate([...BOAT_CRUISE_QUERY_KEYS.all, "reviews"]),
    });
  },
};
