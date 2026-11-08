// Beach Houses bookings API (guide §6): bookings, check-in → complete → deposit,
// walk-in bookings, availability calendar, experience schedule and reviews.

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { IBusinessErrorResponse, IBusinessSuccessResponse } from "@/types/api";
import type {
  BookingDetail,
  BookingsParams,
  BookingSummary,
  ListingCalendar,
  ListingDay,
  ListingReview,
  ManualBookingPayload,
  Paged,
  ScheduledExperience,
} from "@/types/beach-house-types";
import { BEACH_HOUSE_QUERY_KEYS } from "../query-keys";
import { apiClient, safeApiCall } from "./api-client";
import { ENDPOINTS } from "./endpoints";

const B = ENDPOINTS.BEACH_HOUSES;
type Res<T> = IBusinessSuccessResponse<T> | IBusinessErrorResponse;

const clean = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
const get = <T>(url: string, params?: object) => safeApiCall<T>(() => apiClient.get<Res<T>>(url, { params: params && clean(params) }));

/** Booking changes affect lists, the detail, the calendar and the schedule */
const useInvalidateBookings = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: BEACH_HOUSE_QUERY_KEYS.all });
};

export interface ReviewsParams {
  page?: number;
  limit?: number;
  listing_id?: string;
  rating?: number;
  replied?: boolean;
}

export const BeachHouseBookingsApi = {
  useBookings: (params: BookingsParams) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.bookings({ ...params }),
      queryFn: () => get<Paged<BookingSummary>>(B.BOOKINGS, params),
      placeholderData: keepPreviousData,
    }),

  useBooking: (id?: string) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.booking(id ?? ""),
      queryFn: () => get<BookingDetail>(B.BOOKING(id!)),
      enabled: Boolean(id),
    }),

  /** check-in / complete / no-show (PATCH, no body). Errors are toasted by the caller. */
  useBookingAction: () => {
    const invalidate = useInvalidateBookings();
    return useSafeMutation<unknown, { id: string; action: "check-in" | "complete" | "no-show" }>({
      mutationFn: ({ id, action }) => safeApiCall(() => apiClient.patch<Res<unknown>>(B.BOOKING_ACTION(id, action))),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  /** Confirmed only; the guest is refunded 100% */
  useCancelBooking: () => {
    const invalidate = useInvalidateBookings();
    return useSafeMutation<unknown, { id: string; reason: string }>({
      mutationFn: ({ id, reason }) => safeApiCall(() => apiClient.post<Res<unknown>>(B.BOOKING_CANCEL(id), { reason })),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  useClaimDeposit: () => {
    const invalidate = useInvalidateBookings();
    return useSafeMutation<unknown, { id: string; amount: number; reason: string; evidence_urls?: string[] }>({
      mutationFn: ({ id, ...body }) => safeApiCall(() => apiClient.post<Res<unknown>>(B.DEPOSIT_CLAIM(id), body)),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  useReleaseDeposit: () => {
    const invalidate = useInvalidateBookings();
    return useSafeMutation<unknown, string>({
      mutationFn: (id) => safeApiCall(() => apiClient.post<Res<unknown>>(B.DEPOSIT_RELEASE(id))),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  /** Walk-in / phone booking — created Confirmed; 409 when the dates are taken */
  useCreateManualBooking: () => {
    const invalidate = useInvalidateBookings();
    return useSafeMutation<BookingDetail, { listingId: string; payload: ManualBookingPayload }>({
      mutationFn: ({ listingId, payload }) =>
        safeApiCall<BookingDetail>(() => apiClient.post<Res<BookingDetail>>(B.MANUAL_BOOKING(listingId), payload)),
      maxRetries: 0,
      onSuccess: () => invalidate(),
      onError: () => {},
    });
  },

  useCalendar: (listingId?: string, month?: string) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.calendar(listingId ?? "", month ?? ""),
      queryFn: () => get<ListingCalendar>(B.LISTING_CALENDAR(listingId!), { month }),
      enabled: Boolean(listingId && month),
      placeholderData: keepPreviousData,
    }),

  useListingDay: (listingId?: string, date?: string) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.listingDay(listingId ?? "", date ?? ""),
      queryFn: () => get<ListingDay>(B.LISTING_DAY(listingId!), { date }),
      enabled: Boolean(listingId && date),
    }),

  useSetAvailability: () => {
    const invalidate = useInvalidateBookings();
    return useSafeMutation<unknown, { listingId: string; dates: string[]; is_blocked: boolean }>({
      mutationFn: ({ listingId, dates, is_blocked }) =>
        safeApiCall(() => apiClient.put<Res<unknown>>(B.LISTING_AVAILABILITY(listingId), { dates, is_blocked })),
      maxRetries: 0,
      onSuccess: () => invalidate(),
    });
  },

  useExperienceSchedule: (params: { from: string; to: string; experience_id?: string }) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.experienceSchedule({ ...params }),
      queryFn: () => get<ScheduledExperience[]>(B.EXPERIENCE_SCHEDULE, params),
      placeholderData: keepPreviousData,
    }),

  useReviews: (params: ReviewsParams) =>
    useQuery({
      queryKey: BEACH_HOUSE_QUERY_KEYS.reviews({ ...params }),
      queryFn: () => get<Paged<ListingReview>>(B.REVIEWS, params),
      placeholderData: keepPreviousData,
    }),

  useReplyToReview: () => {
    const queryClient = useQueryClient();
    return useSafeMutation<unknown, { id: string; reply: string }>({
      mutationFn: ({ id, reply }) => safeApiCall(() => apiClient.post<Res<unknown>>(B.REVIEW_REPLY(id), { reply })),
      maxRetries: 0,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [...BEACH_HOUSE_QUERY_KEYS.all, "reviews"] }),
    });
  },
};
