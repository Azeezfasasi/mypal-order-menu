// business-contract-api.ts

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  IBusinessContract,
  IContractTemplate,
  ICreateOrUpdateBusinessContractDto,
} from "../../types/contract-types";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// This API service provides hooks for managing business contracts, including fetching the current contract, fetching contract templates, creating/updating contracts, and submitting contracts for approval. Each hook uses React Query for data fetching and mutation, ensuring efficient state management and automatic cache updates.
export const createBusinessContractApi = () => {
  return {

    // Fetch the current business contract for the logged-in user
    useGetMyContract: () =>
      useQuery<BaseApiResponse<IBusinessContract>>({
        queryKey: ["business-contract-my"],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.BUSINESS_CONTRACTS.GET,
          );
          return response.data;
        },
        staleTime: 0,
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnMount: true,
      }),

    // Fetch the contract template that businesses can use to create or update their contracts
    useGetContractTemplate: () =>
      useQuery<BaseApiResponse<IContractTemplate>>({
        queryKey: ["business-contract-template"],
        queryFn: async () => {
          const response = await apiClient.get(
            ENDPOINTS.BUSINESS_CONTRACTS.GET_TEMPLATE,
          );
          return response.data;
        },
      }),

    // Create or update a business contract with the provided data. This mutation will invalidate the "business-contract-my" query to ensure the UI reflects the latest contract information after a successful operation.
    useCreateOrUpdateContract: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessContract>,
        ICreateOrUpdateBusinessContractDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post(
            ENDPOINTS.BUSINESS_CONTRACTS.CREATE_OR_UPDATE,
            data,
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["business-contract-my"] });
        },
      });
    },

    // Update an existing business contract with the provided data. Similar to the create/update mutation, this will also invalidate the "business-contract-my" query to keep the UI in sync with the latest contract information.
    useUpdateContract: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessContract>,
        Partial<ICreateOrUpdateBusinessContractDto>
      >({
        mutationFn: async (data) => {
          const response = await apiClient.patch(
            ENDPOINTS.BUSINESS_CONTRACTS.UPDATE,
            data,
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["business-contract-my"] });
        },
      });
    },

    // Submit the current business contract for approval. This mutation will also invalidate the "business-contract-my" query to ensure the UI reflects the updated contract status after submission.
    useSubmitContract: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<IBusinessContract>, void>({
        mutationFn: async () => {
          const response = await apiClient.post(
            ENDPOINTS.BUSINESS_CONTRACTS.SUBMIT,
            {},
          );
          return response.data;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["business-contract-my"] });
        },
      });
    },
  };
};

export type BusinessContractApi = ReturnType<typeof createBusinessContractApi>;
