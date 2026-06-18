// src/services/api/buffet-reservation-api.ts

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse, PaginationResult } from "@/types/api";
import type {
  IBuffetPaymentInitResponse,
  IBuffetPaymentVerificationResponse,
  IBuffetReservation,
  IBuffetReservationListItem,
  IBuffetReservationQueryOptions,
  ICreateBuffetReservationDto,
} from "@/types/buffet-reservation-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BUFFET_AVAILABILITY_QUERY_KEYS,
  BUFFET_RESERVATION_QUERY_KEYS,
} from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ==================================
// API Response Types
// ==================================

export type BuffetReservationListResponse = BaseApiResponse<
  PaginationResult<IBuffetReservationListItem[]>
>;
export type BuffetReservationDetailResponse =
  BaseApiResponse<IBuffetReservation>;
export type BuffetPaymentInitResponse =
  BaseApiResponse<IBuffetPaymentInitResponse>;
export type BuffetPaymentVerificationResponse =
  BaseApiResponse<IBuffetPaymentVerificationResponse>;

// ==================================
// Buffet Reservation API Hooks Factory
// ==================================

export const createBuffetReservationApi = () => {
  return {
    // Hook to create a new buffet reservation
    useCreateReservation: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BuffetPaymentInitResponse,
        ICreateBuffetReservationDto
      >({
        mutationFn: async (reservationData: ICreateBuffetReservationDto) => {
          const response = await apiClient.post<BuffetPaymentInitResponse>(
            ENDPOINTS.BUFFET_RESERVATIONS.CREATE,
            reservationData,
          );
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(
            response.message ||
              "Reservation created successfully! Please complete payment.",
          );
          // Invalidate availability and reservation lists to refresh UI state
          queryClient.invalidateQueries({
            queryKey: BUFFET_RESERVATION_QUERY_KEYS.businessList(),
          });
          queryClient.invalidateQueries({
            queryKey: BUFFET_AVAILABILITY_QUERY_KEYS.all,
          });
        },
        onError: (error) => {
          toast.error("Failed to create buffet reservation", {
            description: error.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to verify buffet reservation payment
    useVerifyPayment: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BuffetPaymentVerificationResponse, string>({
        mutationFn: async (referenceId: string) => {
          const response =
            await apiClient.post<BuffetPaymentVerificationResponse>(
              ENDPOINTS.BUFFET_RESERVATIONS.VERIFY_PAYMENT(referenceId),
            );
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(
            response.message ||
              "Payment verified and buffet reservation confirmed!",
          );
          // Invalidate business reservations and availability to refresh the list
          queryClient.invalidateQueries({
            queryKey: BUFFET_RESERVATION_QUERY_KEYS.businessList(),
          });
          queryClient.invalidateQueries({
            queryKey: BUFFET_AVAILABILITY_QUERY_KEYS.all,
          });
        },
        onError: (error) => {
          toast.error("Failed to verify payment", {
            description: error.message || "Payment verification failed",
          });
        },
      });
    },

    // Hook to get business buffet reservations
    useGetBusinessReservations: (params?: IBuffetReservationQueryOptions) => {
      return useQuery<BuffetReservationListResponse>({
        queryKey: BUFFET_RESERVATION_QUERY_KEYS.businessList(params),
        queryFn: async () => {
          const searchParams = new URLSearchParams();

          if (params?.page !== undefined) {
            searchParams.append("page", params.page.toString());
          }
          if (params?.limit !== undefined) {
            searchParams.append("limit", params.limit.toString());
          }
          if (params?.search) {
            searchParams.append("search", params.search);
          }
          if (params?.status) {
            searchParams.append("status", params.status);
          }
          if (params?.startDate) {
            searchParams.append("startDate", params.startDate);
          }
          if (params?.endDate) {
            searchParams.append("endDate", params.endDate);
          }

          const queryString = searchParams.toString();
          const url = queryString
            ? `${ENDPOINTS.BUFFET_RESERVATIONS.GET_BUSINESS_RESERVATIONS}?${queryString}`
            : ENDPOINTS.BUFFET_RESERVATIONS.GET_BUSINESS_RESERVATIONS;

          const response =
            await apiClient.get<BuffetReservationListResponse>(url);
          return response.data;
        },
      });
    },

    // Hook to get a specific buffet reservation
    useGetReservation: (reservationId: string, enabled: boolean = true) => {
      return useQuery<BuffetReservationDetailResponse>({
        queryKey: BUFFET_RESERVATION_QUERY_KEYS.detail(reservationId),
        queryFn: async () => {
          const response = await apiClient.get<BuffetReservationDetailResponse>(
            ENDPOINTS.BUFFET_RESERVATIONS.GET_ONE(reservationId),
          );
          return response.data;
        },
        enabled: enabled && !!reservationId,
      });
    },

    // Alternative method for creating reservation with better error handling
    useCreateBuffetReservation: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BuffetPaymentInitResponse,
        ICreateBuffetReservationDto
      >({
        mutationFn: async (data: ICreateBuffetReservationDto) => {
          // Validate required fields
          if (!data.business_id) {
            throw new Error("Business ID is required");
          }
          if (!data.date || !data.time) {
            throw new Error("Reservation date and time are required");
          }
          if (data.no_of_adults <= 0) {
            throw new Error("At least one adult is required");
          }
          if (data.no_of_children < 0) {
            throw new Error("Number of children cannot be negative");
          }

          // Check if at least one meal option is selected
          const hasBuffetMeal = data.buffet_meal?.id;
          const hasSpecialOffers =
            data.special_offer_items && data.special_offer_items.length > 0;

          if (!hasBuffetMeal && !hasSpecialOffers) {
            throw new Error(
              "Please select at least a buffet meal or special offer items",
            );
          }

          const response = await apiClient.post<BuffetPaymentInitResponse>(
            ENDPOINTS.BUFFET_RESERVATIONS.CREATE,
            data,
          );
          return response.data;
        },
        onSuccess: () => {
          toast.success("Reservation initiated successfully!", {
            description:
              "Please complete the payment to confirm your reservation.",
          });
          // Refresh reservation lists and availability
          queryClient.invalidateQueries({
            queryKey: BUFFET_RESERVATION_QUERY_KEYS.businessList(),
          });
          queryClient.invalidateQueries({
            queryKey: BUFFET_AVAILABILITY_QUERY_KEYS.all,
          });
        },
        onError: (error) => {
          toast.error("Failed to create reservation", {
            description:
              error.message || "Please check your information and try again.",
          });
        },
      });
    },

    // Hook for payment verification with automatic retry
    useVerifyBuffetPayment: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BuffetPaymentVerificationResponse,
        { referenceId: string; maxRetries?: number }
      >({
        mutationFn: async ({ referenceId, maxRetries = 3 }) => {
          let lastError: Error;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const response =
                await apiClient.post<BuffetPaymentVerificationResponse>(
                  ENDPOINTS.BUFFET_RESERVATIONS.VERIFY_PAYMENT(referenceId),
                );
              return response.data;
            } catch (error) {
              lastError = error as Error;

              // If it's the last attempt, throw the error
              if (attempt === maxRetries) {
                throw lastError;
              }

              // Wait before retrying (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, attempt * 1000),
              );
            }
          }

          throw lastError!;
        },
        onSuccess: () => {
          toast.success("Payment verified successfully!", {
            description: "Your buffet reservation has been confirmed.",
          });

          // Invalidate and refetch reservation data
          queryClient.invalidateQueries({
            queryKey: BUFFET_RESERVATION_QUERY_KEYS.businessList(),
          });
        },
        onError: (error) => {
          toast.error("Payment verification failed", {
            description:
              error.message ||
              "Please contact support if payment was deducted.",
          });
        },
      });
    },
  };
};

