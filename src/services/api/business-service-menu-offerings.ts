// service-offering-api.ts
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import type {
  ICreateServiceCategoryDto,
  ICreateServiceItemDto,
  IServiceCategory,
  IServiceItem,
  IUpdateServiceCategoryDto,
  IUpdateServiceItemDto,
} from "@/types/service-offering-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SERVICE_OFFERING_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { BusinessCategoryType } from "@/types/enums";

// ==================================
// Service Offering API Hooks Factory
// ==================================

// Helper function to get the correct endpoint based on business category
const getMenusEndpoint = (businessCategory?: string): string => {
  console.log("🔍 [getMenusEndpoint] Called with businessCategory:", businessCategory);
  
  if (!businessCategory) {
    console.log("🔍 [getMenusEndpoint] No category provided, using generic endpoint");
    return ENDPOINTS.SERVICE_OFFERING.GET_BUSINESS_MENUS;
  }
  
  // Map business category to correct endpoint
  if (businessCategory === BusinessCategoryType.FINEDINING) {
    console.log("🔍 [getMenusEndpoint] Matched FINEDINING, using:", ENDPOINTS.FINE_DINING_MENU.GET_BUSINESS_MENUS);
    return ENDPOINTS.FINE_DINING_MENU.GET_BUSINESS_MENUS;
  }
  
  console.log("🔍 [getMenusEndpoint] No specific match, using generic endpoint");
  return ENDPOINTS.SERVICE_OFFERING.GET_BUSINESS_MENUS;
};

