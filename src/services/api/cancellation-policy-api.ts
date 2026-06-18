import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export interface CancellationRule {
  timeframe: string;
  cancellationFee?: string;
  refundPercentage?: number;
  sortOrder?: number;
}

export interface CancellationPolicy {
  id: string;
  title: string;
  description: string;
  rules: CancellationRule[];
  created_at?: string;
  updated_at?: string;
}

// DTOs for requests
export interface CreateCancellationPolicyDto {
  title: string;
  description?: string;
  rules: CancellationRule[];
}

export type UpdateCancellationPolicyDto = CreateCancellationPolicyDto;

export const createCancellationPolicyApi = () => {
  const QUERY_KEY = ["cancellation-policies"] as const;

  return {
    useGetBusinessCancellationPolicies: () =>
      useQuery<BaseApiResponse<CancellationPolicy[]>>({
        queryKey: QUERY_KEY,
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<CancellationPolicy[]>
          >(ENDPOINTS.CANCELLATION_POLICIES.GET_ALL);
          return response.data;
        },
      }),

    useGetCancellationPolicyById: (id: string) =>
      useQuery<BaseApiResponse<CancellationPolicy>>({
        queryKey: [...QUERY_KEY, id],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<CancellationPolicy>
          >(ENDPOINTS.CANCELLATION_POLICIES.GET_ONE(id));
          return response.data;
        },
        enabled: !!id,
      }),

    useCreateCancellationPolicy: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<CancellationPolicy>,
        CreateCancellationPolicyDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<CancellationPolicy>
          >(ENDPOINTS.CANCELLATION_POLICIES.CREATE, data);
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Cancellation policy created");
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: (err) => {
          console.error("Failed to create cancellation policy", err);
          toast.error("Failed to create cancellation policy");
        },
      });
    },

    useUpdateCancellationPolicy: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<CancellationPolicy>,
        { id: string; data: UpdateCancellationPolicyDto }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.put<
            BaseApiResponse<CancellationPolicy>
          >(ENDPOINTS.CANCELLATION_POLICIES.UPDATE(id), data);
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Cancellation policy updated");
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: (err) => {
          console.error("Failed to update cancellation policy", err);
          toast.error("Failed to update cancellation policy");
        },
      });
    },

    useDeleteCancellationPolicy: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.CANCELLATION_POLICIES.DELETE(id),
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Cancellation policy deleted");
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: (err) => {
          console.error("Failed to delete cancellation policy", err);
          toast.error("Failed to delete cancellation policy");
        },
      });
    },
  };
};

export const CancellationPolicyApi = createCancellationPolicyApi();
