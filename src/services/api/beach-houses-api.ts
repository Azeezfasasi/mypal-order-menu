// Beach Houses "Edit by day" (B5): the day's listings with availability
// toggles, and each listing's bookings for that day with their actions.

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { IBusinessErrorResponse, IBusinessSuccessResponse } from "@/types/api";
import type {
  DayView,
  DayViewParams,
  ExperiencesParams,
  ListingCard,
  ListingDay,
  ListingDetail,
  ListingsParams,
  OptionalExperience,
  Paged,
} from "@/types/beach-house-types";
import { BEACH_HOUSE_QUERY_KEYS } from "../query-keys";
import { apiClient, safeApiCall } from "./api-client";
import { ENDPOINTS } from "./endpoints";

const B = ENDPOINTS.BEACH_HOUSES;
type Res<T> = IBusinessSuccessResponse<T> | IBusinessErrorResponse;

const clean = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));

const get = <T>(url: string, params?: object) => safeApiCall<T>(() => apiClient.get<Res<T>>(url, { params: params && clean(params) }));

export type BookingAction = "check-in" | "complete" | "no-show";

export const BeachHousesApi = {
  // Lookups for the bookings filters and the walk-in booking form
  useListings: (params: ListingsParams) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.listings({ ...params }),
      queryFn: () => get<Paged<ListingCard>>(B.LISTINGS, params),
      placeholderData: keepPreviousData,
    }),

  useListing: (id?: string) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.listing(id ?? ""),
      queryFn: () => get<ListingDetail>(B.LISTING(id!)),
      enabled: Boolean(id),
    }),

  useExperiences: (params: ExperiencesParams) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.experiences({ ...params }),
      queryFn: () => get<Paged<OptionalExperience>>(B.EXPERIENCES, params),
      placeholderData: keepPreviousData,
    }),

  useDayView: (params: DayViewParams, options?: { refetchInterval?: number }) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.dayView({ ...params }),
      queryFn: () => safeApiCall<DayView>(() => apiClient.get<Res<DayView>>(B.DAY_VIEW, { params: clean(params) })),
      placeholderData: keepPreviousData,
      refetchInterval: options?.refetchInterval,
    }),

  useListingDay: (listingId?: string, date?: string) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.listingDay(listingId ?? "", date ?? ""),
      queryFn: () => safeApiCall<ListingDay>(() => apiClient.get<Res<ListingDay>>(B.LISTING_DAY(listingId!), { params: { date } })),
      enabled: Boolean(listingId && date),
    }),

  /** Block (is_blocked) or open days for a listing */
  useSetAvailability: () => {
    const queryClient = useQueryClient();
    return useSafeMutation<unknown, { listingId: string; dates: string[]; is_blocked: boolean }>({
      mutationFn: ({ listingId, dates, is_blocked }) =>
        safeApiCall(() => apiClient.put<Res<unknown>>(B.LISTING_AVAILABILITY(listingId), { dates, is_blocked })),
      maxRetries: 0,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: BEACH_HOUSE_QUERY_KEYS.all }),
    });
  },

  /** check-in / complete / no-show (PATCH, no body). Errors are toasted by the caller. */
  useBookingAction: () => {
    const queryClient = useQueryClient();
    return useSafeMutation<unknown, { id: string; action: BookingAction }>({
      mutationFn: ({ id, action }) => safeApiCall(() => apiClient.patch<Res<unknown>>(B.BOOKING_ACTION(id, action))),
      maxRetries: 0,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: BEACH_HOUSE_QUERY_KEYS.all }),
      onError: () => {},
    });
  },

  /** Confirmed only; the guest is refunded 100% */
  useCancelBooking: () => {
    const queryClient = useQueryClient();
    return useSafeMutation<unknown, { id: string; reason: string }>({
      mutationFn: ({ id, reason }) => safeApiCall(() => apiClient.post<Res<unknown>>(B.BOOKING_CANCEL(id), { reason })),
      maxRetries: 0,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: BEACH_HOUSE_QUERY_KEYS.all }),
      onError: () => {},
    });
  },
};
