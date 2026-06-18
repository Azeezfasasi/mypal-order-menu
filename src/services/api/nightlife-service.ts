// nightlife-service.ts
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import type {
  INightlifeReservation,
  ICreateReservationDto,
  IUpdateReservationDto,
  INightlifeEvent,
  ICreateEventDto,
  IUpdateEventDto,
  INightlifeProfile,
  IUpdateProfileDto,
  INightlifeBusiness,
  INightlifeAnalytics,
} from "@/types/nightlife-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ==================================
// Debug Logging Utility
// ==================================
const debugLog = {
  info: (message: string, data?: unknown) => {
    console.log(`🌙 [NIGHTLIFE] ${message}`, data || "");
  },
  error: (message: string, error?: unknown) => {
    console.error(`🌙 [NIGHTLIFE] ❌ ${message}`, error || "");
  },
  success: (message: string, data?: unknown) => {
    console.log(`🌙 [NIGHTLIFE] ✅ ${message}`, data || "");
  },
};

// ==================================
// Nightlife API Query Keys
// ==================================
const NIGHTLIFE_QUERY_KEYS = {
  reservations: () => ["nightlife", "reservations"],
  reservation: (id: string) => ["nightlife", "reservations", id],
  events: () => ["nightlife", "events"],
  event: (id: string) => ["nightlife", "events", id],
  profile: () => ["nightlife", "profile"],
  businesses: () => ["nightlife", "businesses"],
  analytics: () => ["nightlife", "analytics"],
};

