// src/services/api/business-schedule-api.ts
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
import { apiClient } from "./api-client";
import type { BaseApiResponse } from "@/types/api";
import { ENDPOINTS } from "./endpoints";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { toast } from "sonner";

// Define types for operating days
export interface IOperatingDay {
  id: string;
  day: string;
  opening_time: string;
  closing_time: string;
  is_24_hours: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Define types for blackout days
export interface IBlackoutDay {
  id: string;
  date: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Request payload types
export interface CreateOperatingDayRequest {
  day: string;
  opening_time: string;
  closing_time: string;
}
export interface UpdateOperatingDayRequest {
  id: string;
  day?: string;
  opening_time?: string;
  closing_time?: string;
}
export interface CreateBlackoutDayRequest {
  date: string | Date; // Format: "DD-MM"
  reason: string;
}
export interface UpdateBlackoutDayRequest {
  id: string;
  date?: string;
  reason?: string;
}

// Query Keys constants (Good Practice)
const OPERATING_DAYS_QUERY_KEYS = {
  all: ["operatingDays"] as const,
  lists: () => [...OPERATING_DAYS_QUERY_KEYS.all, "list"] as const,
  // Specific list for business
  businessList: () => ["businessOperatingDays"] as const, // Matches current usage
  details: () => [...OPERATING_DAYS_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...OPERATING_DAYS_QUERY_KEYS.details(), id] as const,
};

// ==================================
// Operating Days API
// ==================================
export const createBusinessOperatingDaysApi = () => {
  // Operating Days API hooks
  return {
    // --- Queries ---
    useGetAllOperatingDays: () =>
      useQuery<BaseApiResponse<IOperatingDay[]>>({
        // Use query key constant if switching structure later
        queryKey: ["operatingDays"], // Or OPERATING_DAYS_QUERY_KEYS.all
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IOperatingDay[]>
          >(ENDPOINTS.OPERATING_DAYS.GET_ALL);
          return response.data;
        },
      }),

    useGetBusinessOperatingDays: () =>
      useQuery<BaseApiResponse<IOperatingDay[]>>({
        queryKey: OPERATING_DAYS_QUERY_KEYS.businessList(), // Use constant
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IOperatingDay[]>
          >(ENDPOINTS.OPERATING_DAYS.BUSINESS_OP_DAYS);
          return response.data;
        },
      }),

    useGetOperatingDay: (dayId: string) =>
      useQuery<BaseApiResponse<IOperatingDay>>({
        queryKey: OPERATING_DAYS_QUERY_KEYS.detail(dayId), // Use constant
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<IOperatingDay>>(
            ENDPOINTS.OPERATING_DAYS.GET_ONE(dayId)
          );
          return response.data;
        },
        enabled: !!dayId,
      }),

    // --- Mutations ---
    useCreateOperatingDay: () => {
      const queryClient = useQueryClient(); // Get query client instance
      return useSafeMutation<
        BaseApiResponse<IOperatingDay>,
        CreateOperatingDayRequest
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post<BaseApiResponse<IOperatingDay>>(
            ENDPOINTS.OPERATING_DAYS.CREATE,
            data
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Operating day created successfully");
          // Invalidate the list query after successful creation
          queryClient.invalidateQueries({
            queryKey: OPERATING_DAYS_QUERY_KEYS.businessList(),
          });
          // Optional: Invalidate the general list if used elsewhere
          // queryClient.invalidateQueries({ queryKey: ["operatingDays"] });
        },
        onError: (error) => {
          toast.error("Failed to create operating day", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },

    useUpdateOperatingDay: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IOperatingDay>,
        UpdateOperatingDayRequest
      >({
        mutationFn: async (data) => {
          const { id, ...updateData } = data;
          const response = await apiClient.patch<
            BaseApiResponse<IOperatingDay>
          >(ENDPOINTS.OPERATING_DAYS.UPDATE_BUSINESS_OP_DAYS(id), updateData);
          return response.data;
        },
        onSuccess: (data, variables) => {
          // onSuccess receives data and variables
          toast.success(data.message || "Operating day updated successfully");
          // Invalidate the list query
          queryClient.invalidateQueries({
            queryKey: OPERATING_DAYS_QUERY_KEYS.businessList(),
          });
          // Optional: Invalidate the specific detail query if it exists/is cached
          queryClient.invalidateQueries({
            queryKey: OPERATING_DAYS_QUERY_KEYS.detail(variables.id),
          });
          // Optional: Invalidate the general list if used elsewhere
          // queryClient.invalidateQueries({ queryKey: ["operatingDays"] });
        },
        onError: (error) => {
          toast.error("Failed to update operating day", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },

    useDeleteOperatingDay: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<{ data: null }>, string>({
        // string is the dayId
        mutationFn: async (dayId) => {
          const response = await apiClient.delete<
            BaseApiResponse<{ data: null }>
          >(ENDPOINTS.OPERATING_DAYS.DELETE_BUSINESS_OP_DAYS(dayId));
          return response.data;
        },
        onSuccess: (data, dayId) => {
          // onSuccess receives data and the variable (dayId)
          toast.success(data.message || "Operating day deleted successfully");
          // Invalidate the list query
          queryClient.invalidateQueries({
            queryKey: OPERATING_DAYS_QUERY_KEYS.businessList(),
          });
          // Optional: Also remove/invalidate the specific detail query if cached
          queryClient.invalidateQueries({
            queryKey: OPERATING_DAYS_QUERY_KEYS.detail(dayId),
          });
          // Optional: Invalidate the general list if used elsewhere
          // queryClient.invalidateQueries({ queryKey: ["operatingDays"] });
        },
        onError: (error) => {
          toast.error("Failed to delete operating day", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },
  };
};

// Export the API hooks instance
export const BusinessOperatingDayApi = createBusinessOperatingDaysApi();