// ==================================
// Export Instance
// ==================================
export const BuffetReservationApi = createBuffetReservationApi();

// ==================================
// Utility Functions
// ==================================

/**
 * Calculate total amount for buffet reservation (client-side estimation)
 * Note: This is for UI display only. Final calculation is done on the server.
 */
export const calculateBuffetReservationTotal = (
  reservation: ICreateBuffetReservationDto,
  priceData: {
    buffetMealPrices?: { adult: number; child: number };
    specialOfferPrices?: Record<string, number>;
    otherItemPrices?: Record<string, number>;
  },
): number => {
  let total = 0;

  // Calculate buffet meal cost
  if (reservation.buffet_meal && priceData.buffetMealPrices) {
    const { adult, child } = priceData.buffetMealPrices;
    total +=
      reservation.buffet_meal.quantity_adults * adult +
      reservation.buffet_meal.quantity_children * child;
  }

  // Calculate special offer items cost
  if (reservation.special_offer_items && priceData.specialOfferPrices) {
    reservation.special_offer_items.forEach((item) => {
      const price = priceData.specialOfferPrices?.[item.id] || 0;
      total += price * item.quantity;
    });
  }

  // Calculate other items cost
  if (reservation.other_items && priceData.otherItemPrices) {
    reservation.other_items.forEach((item) => {
      const price = priceData.otherItemPrices?.[item.id] || 0;
      total += price * item.quantity;
    });
  }

  return total;
};

/**
 * Format buffet reservation for display
 */
export const formatBuffetReservationForDisplay = (
  reservation: IBuffetReservation,
) => {
  return {
    id: reservation.id,
    customerName: `${reservation.user.firstname} ${reservation.user.lastname}`,
    customerEmail: reservation.user.email,
    reservationDate: reservation.date,
    reservationTime: reservation.time,
    guestCount: reservation.total_individuals,
    adults: reservation.no_of_adults,
    children: reservation.no_of_children,
    mealType: reservation.meal_type,
    amount: reservation.payment.amount,
    paymentReference: reservation.payment.reference,
    paymentStatus: reservation.payment.status,
    createdAt: reservation.createdAt,
    hasBuffetMeal: !!reservation.buffetMeal,
    hasSpecialOffers: reservation.specialOfferItems.length > 0,
    hasOtherItems: reservation.otherItems.length > 0,
  };
};
