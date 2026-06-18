import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SERVICE_OFFERING_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import type { IServiceCategory } from "@/types/service-offering-types";

export interface IBuffetOffer {
  id: string;
  name: string;
  price?: number;
  price_per_adults?: number;
  price_per_child?: number;
  description?: string;
  image?: string;
  background_image_url?: string;
  image_urls?: string[];
  main_catch?: string;
  main_catch_description?: string;
  catchy_phrase?: string;
  gate_pass?: boolean;
  is_18_plus?: boolean;
  tags?: string[];
  category?: {
    id: string;
    name: string;
    category_type: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateBuffetOfferDto {
  name: string; // caption - REQUIRED
  category_id: string; // REQUIRED - The category/subcategory ID
  main_catch: string; // REQUIRED - 'food' | 'drinks'
  main_catch_description: string; // REQUIRED - Details about main offering
  catchy_phrase: string; // REQUIRED - Marketing phrase
  gate_pass: boolean; // REQUIRED - Whether entry fee is included
  is_18_plus: boolean; // REQUIRED - Age restriction
  tags: string[]; // REQUIRED - Array of tags
  description?: string; // Optional - Description/about
  price?: number; // Optional - Price for all categories
  price_per_adults?: number; // Optional - Price per adult (buffet meals)
  price_per_child?: number; // Optional - Price per child (buffet meals)
  likeable?: boolean;
  shareable?: boolean;
}

export const createBuffetOfferingsApi = () => {
  return {
    // ===== QUERY HOOKS =====

    useGetBuffetOfferings: (options?: { page?: number; limit?: number }) =>
      useQuery<BaseApiResponse<IBuffetOffer[]>>({
        queryKey: ["buffet-offerings", options],
        queryFn: async () => {
          const params = new URLSearchParams();
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<BaseApiResponse<IBuffetOffer[]>>(
            `${ENDPOINTS.BUFFET_OFFERINGS.GET_ALL}?${params.toString()}`
          );
          return response.data;
        },
      }),

    useGetBusinessBuffetOfferings: (
      options?: { page?: number; limit?: number }
    ) =>
      useQuery<BaseApiResponse<IBuffetOffer[]>>({
        queryKey: ["business-buffet-offerings", options],
        queryFn: async () => {
          const params = new URLSearchParams();
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<BaseApiResponse<IBuffetOffer[]>>(
            `${ENDPOINTS.BUFFET_OFFERINGS.GET_BUSINESS_OFFERINGS}?${params.toString()}`
          );
          return response.data;
        },
      }),

    useGetBuffetOfferingsByCategory: (categoryId: string | undefined) =>
      useQuery<BaseApiResponse<IBuffetOffer[]>>({
        queryKey: ["buffet-offerings-by-category", categoryId],
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<IBuffetOffer[]>>(
            ENDPOINTS.BUFFET_OFFERINGS.GET_BY_CATEGORY(categoryId!)
          );
          return response.data;
        },
        enabled: !!categoryId,
      }),

    useGetBuffetOfferingById: (offerId: string | undefined) =>
      useQuery<BaseApiResponse<IBuffetOffer>>({
        queryKey: ["buffet-offering", offerId],
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<IBuffetOffer>>(
            ENDPOINTS.BUFFET_OFFERINGS.GET_ONE(offerId!)
          );
          return response.data;
        },
        enabled: !!offerId,
      }),

    // ===== MUTATION HOOKS =====

    useCreateBuffetOffer: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<IBuffetOffer>, FormData>({
        mutationFn: async (formData) => {
          const response = await apiClient.post<BaseApiResponse<IBuffetOffer>>(
            ENDPOINTS.SERVICE_OFFERING.CREATE_SERVICE_ITEM,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 120000,
            }
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Offer created successfully.");

          // Manually update the cache with the newly created item
          // This avoids waiting for the /business/menus endpoint to sync
          if (data.data) {
            const newItem = data.data;
            console.log("✅ [OFFER CREATE] New item created:", newItem);
            
            // Transform the new item to match the UI structure
            // Include BOTH camelCase (for UI) and snake_case (for transformer compatibility)
            const transformedItem = {
              id: newItem.id,
              name: newItem.name,
              price: newItem.price_per_adults || newItem.price_per_child || newItem.price,
              description: newItem.description,
              // camelCase for UI rendering
              imageUrls: newItem.background_image_url ? [newItem.background_image_url] : [],
              backgroundImageUrl: newItem.background_image_url,
              // snake_case for transformer compatibility
              image_urls: newItem.background_image_url ? [newItem.background_image_url] : [],
              background_image_url: newItem.background_image_url,
              isDefault: false,
              // Include special offer specific fields for display
              main_catch: newItem.main_catch,
              main_catch_description: newItem.main_catch_description,
              catchy_phrase: newItem.catchy_phrase,
              gate_pass: newItem.gate_pass,
              is_18_plus: newItem.is_18_plus,
              tags: newItem.tags,
            };

            console.log("🔄 [OFFER CREATE] Transformed item:", transformedItem);
            
            // Get the current businessMenus cache
            const queryKey = SERVICE_OFFERING_QUERY_KEYS.businessMenus();
            const previousData = queryClient.getQueryData<BaseApiResponse<IServiceCategory[]>>(queryKey);
            console.log("📦 [OFFER CREATE] Current cache state:", {
              hasCache: !!previousData,
              cacheCategories: previousData?.data?.length || 0,
              categories: previousData?.data?.map(c => ({ id: c.id, name: c.name, category_type: c.category_type, itemsCount: c.items?.length || 0 })) || []
            });
            
            if (previousData?.data) {
              // Log all categories to see their structure
              console.log("📋 [OFFER CREATE] All categories in cache:", previousData.data.map(c => ({
                id: c.id,
                name: c.name,
                category_type: c.category_type,
                hasItems: !!c.items,
                itemsLength: c.items?.length || 0,
              })));
              
              // Find Special Offers category and add the new item
              const updatedCategories = previousData.data.map((category) => {
                console.log(`🔍 [OFFER CREATE] Checking category: ${category.name} (type: ${category.category_type})`);
                if (category.category_type === "special_offer") {
                  console.log("✨ [OFFER CREATE] Found Special Offers category, adding new item to cache");
                  return {
                    ...category,
                    items: [...(category.items || []), transformedItem],
                  };
                }
                return category;
              });
              
              // Update the cache with the new data
              console.log("📝 [OFFER CREATE] Updated cache with new item");
              queryClient.setQueryData(queryKey, {
                ...previousData,
                data: updatedCategories,
              });
            } else {
              console.warn("⚠️ [OFFER CREATE] No cached data found!");
            }
          }

          // Refetch businessMenus after backend sync delay
          // The optimistic update keeps the item visible while we wait for backend sync
          setTimeout(() => {
            console.log("🔄 [OFFER CREATE] Invalidating businessMenus cache for backend sync...");
            
            // Invalidate to trigger a fresh fetch from backend
            queryClient.invalidateQueries({
              queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
            });
          }, 15000); // 15 second delay for backend to sync

          // Invalidate other related queries immediately
          queryClient.invalidateQueries({
            queryKey: ["business-buffet-offerings"],
          });
          queryClient.invalidateQueries({
            queryKey: ["buffet-offerings-by-category"],
          });
        },
        onError: (error) => {
          console.error("Failed to create offer:", error);
          toast.error(
            error.response?.data?.message || "Failed to create offer. Please try again."
          );
        },
      });
    },

