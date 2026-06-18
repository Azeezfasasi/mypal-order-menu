import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "./api/api-client";
import { ENDPOINTS } from "./api/endpoints";

export interface FinediningCuisine {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface CuisineCategory {
  id: string;
  name: string;
}

export const createFinediningCuisineApi = () => {
  const CUISINE_QUERY_KEY = ["finedining-cuisines"];

  return {
    useGetBusinessCuisines: () =>
      useQuery<BaseApiResponse<FinediningCuisine>>({
        queryKey: CUISINE_QUERY_KEY,
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<FinediningCuisine>
          >(ENDPOINTS.FINEDINING_CUISINE.MY);
          return response.data;
        },
      }),

    useGetCuisineCategories: () =>
      useQuery<BaseApiResponse<CuisineCategory[]>>({
        queryKey: ["cuisine-categories"],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<CuisineCategory[]>
          >(ENDPOINTS.FINEDINING_CUISINE.CATEGORIES);
          return response.data;
        },
      }),

    useSelectCuisineCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<FinediningCuisine>,
        { cuisine_category_ids: string[] }
      >({
        mutationFn: async (data) => {
          const response = await apiClient.patch<
            BaseApiResponse<FinediningCuisine>
          >(ENDPOINTS.FINEDINING_CUISINE.SELECT_CATEGORY, data);
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Cuisine updated successfully.");
          queryClient.invalidateQueries({ queryKey: CUISINE_QUERY_KEY });
        },
        onError: (error) => {
          toast.error("Failed to update cuisine.");
          console.error(error);
        },
      });
    },

    useRemoveCuisineCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<null>,
        { cuisine_category_id: string }
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post<BaseApiResponse<null>>(
            ENDPOINTS.FINEDINING_CUISINE.REMOVE_CATEGORY,
            data,
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Cuisine category removed.");
          queryClient.invalidateQueries({ queryKey: CUISINE_QUERY_KEY });
        },
        onError: (error) => {
          toast.error("Failed to remove cuisine category.");
          console.error(error);
        },
      });
    },
  };
};

export const FinediningCuisineApi = createFinediningCuisineApi();
