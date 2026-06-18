import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import type { BaseApiResponse } from "@/types/api";

export interface ClubManagement {
  id: string;
  businessId: string;
  name: string;
  description: string;
  capacity: number;
  theme: string;
  amenities: string[];
  features: string[];
  tables_available: number;
  operatingHours: {
    day: string;
    open: string;
    close: string;
  }[];
  policies: {
    dressCode: string;
    ageRestriction: number;
    guestListPolicy: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClubReservationDto {
  number_of_individuals: number;
  visitation_date: string; // dd-MM-YYYY format
  visitation_time: string; // hh:mm a format
  business_id: string;
  ticket_type_id: string;
  guest_size_id: string;
}

export interface AdminBusinessReservationClubDto {
  id: string;
  reservation_id: string;
  type: string;
  status: string;
  entry_time: string;
  no_of_guests: number;
  amount: number;
  payment_status: number | string;
  createdAt: string;
  business: Record<string, unknown>;
  user: Record<string, unknown>;
}

export type ClubReservation = AdminBusinessReservationClubDto;

export const createClubApi = () => {
  return {
    // ===== CLUB MANAGEMENT HOOKS =====

    useGetClubManagement: () =>
      useQuery({
        queryKey: ["clubManagement"],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<ClubManagement[]>
          >(ENDPOINTS.CLUB.MANAGEMENT);
          // Handle array response - get first item or null
          const data = response.data.data;
          return Array.isArray(data) ? data[0] : data;
        },
      }),

    useUpdateClubManagement: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (payload: Partial<ClubManagement>) => {
          const response = await apiClient.patch<
            BaseApiResponse<ClubManagement>
          >(ENDPOINTS.CLUB.MANAGEMENT_UPDATE(payload.id || ""), payload);
          return response.data.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["clubManagement"] });
          toast.success("Club information updated successfully");
        },
        onError: () => {
          toast.error("Failed to update club information");
        },
      });
    },

    useDeleteClubManagement: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (id: string) => {
          await apiClient.delete(ENDPOINTS.CLUB.MANAGEMENT_DELETE(id));
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["clubManagement"] });
          toast.success("Club deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete club");
        },
      });
    },

    // ===== CLUB RESERVATIONS HOOKS =====

    useCreateReservation: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (payload: CreateClubReservationDto) => {
          const response = await apiClient.post<
            BaseApiResponse<ClubReservation>
          >(ENDPOINTS.CLUB.RESERVATIONS_CREATE, payload);
          return response.data.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["clubReservations"] });
          toast.success("Reservation created successfully");
        },
        onError: () => {
          toast.error("Failed to create reservation");
        },
      });
    },

    useGetReservations: () =>
      useQuery({
        queryKey: ["clubReservations"],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<ClubReservation[]>
          >(ENDPOINTS.CLUB.RESERVATIONS_GET_ALL);
          return response.data.data;
        },
      }),

    useGetReservation: (id: string) =>
      useQuery({
        queryKey: ["clubReservation", id],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<ClubReservation>
          >(ENDPOINTS.CLUB.RESERVATIONS_GET_ONE(id));
          return response.data.data;
        },
        enabled: !!id,
      }),

    useVerifyReservationPayment: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (referenceId: string) => {
          const response = await apiClient.post<
            BaseApiResponse<ClubReservation>
          >(ENDPOINTS.CLUB.RESERVATIONS_VERIFY_PAYMENT(referenceId), {});
          return response.data.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["clubReservations"] });
          toast.success("Payment verified successfully");
        },
        onError: () => {
          toast.error("Payment verification failed");
        },
      });
    },
  };
};

export const ClubApi = createClubApi();