    useUpdateBuffetOffer: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBuffetOffer>,
        { offerId: string; data: FormData }
      >({
        mutationFn: async ({ offerId, data }) => {
          console.log("📤 [UPDATE BUFFET OFFER] Updating offer:", offerId);
          
          // Use SERVICE_OFFERING endpoint instead of BUFFET_OFFERINGS since items are service items
          const response = await apiClient.patch<BaseApiResponse<IBuffetOffer>>(
            ENDPOINTS.SERVICE_OFFERING.UPDATE_SERVICE_ITEM(offerId),
            data,
            {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 120000,
            }
          );
          return response.data;
        },
        onSuccess: (data, { offerId }) => {
          toast.success(data.message || "Offer updated successfully.");
          console.log("✅ [UPDATE BUFFET OFFER] Success for:", offerId);

          // Invalidate related queries to refresh UI
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
          queryClient.invalidateQueries({
            queryKey: ["business-buffet-offerings"],
          });
          queryClient.invalidateQueries({
            queryKey: ["buffet-offerings-by-category"],
          });
          queryClient.invalidateQueries({
            queryKey: ["buffet-offering", offerId],
          });
        },
        onError: (error) => {
          console.error("❌ [UPDATE BUFFET OFFER] Failed:", error);
          toast.error(
            error.response?.data?.message || "Failed to update offer. Please try again."
          );
        },
      });
    },

    useDeleteBuffetOffer: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (offerId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.BUFFET_OFFERINGS.DELETE(offerId)
          );
          return response.data;
        },
        onSuccess: (data, offerId) => {
          toast.success(data.message || "Offer deleted successfully.");

          // Invalidate related queries to refresh UI
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.businessMenus(),
          });
          queryClient.invalidateQueries({
            queryKey: ["business-buffet-offerings"],
          });
          queryClient.invalidateQueries({
            queryKey: ["buffet-offerings-by-category"],
          });
          queryClient.removeQueries({
            queryKey: ["buffet-offering", offerId],
          });
        },
        onError: (error) => {
          console.error("Failed to delete offer:", error);
          toast.error(
            error.response?.data?.message || "Failed to delete offer. Please try again."
          );
        },
      });
    },

    // Utility hook for form data creation
    useCreateBuffetOfferFormData: () => {
      return {
        createOfferFormData: (
          offerData: ICreateBuffetOfferDto,
          imageFile?: File
        ): FormData => {
          const formData = new FormData();

          // Required fields for all special offer items
          formData.append("name", offerData.name);
          formData.append("category_id", offerData.category_id);
          formData.append("main_catch", offerData.main_catch);
          formData.append("main_catch_description", offerData.main_catch_description);
          formData.append("catchy_phrase", offerData.catchy_phrase);
          formData.append("gate_pass", String(offerData.gate_pass));
          formData.append("is_18_plus", String(offerData.is_18_plus));

          // Tags as JSON array
          if (offerData.tags && offerData.tags.length > 0) {
            formData.append("tags", JSON.stringify(offerData.tags));
          }

          // Optional fields
          if (offerData.description) {
            formData.append("description", offerData.description);
          }

          // Pricing - either price OR price_per_adults + price_per_child
          if (offerData.price !== undefined) {
            formData.append("price", String(offerData.price));
          } else if (offerData.price_per_adults !== undefined && offerData.price_per_child !== undefined) {
            formData.append("price_per_adults", String(offerData.price_per_adults));
            formData.append("price_per_child", String(offerData.price_per_child));
          }

          if (offerData.likeable !== undefined) {
            formData.append("likeable", String(offerData.likeable));
          }

          if (offerData.shareable !== undefined) {
            formData.append("shareable", String(offerData.shareable));
          }

          // Image file
          if (imageFile) {
            formData.append("background_image", imageFile);
          }

          return formData;
        },
      };
    },
  };
};
