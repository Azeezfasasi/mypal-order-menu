// src/services/api/business-transaction-api.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import type { BaseApiResponse } from "@/types/api";
import { ENDPOINTS } from "./endpoints";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { toast } from "sonner";
import { TRANSACTION_QUERY_KEYS } from "../query-keys";
import type {
  ITransactionInformation,
  CreateTransactionInformationDto,
  UpdateDiscountDto,
  TransactionInformationType,
} from "@/types/transaction-info-types";

// ==================================
// Transaction Information API Hooks Factory
// ==================================

export const createTransactionInformationApi = () => {
  return {
    // Admin endpoints
    useCreateCharge: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<ITransactionInformation>,
        CreateTransactionInformationDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<ITransactionInformation>
          >(ENDPOINTS.TRANSACTION_SETTINGS.CREATE, data);
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Charge type created successfully.");
          queryClient.invalidateQueries({
            queryKey: TRANSACTION_QUERY_KEYS.list(),
          });
        },
        onError: (error) => {
          console.error("Failed to create charge type:", error);
        },
      });
    },

    // Get all available charges (admin created)
    useGetAllCharges: () =>
      useQuery<BaseApiResponse<ITransactionInformation[]>>({
        queryKey: TRANSACTION_QUERY_KEYS.list(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<ITransactionInformation[]>
          >(ENDPOINTS.TRANSACTION_SETTINGS.GET_ALL);
          return response.data;
        },
      }),

    // Business endpoints
    useGetBusinessCharges: () =>
      useQuery<BaseApiResponse<ITransactionInformation[]>>({
        queryKey: TRANSACTION_QUERY_KEYS.businessCharges(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<ITransactionInformation[]>
          >(ENDPOINTS.TRANSACTION_SETTINGS.BUSINESS_CHARGES);
          return response.data;
        },
      }),

    useUpdateBusinessDiscount: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<ITransactionInformation>,
        UpdateDiscountDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.patch<
            BaseApiResponse<ITransactionInformation>
          >(ENDPOINTS.TRANSACTION_SETTINGS.UPDATE_BUSINESS_DISCOUNT, data);
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Discount updated successfully.");
          queryClient.invalidateQueries({
            queryKey: TRANSACTION_QUERY_KEYS.businessCharges(),
          });
        },
        onError: (error) => {
          console.error("Failed to update business discount:", error);
        },
      });
    },

    useToggleBusinessChargeStatus: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<ITransactionInformation>,
        { chargeId?: string; type?: string }
      >({
        mutationFn: async (data) => {
          const response = await apiClient.patch<
            BaseApiResponse<ITransactionInformation>
          >(ENDPOINTS.TRANSACTION_SETTINGS.TOGGLE_BUSINESS_CHARGE, data);
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Charge status updated successfully.");
          queryClient.invalidateQueries({
            queryKey: TRANSACTION_QUERY_KEYS.businessCharges(),
          });
        },
        onError: (error) => {
          console.error("Failed to toggle charge status:", error);
        },
      });
    },

    useUpdateBusinessChargePercentage: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<ITransactionInformation>,
        { type: TransactionInformationType; percentage: number; isInclusive?: boolean }
      >({
        mutationFn: async (data) => {
          const response = await apiClient.patch<
            BaseApiResponse<ITransactionInformation>
          >(ENDPOINTS.TRANSACTION_SETTINGS.UPDATE_USER_CHARGE, {
            chargeType: data.type,
            percentage: data.percentage,
            isInclusive: data.isInclusive,
          });
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(
            data.message || "Charge percentage updated successfully."
          );
          queryClient.invalidateQueries({
            queryKey: TRANSACTION_QUERY_KEYS.businessCharges(),
          });
        },
        onError: (error) => {
          console.error("Failed to update business charge percentage:", error);
        },
      });
    },

    useToggleBusinessChargePricingMode: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<ITransactionInformation>,
        { type: TransactionInformationType; isInclusive: boolean }
      >({
        mutationFn: async (data) => {
          const response = await apiClient.patch<
            BaseApiResponse<ITransactionInformation>
          >(ENDPOINTS.TRANSACTION_SETTINGS.UPDATE_USER_CHARGE, {
            chargeType: data.type,
            isInclusive: data.isInclusive,
          });
          return response.data;
        },
        onSuccess: (data) => {
          const mode = data.data?.isInclusive ? "inclusive" : "exclusive";
          toast.success(
            data.message || `Pricing mode set to ${mode} successfully.`
          );
          queryClient.invalidateQueries({
            queryKey: TRANSACTION_QUERY_KEYS.businessCharges(),
          });
        },
        onError: (error) => {
          console.error("Failed to toggle pricing mode:", error);
        },
      });
    },
  };
};

// Export Instance
export const TransactionInformationApi = createTransactionInformationApi();
