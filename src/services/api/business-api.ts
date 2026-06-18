// src/services/api/business-api.ts (Example file name)

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import type { IBusiness } from "@/types/auth-types";
import type { UpdateBusinessBankRequest } from "@/types/business-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BUSINESS_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ==================================
// Business API Hooks Factory
// ==================================
export const createBusinessApi = () => {
  return {
    // Example: Hook to get current business details (if needed)
    useGetCurrentBusiness: () =>
      useQuery<BaseApiResponse<IBusiness>>({
        queryKey: BUSINESS_QUERY_KEYS.current(),
        queryFn: async () => {
          // Fetch current authenticated business details
          const response = await apiClient.get<BaseApiResponse<IBusiness>>(
            ENDPOINTS.BUSINESS.ME,
          );
          return response.data;
        },
      }),

    useUpdateBusinessBank: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusiness>, // Expects updated IBusiness in response
        UpdateBusinessBankRequest // Input payload type
      >({
        mutationFn: async (bankData) => {
          const response = await apiClient.patch<BaseApiResponse<IBusiness>>(
            ENDPOINTS.BUSINESS.UPDATE_BANK,
            bankData,
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Bank details updated successfully.");
          // Invalidate query for current business details to refetch
          queryClient.invalidateQueries({
            queryKey: BUSINESS_QUERY_KEYS.current(),
          });
        },
        onError: (error) => {
          console.error("Failed to update bank details:", error);
        },
      });
    },
  };
};

// Export Instance
export const BusinessApi = createBusinessApi();
