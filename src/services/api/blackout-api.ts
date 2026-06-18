// src/services/api/business-schedule-api.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import type { BaseApiResponse } from "@/types/api";
import { ENDPOINTS } from "./endpoints";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { toast } from "sonner";

// Define types for blackout days
export interface IBlackoutDay {
  id: string;
  date: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Request payload for creating a blackout day
export interface CreateBlackoutDayRequest {
  date: string | Date; // Format: "DD-MM"
  reason: string;
}

// Request payload for updating a blackout day
export interface UpdateBlackoutDayRequest {
  id: string;
  date?: string;
  reason?: string;
}

const BLACKOUT_DAYS_QUERY_KEYS = {
  all: ["blackoutDays"] as const,
  lists: () => [...BLACKOUT_DAYS_QUERY_KEYS.all, "list"] as const,
  // Specific list for business
  businessList: () => ["businessBlackoutDays"] as const, // Matches current usage
  details: () => [...BLACKOUT_DAYS_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...BLACKOUT_DAYS_QUERY_KEYS.details(), id] as const,
};

// ==================================
// Blackout Days API
// ==================================
export const createBusinessBlackoutApi = () => {
  // Blackout Days API hooks
  return {
    // --- Queries ---
    useGetAllBlackoutDays: () =>
      useQuery<BaseApiResponse<IBlackoutDay[]>>({
        queryKey: ["blackoutDays"], // Or BLACKOUT_DAYS_QUERY_KEYS.all
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<IBlackoutDay[]>>(
            ENDPOINTS.BLACKOUT_DAYS.GET_ALL
          );
          return response.data;
        },
      }),

    useGetBusinessBlackoutDays: () =>
      useQuery<BaseApiResponse<IBlackoutDay[]>>({
        queryKey: BLACKOUT_DAYS_QUERY_KEYS.businessList(), // Use constant
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<IBlackoutDay[]>>(
            ENDPOINTS.BLACKOUT_DAYS.BUSINESS_BLACKOUT
          );
          return response.data;
        },
      }),

    useGetBlackoutDay: (blackoutId: string) =>
      useQuery<BaseApiResponse<IBlackoutDay>>({
        queryKey: BLACKOUT_DAYS_QUERY_KEYS.detail(blackoutId), // Use constant
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<IBlackoutDay>>(
            ENDPOINTS.BLACKOUT_DAYS.GET_ONE(blackoutId)
          );
          return response.data;
        },
        enabled: !!blackoutId,
      }),

    // --- Mutations ---
    useCreateBlackoutDay: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBlackoutDay>,
        CreateBlackoutDayRequest
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post<BaseApiResponse<IBlackoutDay>>(
            ENDPOINTS.BLACKOUT_DAYS.CREATE,
            data
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Blackout day created successfully");
          // Invalidate the relevant list query
          queryClient.invalidateQueries({
            queryKey: BLACKOUT_DAYS_QUERY_KEYS.businessList(),
          });
          // Optional: Invalidate general list
          // queryClient.invalidateQueries({ queryKey: ["blackoutDays"] });
        },
        onError: (error) => {
          toast.error("Failed to create blackout day", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },

    useUpdateBlackoutDay: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBlackoutDay>,
        UpdateBlackoutDayRequest
      >({
        mutationFn: async (data) => {
          const { id, ...updateData } = data;
          const response = await apiClient.patch<BaseApiResponse<IBlackoutDay>>(
            ENDPOINTS.BLACKOUT_DAYS.UPDATE_BUSINESS_BLACKOUT(id),
            updateData
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(data.message || "Blackout day updated successfully");
          // Invalidate the relevant list query
          queryClient.invalidateQueries({
            queryKey: BLACKOUT_DAYS_QUERY_KEYS.businessList(),
          });
          // Optional: Invalidate specific detail query
          queryClient.invalidateQueries({
            queryKey: BLACKOUT_DAYS_QUERY_KEYS.detail(variables.id),
          });
          // Optional: Invalidate general list
          // queryClient.invalidateQueries({ queryKey: ["blackoutDays"] });
        },
        onError: (error) => {
          toast.error("Failed to update blackout day", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },

    useDeleteBlackoutDay: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<{ data: null }>, string>({
        // string is blackoutId
        mutationFn: async (blackoutId) => {
          const response = await apiClient.delete<
            BaseApiResponse<{ data: null }>
          >(ENDPOINTS.BLACKOUT_DAYS.DELETE_BUSINESS_BLACKOUT(blackoutId));
          return response.data;
        },
        onSuccess: (data, blackoutId) => {
          toast.success(data.message || "Blackout day deleted successfully");
          // Invalidate the relevant list query
          queryClient.invalidateQueries({
            queryKey: BLACKOUT_DAYS_QUERY_KEYS.businessList(),
          });
          // Optional: Also invalidate/remove specific detail query
          queryClient.invalidateQueries({
            queryKey: BLACKOUT_DAYS_QUERY_KEYS.detail(blackoutId),
          });
          // Optional: Invalidate general list
          // queryClient.invalidateQueries({ queryKey: ["blackoutDays"] });
        },
        onError: (error) => {
          toast.error("Failed to delete blackout day", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },
  };
};

// Export the API hooks instance
export const BusinessBlackoutApi = createBusinessBlackoutApi();
