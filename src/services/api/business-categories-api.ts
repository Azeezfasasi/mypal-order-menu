// src/services/api/business-categories-api.ts
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { SERVICE_OFFERING_QUERY_KEYS } from "@/services/query-keys";
import type { BaseApiResponse } from "@/types/api";
import type { IBusiness } from "@/types/auth-types";
import { BusinessCategoryType } from "@/types/enums";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// Define types for a business category
export interface IBusinessCategory {
  id: string;
  business_type: BusinessCategoryType;
  image_url: string;
  name?: string;
  is_active?: boolean;
}

// Request payload for creating a category
export interface CreateBusinessCategoryRequest {
  business_type: string;
  image?: File;
}

// Request payload for updating a category
export interface UpdateBusinessCategoryRequest {
  id: string;
  business_type?: string;
  image?: File;
}

export const createBusinessCategoriesApi = () => {
  return {
    // GET_ALL: fetch all business categories
    useGetAllCategories: () =>
      useQuery<BaseApiResponse<IBusinessCategory[]>>({
        queryKey: ["businessCategories"],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IBusinessCategory[]>
          >(ENDPOINTS.BUSINESS_CATEGORIES.GET_ALL);
          return response.data;
        },
      }),

    // CREATE: create a new business category
    useCreateCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessCategory>,
        CreateBusinessCategoryRequest
      >({
        mutationFn: async (data) => {
          if (data.image) {
            const formData = new FormData();
            formData.append("business_type", data.business_type);
            formData.append("image", data.image);
            const response = await apiClient.post<
              BaseApiResponse<IBusinessCategory>
            >(ENDPOINTS.BUSINESS_CATEGORIES.CREATE, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data;
          } else {
            const response = await apiClient.post<
              BaseApiResponse<IBusinessCategory>
            >(ENDPOINTS.BUSINESS_CATEGORIES.CREATE, {
              business_type: data.business_type,
            });
            return response.data;
          }
        },
        onSuccess: (data) => {
          // Refresh categories and service-offering caches
          queryClient.invalidateQueries({ queryKey: ["businessCategories"] });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.all,
          });
          toast.success(data.message || "Category created successfully");
        },
        onError: (error) => {
          toast.error("Category creation failed", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },

    // UPDATE: update an existing business category
    useUpdateCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessCategory>,
        UpdateBusinessCategoryRequest
      >({
        mutationFn: async (data) => {
          const { id, business_type, image } = data;
          let response;
          if (image) {
            const formData = new FormData();
            if (business_type) formData.append("business_type", business_type);
            formData.append("image", image);
            response = await apiClient.put<BaseApiResponse<IBusinessCategory>>(
              ENDPOINTS.BUSINESS_CATEGORIES.UPDATE(id),
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              },
            );
          } else {
            response = await apiClient.put<BaseApiResponse<IBusinessCategory>>(
              ENDPOINTS.BUSINESS_CATEGORIES.UPDATE(id),
              { business_type },
            );
          }
          return response.data;
        },
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["businessCategories"] });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.all,
          });
          toast.success(data.message || "Category updated successfully");
        },
        onError: (error) => {
          toast.error("Category update failed", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },

    // DELETE: delete a business category
    useDeleteCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation({
        mutationFn: async (id: string) => {
          const response = await apiClient.delete<
            BaseApiResponse<IBusinessCategory>
          >(ENDPOINTS.BUSINESS_CATEGORIES.DELETE(id));
          return response.data;
        },
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["businessCategories"] });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.all,
          });
          toast.success(data.message || "Category deleted successfully");
        },
        onError: (error) => {
          toast.error("Category deletion failed", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },

    // GET_CATEGORY_BUSINESS: fetch businesses for a given category
    useGetCategoryBusiness: (categoryId: string | number) =>
      useQuery<BaseApiResponse<IBusiness>>({
        queryKey: ["categoryBusiness", categoryId],
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<IBusiness>>(
            ENDPOINTS.BUSINESS_CATEGORIES.GET_CATEGORY_BUSINESS(categoryId),
          );
          return response.data;
        },
      }),
  };
};

// Export the API hooks instance
export const BusinessCategoriesApi = createBusinessCategoriesApi();
