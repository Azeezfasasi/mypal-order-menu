import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export interface Occasion {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOccasionDto {
  name: string;
}

export interface UpdateOccasionDto {
  name: string;
}

export const createOccasionsApi = () => {
  const QUERY_KEY = ["occasions"] as const;

  return {
    // Fetch all occasions for the business
    useGetBusinessOccasions: () =>
      useQuery<BaseApiResponse<Occasion[]>>({
        queryKey: QUERY_KEY,
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<Occasion[]>>(
            ENDPOINTS.OCCASIONS.GET_ALL,
          );
          return response.data;
        },
      }),

      // Create a new occasion
    useCreateOccasion: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<Occasion>, CreateOccasionDto>({
        mutationFn: async (data) => {
          const response = await apiClient.post<BaseApiResponse<Occasion>>(
            ENDPOINTS.OCCASIONS.CREATE,
            data,
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Occasion created");
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: (err) => {
          console.error("Failed to create occasion", err);
          toast.error("Failed to create occasion");
        },
      });
    },

    // Update an existing occasion
    useUpdateOccasion: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<Occasion>,
        { id: string; data: UpdateOccasionDto }
      >({
        mutationFn: async ({ id, data }) => {
          const response = await apiClient.put<BaseApiResponse<Occasion>>(
            ENDPOINTS.OCCASIONS.UPDATE(id),
            data,
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Occasion updated");
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: (err) => {
          console.error("Failed to update occasion", err);
          toast.error("Failed to update occasion");
        },
      });
    },

    // Delete an occasion
    useDeleteOccasion: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (id) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.OCCASIONS.DELETE(id),
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Occasion deleted");
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: (err) => {
          console.error("Failed to delete occasion", err);
          toast.error("Failed to delete occasion");
        },
      });
    },
  };
};

export const OccasionsApi = createOccasionsApi();
