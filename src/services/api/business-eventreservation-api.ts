import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EVENT_RESERVATION_QUERY_KEYS } from "../query-keys";
import { ENDPOINTS } from "./endpoints";

import { BaseApiResponse, BaseError } from "@/types/api";
import {
  ICreateEventReservationDto,
  IEventReservation,
  IUpdateEventReservationDto,
} from "@/types/event-reservation-types";
import { toast } from "sonner";
import { apiClient } from "./api-client";

// Get all reservations for an event
export const useGetEventReservations = (eventId: string) =>
  useQuery<BaseApiResponse<IEventReservation[]>>({
    queryKey: EVENT_RESERVATION_QUERY_KEYS.list(eventId),
    queryFn: async () => {
      const response = await apiClient.get<
        BaseApiResponse<IEventReservation[]>
      >(ENDPOINTS.EVENT_RESERVATION.GET_ALL(eventId));
      return response.data;
    },
    enabled: !!eventId,
  });

// Create a reservation
export const useCreateEventReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    BaseApiResponse<IEventReservation>,
    BaseError,
    ICreateEventReservationDto
  >({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseApiResponse<IEventReservation>>(
        ENDPOINTS.EVENT_RESERVATION.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Reservation created successfully.");
      queryClient.invalidateQueries({
        queryKey: EVENT_RESERVATION_QUERY_KEYS.list(variables.event_id),
      });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create reservation."
      );
    },
  });
};

// Update a reservation
export const useUpdateEventReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    BaseApiResponse<IEventReservation>,
    BaseError,
    { reservationId: string; data: IUpdateEventReservationDto }
  >({
    mutationFn: async ({ reservationId, data }) => {
      const response = await apiClient.patch<
        BaseApiResponse<IEventReservation>
      >(ENDPOINTS.EVENT_RESERVATION.UPDATE(reservationId), data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Reservation updated successfully.");
      queryClient.invalidateQueries({
        queryKey: EVENT_RESERVATION_QUERY_KEYS.detail(variables.reservationId),
      });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update reservation."
      );
    },
  });
};

// Delete a reservation
export const useDeleteEventReservation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    BaseApiResponse<null>,
    BaseError,
    { reservationId: string; eventId: string }
  >({
    mutationFn: async ({ reservationId }) => {
      const response = await apiClient.delete<BaseApiResponse<null>>(
        ENDPOINTS.EVENT_RESERVATION.DELETE(reservationId)
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Reservation deleted successfully.");
      queryClient.invalidateQueries({
        queryKey: EVENT_RESERVATION_QUERY_KEYS.list(variables.eventId),
      });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete reservation."
      );
    },
  });
};