// ==================================
// Nightlife API Hooks Factory
// ==================================
export const createNightlifeApi = () => {
  return {
    // Reservation Hooks
    useGetReservations: () =>
      useQuery<BaseApiResponse<INightlifeReservation[]>>({
        queryKey: NIGHTLIFE_QUERY_KEYS.reservations(),
        queryFn: async () => {
          const endpoint = ENDPOINTS.NIGHTLIFE.GET_RESERVATIONS;
          debugLog.info(`Fetching reservations from: ${endpoint}`);
          try {
            const response = await apiClient.get<
              BaseApiResponse<INightlifeReservation[]>
            >(endpoint);
            debugLog.success(`Reservations fetched successfully`, {
              count: response.data?.data?.length || 0,
              response: response.data,
            });
            return response.data;
          } catch (error: unknown) {
            const err = error as { response?: { status?: number; statusText?: string; data?: unknown } } & { message?: string };
            debugLog.error(`Failed to fetch reservations`, {
              status: err.response?.status,
              statusText: err.response?.statusText,
              message: err.message,
              data: err.response?.data,
            });
            throw error;
          }
        },
      }),

    useGetReservation: (id: string) =>
      useQuery<BaseApiResponse<INightlifeReservation>>({
        queryKey: NIGHTLIFE_QUERY_KEYS.reservation(id),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<INightlifeReservation>
          >(ENDPOINTS.NIGHTLIFE.GET_RESERVATION(id));
          return response.data;
        },
      }),

    useReserveBar: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<INightlifeReservation>,
        ICreateReservationDto
      >({
        mutationFn: async (reservationData) => {
          const response = await apiClient.post<
            BaseApiResponse<INightlifeReservation>
          >(ENDPOINTS.NIGHTLIFE.RESERVE_BAR, reservationData);
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(
            response.message || "Bar reservation created successfully!",
          );
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.reservations(),
          });
        },
        onError: (error) => {
          toast.error("Failed to create bar reservation", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    useReserveLounge: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<INightlifeReservation>,
        ICreateReservationDto
      >({
        mutationFn: async (reservationData) => {
          const response = await apiClient.post<
            BaseApiResponse<INightlifeReservation>
          >(ENDPOINTS.NIGHTLIFE.RESERVE_LOUNGE, reservationData);
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(
            response.message || "Lounge reservation created successfully!",
          );
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.reservations(),
          });
        },
        onError: (error) => {
          toast.error("Failed to create lounge reservation", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    useUpdateReservation: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<INightlifeReservation>,
        { id: string; data: IUpdateReservationDto }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.patch<
            BaseApiResponse<INightlifeReservation>
          >(ENDPOINTS.NIGHTLIFE.UPDATE_RESERVATION(id), data);
          return response.data;
        },
        onSuccess: (response, { id }) => {
          toast.success(
            response.message || "Reservation updated successfully!",
          );
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.reservation(id),
          });
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.reservations(),
          });
        },
        onError: (error) => {
          toast.error("Failed to update reservation", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    useDeleteReservation: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.NIGHTLIFE.DELETE_RESERVATION(id),
          );
          return response.data;
        },
        onSuccess: (response, id) => {
          toast.success(
            response.message || "Reservation deleted successfully!",
          );
          queryClient.removeQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.reservation(id),
          });
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.reservations(),
          });
        },
        onError: (error) => {
          toast.error("Failed to delete reservation", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Event Hooks
    useGetEvents: () =>
      useQuery<BaseApiResponse<INightlifeEvent[]>>({
        queryKey: NIGHTLIFE_QUERY_KEYS.events(),
        queryFn: async () => {
          const endpoint = ENDPOINTS.NIGHTLIFE.GET_EVENTS;
          debugLog.info(`Fetching events from: ${endpoint}`);
          try {
            const response = await apiClient.get<
              BaseApiResponse<INightlifeEvent[]>
            >(endpoint);
            debugLog.success(`Events fetched successfully`, {
              count: response.data?.data?.length || 0,
              events: response.data?.data,
            });
            return response.data;
          } catch (error: unknown) {
            const err = error as { response?: { status?: number; statusText?: string; data?: unknown } } & { message?: string };
            debugLog.error(`Failed to fetch events`, {
              status: err.response?.status,
              statusText: err.response?.statusText,
              message: err.message,
              data: err.response?.data,
            });
            throw error;
          }
        },
      }),

    useGetEvent: (id: string) =>
      useQuery<BaseApiResponse<INightlifeEvent>>({
        queryKey: NIGHTLIFE_QUERY_KEYS.event(id),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<INightlifeEvent>
          >(ENDPOINTS.NIGHTLIFE.GET_EVENT(id));
          return response.data;
        },
      }),

    useCreateEvent: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<INightlifeEvent>,
        { eventData: ICreateEventDto; images?: File[] }
      >({
        mutationFn: async ({ eventData, images }) => {
          const formData = new FormData();

          // Append event fields - handle booleans and other types properly
          Object.entries(eventData).forEach(([key, value]) => {
            if (key === "images") return;
            if (value !== undefined && value !== null) {
              // For booleans, convert to lowercase string (true/false)
              if (typeof value === "boolean") {
                formData.append(key, value.toString());
              } else {
                formData.append(key, String(value));
              }
            }
          });

          // Append images if provided
          if (images && images.length > 0) {
            images.forEach((image) => {
              formData.append("images", image);
            });
          }

          console.log("🌙 [NIGHTLIFE] Creating event with FormData:", {
            eventData,
            imagesCount: images?.length || 0,
          });

          const response = await apiClient.post<
            BaseApiResponse<INightlifeEvent>
          >(ENDPOINTS.NIGHTLIFE.CREATE_EVENT, formData);
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Event created successfully!");
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.events(),
          });
        },
        onError: (error) => {
          console.error("🌙 [NIGHTLIFE] Event creation error:", {
            status: error.response?.status,
            message: error.response?.data?.message,
            fullError: error.response?.data,
          });
          toast.error("Failed to create event", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    useUpdateEvent: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<INightlifeEvent>,
        { id: string; eventData: IUpdateEventDto; images?: File[] }
      >({
        mutationFn: async ({ id, eventData, images }) => {
          const formData = new FormData();

          // Append event fields - handle booleans and other types properly
          Object.entries(eventData).forEach(([key, value]) => {
            if (key === "images") return;
            if (value !== undefined && value !== null) {
              // For booleans, convert to lowercase string (true/false)
              if (typeof value === "boolean") {
                formData.append(key, value.toString());
              } else {
                formData.append(key, String(value));
              }
            }
          });

          // Append images if provided
          if (images && images.length > 0) {
            images.forEach((image) => {
              formData.append("images", image);
            });
          }

          const response = await apiClient.patch<
            BaseApiResponse<INightlifeEvent>
          >(ENDPOINTS.NIGHTLIFE.UPDATE_EVENT(id), formData);
          return response.data;
        },
        onSuccess: (response, { id }) => {
          toast.success(response.message || "Event updated successfully!");
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.event(id),
          });
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.events(),
          });
        },
        onError: (error) => {
          console.error("🌙 [NIGHTLIFE] Event update error:", {
            status: error.response?.status,
            message: error.response?.data?.message,
            fullError: error.response?.data,
          });
          toast.error("Failed to update event", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    useDeleteEvent: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.NIGHTLIFE.DELETE_EVENT(id),
          );
          return response.data;
        },
        onSuccess: (response, id) => {
          toast.success(response.message || "Event deleted successfully!");
          queryClient.removeQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.event(id),
          });
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.events(),
          });
        },
        onError: (error) => {
          toast.error("Failed to delete event", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Profile Hooks
    useGetProfile: () =>
      useQuery<BaseApiResponse<INightlifeProfile>>({
        queryKey: NIGHTLIFE_QUERY_KEYS.profile(),
        queryFn: async () => {
          const endpoint = ENDPOINTS.NIGHTLIFE.GET_PROFILE;
          debugLog.info(`Fetching profile from: ${endpoint}`);
          try {
            const response = await apiClient.get<
              BaseApiResponse<INightlifeProfile>
            >(endpoint);
            debugLog.success(`Profile fetched successfully`, {
              profile: response.data?.data,
            });
            return response.data;
          } catch (error: unknown) {
            const err = error as { response?: { status?: number; statusText?: string; data?: unknown } } & { message?: string };
            debugLog.error(`Failed to fetch profile`, {
              status: err.response?.status,
              statusText: err.response?.statusText,
              message: err.message,
              data: err.response?.data,
            });
            throw error;
          }
        },
      }),

    useUpdateProfile: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<INightlifeProfile>,
        IUpdateProfileDto
      >({
        mutationFn: async (profileData) => {
          const response = await apiClient.patch<
            BaseApiResponse<INightlifeProfile>
          >(ENDPOINTS.NIGHTLIFE.UPDATE_PROFILE, profileData);
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Profile updated successfully!");
          queryClient.invalidateQueries({
            queryKey: NIGHTLIFE_QUERY_KEYS.profile(),
          });
        },
        onError: (error) => {
          toast.error("Failed to update profile", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Business Hooks
    useGetBusinesses: () =>
      useQuery<BaseApiResponse<INightlifeBusiness[]>>({
        queryKey: NIGHTLIFE_QUERY_KEYS.businesses(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<INightlifeBusiness[]>
          >(ENDPOINTS.NIGHTLIFE.GET_BUSINESSES);
          return response.data;
        },
      }),

    useGetMyReservations: () =>
      useQuery<BaseApiResponse<INightlifeReservation[]>>({
        queryKey: ["nightlife", "my-reservations"],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<INightlifeReservation[]>
          >(ENDPOINTS.NIGHTLIFE.GET_MY_RESERVATIONS);
          return response.data;
        },
      }),

    // Admin Hooks
    useAdminGetBusinesses: () =>
      useQuery<BaseApiResponse<INightlifeBusiness[]>>({
        queryKey: ["nightlife", "admin", "businesses"],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<INightlifeBusiness[]>
          >(ENDPOINTS.NIGHTLIFE.ADMIN_GET_BUSINESSES);
          return response.data;
        },
      }),

    useAdminApproveBusiness: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<INightlifeBusiness>, string>({
        mutationFn: async (businessId) => {
          const response = await apiClient.post<
            BaseApiResponse<INightlifeBusiness>
          >(ENDPOINTS.NIGHTLIFE.ADMIN_APPROVE_BUSINESS(businessId));
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Business approved successfully!");
          queryClient.invalidateQueries({
            queryKey: ["nightlife", "admin", "businesses"],
          });
        },
        onError: (error) => {
          toast.error("Failed to approve business", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    useAdminGetAnalytics: () =>
      useQuery<BaseApiResponse<INightlifeAnalytics>>({
        queryKey: NIGHTLIFE_QUERY_KEYS.analytics(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<INightlifeAnalytics>
          >(ENDPOINTS.NIGHTLIFE.ADMIN_GET_ANALYTICS);
          return response.data;
        },
      }),

    useAdminDeleteContent: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.NIGHTLIFE.ADMIN_DELETE_CONTENT(id),
          );
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Content deleted successfully!");
          queryClient.invalidateQueries({
            queryKey: ["nightlife", "admin", "businesses"],
          });
        },
        onError: (error) => {
          toast.error("Failed to delete content", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },
  };
};

// Export Instance
export const NightlifeApi = createNightlifeApi();
