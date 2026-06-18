// fine-dining-menu-api.ts
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api"; // Assuming your BaseApiResponse type is here
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FINE_DINING_MENU_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client"; // Assuming apiClient is in the same directory or correctly imported
import { ENDPOINTS } from "./endpoints"; // Assuming endpoints are defined here

// ==================================
// Types for Fine Dining Menu
// ==================================

// Response type for a single fine dining menu item (adjust based on actual API response structure)
export interface IFineDiningMenuItem {
  id: string; // or number, depending on your API
  name: string;
  minimum_price: number;
  maximum_price: number;
  type: "Image" | "Pdf" | "Url";
  menu_url?: string; // Assuming the API returns a URL for the PDF/IMAGE menu
  createdAt: string;
  updatedAt: string;
}

export interface ICreateFineDiningMenuPayload {
  name: string;
  minimum_price: number;
  maximum_price: number;
  image?: File; // Use File type for binary image data
  menu_url?: string; // This might be the URL if not uploading a file directly, or perhaps file is optional if URL is provided? Clarify API spec if needed.
  category_id?: string;
}

// Request body for updating a fine dining menu
export interface IUpdateFineDiningMenuPayload {
  name?: string;
  minimum_price?: number;
  maximum_price?: number;
  image?: File; // Use File type for binary image data
  menu_url?: string; // Or string for URL
  // Add other updatable properties
}

// ==================================
// Fine Dining Menu API Hooks Factory
// ==================================

export const createFineDiningMenuApi = () => {
  return {
    // Hook to get all fine dining menus
    useGetAllFineDiningMenus: () =>
      useQuery<BaseApiResponse<IFineDiningMenuItem[]>>({
        queryKey: FINE_DINING_MENU_QUERY_KEYS.lists(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IFineDiningMenuItem[]>
          >(ENDPOINTS.FINE_DINING_MENU.GET_ALL);
          return response.data;
        },
      }),

    // Hook to get a specific fine dining menu by ID
    useGetFineDiningMenuById: (menuId: string | number) =>
      useQuery<BaseApiResponse<IFineDiningMenuItem>>({
        queryKey: FINE_DINING_MENU_QUERY_KEYS.detail(menuId),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IFineDiningMenuItem>
          >(ENDPOINTS.FINE_DINING_MENU.GET_ONE(menuId));
          return response.data;
        },
        enabled: !!menuId, // Only run the query if menuId is provided
      }),

    // Hook to get fine dining menus for the current business
    useGetBusinessFineDiningMenus: () =>
      useQuery<BaseApiResponse<IFineDiningMenuItem[]>>({
        queryKey: FINE_DINING_MENU_QUERY_KEYS.businessMenus(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IFineDiningMenuItem[]>
          >(ENDPOINTS.FINE_DINING_MENU.GET_BUSINESS_MENUS);
          return response.data;
        },
      }),

    // Hook to create a new fine dining menu
    // Accepts ICreateFineDiningMenuPayload but needs to be converted to FormData
    useCreateFineDiningMenu: () => {
      const queryClient = useQueryClient();

      return useSafeMutation<
        BaseApiResponse<IFineDiningMenuItem>, // Expected response type
        ICreateFineDiningMenuPayload // Variables type (input to the mutation)
      >({
        mutationFn: async (menuData: ICreateFineDiningMenuPayload) => {
          // Prepare FormData for multipart/form-data
          const formData = new FormData();
          formData.append("name", menuData.name);
          formData.append("minimum_price", String(menuData.minimum_price));
          formData.append("maximum_price", String(menuData.maximum_price));
          if (menuData.image) {
            formData.append("image", menuData.image);
          }
          if (menuData.menu_url) {
            // Assuming menu_url can be a string if not uploading a file
            formData.append("menu_url", menuData.menu_url);
          }
          if (menuData.category_id) {
            formData.append("category_id", menuData.category_id);
          }

          const response = await apiClient.post<
            BaseApiResponse<IFineDiningMenuItem>
          >(ENDPOINTS.FINE_DINING_MENU.CREATE, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Menu created successfully!");
          // Invalidate relevant queries to refresh the lists
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.lists(),
          });
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.businessMenus(),
          });
        },
        onError: (error) => {
          toast.error("Failed to create menu", {
            description:
              error?.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to update a fine dining menu
    useUpdateFineDiningMenu: () => {
      const queryClient = useQueryClient();

      return useSafeMutation<
        BaseApiResponse<IFineDiningMenuItem>, // Expected response type
        { id: string | number; data: IUpdateFineDiningMenuPayload } // Variables type (input to the mutation)
      >({
        mutationFn: async ({ id, data }) => {
          // Prepare FormData for multipart/form-data if sending files
          const formData = new FormData();
          if (data.name) {
            formData.append("name", data.name);
          }
          if (data.minimum_price !== undefined) {
            formData.append("minimum_price", String(data.minimum_price));
          }
          if (data.maximum_price !== undefined) {
            formData.append("maximum_price", String(data.maximum_price));
          }
          if (data.image) {
            formData.append("image", data.image);
          }
          if (data.menu_url) {
            // Assuming menu_url can be a string if not uploading a file
            formData.append("menu_url", data.menu_url);
          }

          const response = await apiClient.patch<
            BaseApiResponse<IFineDiningMenuItem>
          >(ENDPOINTS.FINE_DINING_MENU.UPDATE(id), formData, {
            headers: {
              // Axios sets Content-Type for FormData automatically,
              // but explicitly setting can sometimes help.
              "Content-Type": "multipart/form-data",
            },
          });

          return response.data;
        },
        onSuccess: (response, variables) => {
          toast.success(response.message || "Menu updated successfully!");
          // Invalidate relevant queries to refresh the data
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.lists(),
          });
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.businessMenus(),
          });
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.detail(variables.id),
          });
        },
        onError: (error) => {
          toast.error("Failed to update menu", {
            description:
              error.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },

    // Hook to delete a fine dining menu by ID
    useDeleteFineDiningMenu: () => {
      const queryClient = useQueryClient();

      return useSafeMutation<
        BaseApiResponse<null>, // Assuming delete returns a success message or null data
        string | number // Variables type (the ID to delete)
      >({
        mutationFn: async (menuId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.FINE_DINING_MENU.DELETE(menuId),
          );
          return response.data;
        },
        onSuccess: (response, menuId) => {
          toast.success(response.message || "Menu deleted successfully!");
          // Invalidate relevant queries to refresh the lists
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.lists(),
          });
          queryClient.invalidateQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.businessMenus(),
          });
          // Remove the specific menu from cache
          queryClient.removeQueries({
            queryKey: FINE_DINING_MENU_QUERY_KEYS.detail(menuId),
          });
        },
        onError: (error) => {
          toast.error("Failed to delete menu", {
            description:
              error?.response?.data?.message || "An unexpected error occurred",
          });
        },
      });
    },
  };
};

// Export Instance
export const FineDiningMenuApi = createFineDiningMenuApi();
