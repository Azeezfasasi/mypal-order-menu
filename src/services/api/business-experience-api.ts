// business-experience-api.ts
import type { BaseApiResponse } from "@/types/api"; // Adjust the import path as necessary
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BUSINESS_EXPERIENCE_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client"; // Adjust the import path as necessary
import { ENDPOINTS } from "./endpoints"; // Adjust the import path as necessary

export interface IBusinessExperience {
  id: string; // or number
  experience_name: string; // Assuming the experience has a name/type
}

// Request body for creating a business experience - now uses experience_name
export interface ICreateBusinessExperiencePayload {
  experience_name: string; // New payload expects the experience name
}

// ==================================
// Business Experience API Hooks Factory
// ==================================

export const createBusinessExperienceApi = () => {
  return {
    // Hook to get all general experiences (for selection)
    useGetGeneralExperiences: () =>
      useQuery<BaseApiResponse<IBusinessExperience[]>>({
        queryKey: BUSINESS_EXPERIENCE_QUERY_KEYS.generalLists(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IBusinessExperience[]>
          >(ENDPOINTS.BUSINESS_EXPERIENCE.GENERAL);
          return response.data;
        },
        // Add staleTime to cache the list for a reasonable period
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    // Hook to get business experiences (user's selected experiences)
    useGetBusinessExperiences: () =>
      useQuery<BaseApiResponse<IBusinessExperience[]>>({
        queryKey: BUSINESS_EXPERIENCE_QUERY_KEYS.lists(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IBusinessExperience[]>
          >(ENDPOINTS.BUSINESS_EXPERIENCE.GET_ALL);
          return response.data;
        },
      }),

    // Hook to create a new business experience (now using experience_name)
    useCreateBusinessExperience: () => {
      const queryClient = useQueryClient();

      return useMutation<
        BaseApiResponse<IBusinessExperience>, // Expected response type on success
        Error, // Error type
        ICreateBusinessExperiencePayload // Variables type (input to the mutation)
      >({
        mutationFn: async (payload: ICreateBusinessExperiencePayload) => {
          const response = await apiClient.post<
            BaseApiResponse<IBusinessExperience>
          >(ENDPOINTS.BUSINESS_EXPERIENCE.CREATE, payload);
          return response.data;
        },
        onSuccess: (response) => {
          // Show success toast with the API response message
          toast.success(response.message || "Experience added successfully!");
          // Invalidate query to refresh the list
          queryClient.invalidateQueries({
            queryKey: BUSINESS_EXPERIENCE_QUERY_KEYS.lists(),
          });
        },
        onError: (error) => {
          // Show error toast with the API error message
          toast.error("Failed to add experience", {
            description: error.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to update a business experience by ID
    useUpdateBusinessExperience: () => {
      const queryClient = useQueryClient();

      return useMutation<
        BaseApiResponse<IBusinessExperience>, // Expected response type on success
        Error, // Error type
        { experience_id: string | number; experience_name: string } // Variables type
      >({
        mutationFn: async ({ experience_id, experience_name }) => {
          const response = await apiClient.patch<
            BaseApiResponse<IBusinessExperience>
          >(ENDPOINTS.BUSINESS_EXPERIENCE.UPDATE(experience_id), {
            experience_name,
          });
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Experience updated successfully!");
          queryClient.invalidateQueries({
            queryKey: BUSINESS_EXPERIENCE_QUERY_KEYS.lists(),
          });
        },
        onError: (error) => {
          toast.error("Failed to update experience", {
            description: error.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to delete a business experience by ID
    useDeleteBusinessExperience: () => {
      const queryClient = useQueryClient();

      return useMutation<
        BaseApiResponse<null>, // Assuming delete returns success with no data
        Error, // Error type
        string | number // Variables type (the ID to delete)
      >({
        mutationFn: async (experienceId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.BUSINESS_EXPERIENCE.DELETE(experienceId),
          );
          return response.data;
        },
        onSuccess: (response) => {
          // Show success toast with the API response message
          toast.success(response.message || "Experience deleted successfully!");
          // Invalidate query to refresh the list
          queryClient.invalidateQueries({
            queryKey: BUSINESS_EXPERIENCE_QUERY_KEYS.lists(),
          });
        },
        onError: (error) => {
          // Show error toast with the API error message
          toast.error("Failed to delete experience", {
            description: error.message || "An unexpected error occurred",
          });
        },
      });
    },
  };
};

// Export Instance
export const BusinessExperienceApi = createBusinessExperienceApi();