export const createServiceOfferingApi = () => {
  return {
    // Category hooks
    useBusinessMenus: (businessCategory?: string) =>
      useQuery<BaseApiResponse<IServiceCategory[]>>({
        queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(businessCategory),
        queryFn: async () => {
          const url = getMenusEndpoint(businessCategory);
          
          const response = await apiClient.get<
            BaseApiResponse<IServiceCategory[]>
          >(url);
          
          // Diagnostic logging
          console.log("📡 [API FETCH] Business menus response:", {
            businessCategory: businessCategory || "all",
            endpoint: url,
            totalCategories: response.data.data?.length || 0,
            categories: response.data.data?.map(c => ({
              id: c.id,
              name: c.name,
              serviceType: c.serviceType,
              category_type: c.category_type,
              itemsCount: c.items?.length || 0,
              subCategoriesCount: c.subCategories?.length || 0,
            })) || []
          });
          
          // Special logging for special offers
          const specialOffers = response.data.data?.find(c => c.category_type === "special_offer");
          if (specialOffers) {
            console.log("🎯 [API FETCH] Special Offers category:", {
              id: specialOffers.id,
              name: specialOffers.name,
              itemsCount: specialOffers.items?.length || 0,
              items: specialOffers.items || [],
            });
          } else {
            console.log("🎯 [API FETCH] No Special Offers category found in response");
          }
          
          return response.data;
        },
      }),

    // Hook to create a new service category
    useCreateCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IServiceCategory>,
        ICreateServiceCategoryDto
      >({
        mutationFn: async (categoryData: ICreateServiceCategoryDto) => {
          const response = await apiClient.post<
            BaseApiResponse<IServiceCategory>
          >(ENDPOINTS.SERVICE_OFFERING.CREATE_CATEGORY, categoryData);
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Category created successfully!");
          // Invalidate business menus to refresh the category list
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
        },
        onError: (error) => {
          toast.error("Failed to create category", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to create a new service category with image
    useCreateCategoryWithImage: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<IServiceCategory>, FormData>({
        mutationFn: async (formData: FormData) => {
          const response = await apiClient.post<
            BaseApiResponse<IServiceCategory>
          >(ENDPOINTS.SERVICE_OFFERING.CREATE_CATEGORY, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 120000,
          });
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Category created successfully!");
          // Invalidate business menus to refresh the category list
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
        },
        onError: (error) => {
          toast.error("Failed to create category", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to create a default service category
    useCreateDefaultCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IServiceCategory>,
        ICreateServiceCategoryDto
      >({
        mutationFn: async (categoryData: ICreateServiceCategoryDto) => {
          const response = await apiClient.post<
            BaseApiResponse<IServiceCategory>
          >(ENDPOINTS.SERVICE_OFFERING.CREATE_DEFAULT_CATEGORY, categoryData);
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(
            response.message || "Default category created successfully!",
          );
          // Invalidate business menus to refresh the category list
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
        },
        onError: (error) => {
          toast.error("Failed to create default category", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to update a service category
    useUpdateCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IServiceCategory>,
        { categoryId: string; data: IUpdateServiceCategoryDto | FormData }
      >({
        mutationFn: async ({ categoryId, data }) => {
          console.log("update data", data);

          // Check if data is FormData (for image uploads) or regular object
          const isFormData = data instanceof FormData;

          const response = await apiClient.patch<
            BaseApiResponse<IServiceCategory>
          >(
            ENDPOINTS.SERVICE_OFFERING.UPDATE_CATEGORY(categoryId),
            data,
            // Add headers for FormData
            isFormData
              ? {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              : undefined,
          );
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Category updated successfully!");
          // Invalidate business menus to refresh the updated category
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
        },
        onError: (error) => {
          toast.error("Failed to update category", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to delete a service category
    useDeleteCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (categoryId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.SERVICE_OFFERING.DELETE_CATEGORY(categoryId),
          );
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Category deleted successfully!");
          // Invalidate business menus to refresh after deletion
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
        },
        onError: (error) => {
          toast.error("Failed to delete category", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Service Item hooks
    useCreateServiceItem: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IServiceItem>,
        {
          itemData: ICreateServiceItemDto;
          images?: File[];
          background_image?: File;
        }
      >({
        mutationFn: async ({ itemData, images, background_image }) => {
          // Handle numeric conversion if needed
          const processedItemData = { ...itemData };
          if (typeof processedItemData.price === "string") {
            processedItemData.price = parseFloat(processedItemData.price);
          }

          // If no images, send as JSON to preserve numeric types for quantityOptions
          const hasImages = (images && images.length > 0) || background_image;
          if (!hasImages) {
            const response = await apiClient.post<BaseApiResponse<IServiceItem>>(
              ENDPOINTS.SERVICE_OFFERING.CREATE_SERVICE_ITEM,
              processedItemData,
              {
                timeout: 120000,
              },
            );
            return response.data;
          }

          // Create FormData only when there are images to upload
          const formData = new FormData();

          console.log("[DEBUG] processedItemData keys:", Object.keys(processedItemData));

          // Exclude images from itemData to prevent duplicate entries
          // Append all fields except images/background_image
          Object.entries(processedItemData).forEach(([key, value]) => {
            if (key === "images" || key === "background_image") return;
            if (key === "mealDetail" && value && typeof value === "object") {
              Object.entries(value).forEach(([mealKey, mealValue]) => {
                if (mealValue !== undefined) {
                  formData.append(`mealDetail[${mealKey}]`, String(mealValue));
                }
              });
            } else if (
              key === "quantityOptions" &&
              Array.isArray(value) &&
              value.length > 0
            ) {
              // Send quantityOptions as stringified JSON with numeric types preserved
              // The backend middleware will parse this JSON string back to an object
              const stringified = JSON.stringify(value);
              formData.append(key, stringified);
              console.log("[DEBUG] Appending quantityOptions as JSON string:", stringified);
            } else if (value !== undefined && key !== "mealDetail" && key !== "quantityOptions") {
              formData.append(key, String(value));
            }
          });

          // Append images array if provided
          if (images && images.length > 0) {
            images.forEach((image) => {
              formData.append("images", image);
            });
          }

          if (background_image) {
            formData.append("background_image", background_image);
          }

          const response = await apiClient.post<BaseApiResponse<IServiceItem>>(
            ENDPOINTS.SERVICE_OFFERING.CREATE_SERVICE_ITEM,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 120000,
            },
          );
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(
            response.message || "Service item created successfully!",
          );
          // Invalidate business menus to refresh the category with new item
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
          // Also invalidate service items queries
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.serviceItems(),
          });
        },
        onError: (error) => {
          toast.error("Failed to create service item", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to update a service item
    useUpdateServiceItem: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IServiceItem>,
        { itemId: string; itemData: IUpdateServiceItemDto; images?: File[] }
      >({
        mutationFn: async ({ itemId, itemData, images }) => {
          // Check if we need FormData (for images or quantityOptions with proper structure preservation)
          const hasImages = images && images.length > 0;
          const hasQuantityOptions = itemData.quantityOptions && itemData.quantityOptions.length > 0;
          
          console.log("[DEBUG - UPDATE ITEM] Received itemData:", {
            itemData,
            hasImages,
            hasQuantityOptions,
            quantityOptions: itemData.quantityOptions,
          });
          
          // If no images and no quantityOptions, send as plain JSON
          if (!hasImages && !hasQuantityOptions) {
            console.log("[DEBUG] Sending update as plain JSON (no images/quantityOptions)");
            const response = await apiClient.patch<
              BaseApiResponse<IServiceItem>
            >(ENDPOINTS.SERVICE_OFFERING.UPDATE_SERVICE_ITEM(itemId), itemData);
            return response.data;
          }

          console.log("[DEBUG] Sending update via FormData (has images or quantityOptions)");
          // Match create item logic: coerce price to number before FormData
          const processedItemData = { ...itemData };
          if (typeof processedItemData.price === "string") {
            processedItemData.price = parseFloat(processedItemData.price);
          }
          const formData = new FormData();

          Object.entries(processedItemData).forEach(([key, value]) => {
            if (key === "images" || key === "background_image") return;
            if (key === "mealDetail" && value && typeof value === "object") {
              Object.entries(value).forEach(([mealKey, mealValue]) => {
                if (mealValue !== undefined) {
                  formData.append(`mealDetail[${mealKey}]`, String(mealValue));
                }
              });
            } else if (
              key === "quantityOptions" &&
              Array.isArray(value) &&
              value.length > 0
            ) {
              // Send quantityOptions as stringified JSON with numeric types preserved
              // The backend middleware will parse this JSON string back to an object
              const stringified = JSON.stringify(value);
              formData.append(key, stringified);
              console.log("[DEBUG] Appending quantityOptions as JSON string:", stringified);
            } else if (value !== undefined && key !== "mealDetail" && key !== "quantityOptions") {
              formData.append(key, String(value));
            }
          });

          // Only append each image file, do not send a stringified array or duplicate keys
          if (images && Array.isArray(images) && images.length > 0) {
            images.forEach((image) => {
              formData.append("images", image);
            });
          }

          const response = await apiClient.patch<BaseApiResponse<IServiceItem>>(
            ENDPOINTS.SERVICE_OFFERING.UPDATE_SERVICE_ITEM(itemId),
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 120000,
            },
          );

          return response.data;
        },
        onSuccess: (response, { itemId }) => {
          toast.success(
            response.message || "Service item updated successfully!",
          );
          // Invalidate business menus to refresh the updated item
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
          // Invalidate specific item and all service items
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.serviceItem(itemId),
          });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.serviceItems(),
          });
        },
        onError: (error) => {
          toast.error("Failed to update service item", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to delete a service item
    useDeleteServiceItem: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (itemId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.SERVICE_OFFERING.DELETE_SERVICE_ITEM(itemId),
          );
          return response.data;
        },
        onSuccess: (response, itemId) => {
          toast.success(
            response.message || "Service item deleted successfully!",
          );
          // Invalidate business menus to refresh after item deletion
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
          // Remove specific item from cache and invalidate service items
          queryClient.removeQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.serviceItem(itemId),
          });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.serviceItems(),
          });
        },
        onError: (error) => {
          toast.error("Failed to delete service item", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },
  };
};

// Export Instance
export const ServiceOfferingApi = createServiceOfferingApi();
