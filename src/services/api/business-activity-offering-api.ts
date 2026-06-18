// src/services/api/business-activity-api.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { BaseApiResponse } from "@/types/api";

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { toast } from "sonner";

import { BUSINESS_ACTIVITY_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ==================================
// Types (based on your backend DTOs)
// ==================================

export interface IActivityPrice {
  id?: string;
  price: string;
  time: string;
}

export interface IActivityImage {
  id: string;
  image_url: string;
}

export interface IBusinessActivity {
  id: string;
  name: string;
  description: string;
  images: IActivityImage[];
  prices: IActivityPrice[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateActivityDto {
  name: string;
  description: string;
  images: File[];
  activityprices: IActivityPrice[];
}

export interface IUpdateActivityDto {
  name?: string;
  description?: string;
  images?: (File | IActivityImage)[];
  activityprices?: IActivityPrice[];
}

// ==================================
// Business Activity API Hooks Factory
// ==================================

export const createBusinessActivityApi = () => {
  return {
    // Get all business activities
    useGetBusinessActivities: () =>
      useQuery<BaseApiResponse<IBusinessActivity[]>>({
        queryKey: BUSINESS_ACTIVITY_QUERY_KEYS.businessList(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IBusinessActivity[]>
          >(ENDPOINTS.BUSINESS_ACTIVITY.GET_BUSINESS_ACTIVITIES);
          return response.data;
        },
      }),

    // Get single activity by ID
    useGetActivityById: (activityId: string | number | undefined | null) =>
      useQuery<BaseApiResponse<IBusinessActivity>>({
        queryKey: BUSINESS_ACTIVITY_QUERY_KEYS.detail(activityId!),
        queryFn: async () => {
          if (!activityId) throw new Error("Activity ID is required.");
          const response = await apiClient.get<
            BaseApiResponse<IBusinessActivity>
          >(ENDPOINTS.BUSINESS_ACTIVITY.GET_ONE(activityId));
          return response.data;
        },
        enabled: !!activityId, // Only run if activityId is provided
      }),

    // Create new business activity
    useCreateBusinessActivity: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessActivity>,
        FormData // Input is FormData for file uploads
      >({
        mutationFn: async (formData) => {
          const response = await apiClient.post<
            BaseApiResponse<IBusinessActivity>
          >(ENDPOINTS.BUSINESS_ACTIVITY.CREATE, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
          });
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Activity created successfully.");
          // Invalidate the activities list to show the new item
          queryClient.invalidateQueries({
            queryKey: BUSINESS_ACTIVITY_QUERY_KEYS.businessList(),
          });
        },
        onError: (error) => {
          console.error("Failed to create activity:", error);
        },
      });
    },

    // Update business activity
    useUpdateBusinessActivity: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessActivity>,
        { activityId: string; formData: FormData }
      >({
        mutationFn: async ({ activityId, formData }) => {
          const response = await apiClient.patch<
            BaseApiResponse<IBusinessActivity>
          >(ENDPOINTS.BUSINESS_ACTIVITY.UPDATE(activityId), formData, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
          });
          return response.data;
        },
        onSuccess: (data, { activityId }) => {
          toast.success(data.message || "Activity updated successfully.");
          // Invalidate the activities list
          queryClient.invalidateQueries({
            queryKey: BUSINESS_ACTIVITY_QUERY_KEYS.businessList(),
          });
          // Invalidate the specific activity detail
          queryClient.invalidateQueries({
            queryKey: BUSINESS_ACTIVITY_QUERY_KEYS.detail(activityId),
          });
        },
        onError: (error) => {
          console.error("Failed to update activity:", error);
        },
      });
    },

    // Delete business activity
    useDeleteBusinessActivity: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<null>,
        string // Activity ID
      >({
        mutationFn: async (activityId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.BUSINESS_ACTIVITY.DELETE(activityId)
          );
          return response.data;
        },
        onSuccess: (data, activityId) => {
          toast.success(data.message || "Activity deleted successfully.");
          // Invalidate the activities list
          queryClient.invalidateQueries({
            queryKey: BUSINESS_ACTIVITY_QUERY_KEYS.businessList(),
          });
          // Remove the specific activity from cache
          queryClient.removeQueries({
            queryKey: BUSINESS_ACTIVITY_QUERY_KEYS.detail(activityId),
          });
        },
        onError: (error) => {
          console.error("Failed to delete activity:", error);
        },
      });
    },

    // Delete activity image
    useDeleteActivityImage: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<null>,
        string // Image ID
      >({
        mutationFn: async (imageId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.BUSINESS_ACTIVITY.DELETE_IMAGE(imageId)
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Activity image deleted successfully.");
          // Invalidate the activities list to reflect changes
          queryClient.invalidateQueries({
            queryKey: BUSINESS_ACTIVITY_QUERY_KEYS.businessList(),
          });
        },
        onError: (error) => {
          console.error("Failed to delete activity image:", error);
        },
      });
    },
  };
};

// ==================================
// Utility Functions for Form Data
// ==================================

export const createActivityFormData = (data: ICreateActivityDto): FormData => {
  const formDataToSend = new FormData();

  formDataToSend.append("name", data.name);
  formDataToSend.append("description", data.description);

  // Append images
  data.images.forEach((image) => {
    formDataToSend.append("images", image);
  });

  // Append activity prices individually instead of as JSON string
  data.activityprices.forEach((price, index) => {
    formDataToSend.append(`activityprices[${index}][price]`, price.price);
    formDataToSend.append(`activityprices[${index}][time]`, price.time);
  });

  return formDataToSend;
};

// Create FormData for create activity
// const createFormDataForActivity = (data: typeof formData): FormData => {
//   const formDataToSend = new FormData();

//   formDataToSend.append("name", data.name);
//   formDataToSend.append("description", data.description);

//   // Append images
//   data.images.forEach((image) => {
//     formDataToSend.append("images", image);
//   });

//   // Append activity prices individually instead of as JSON string
//   data.activityprices.forEach((price, index) => {
//     formDataToSend.append(`activityprices[${index}][price]`, price.price);
//     formDataToSend.append(`activityprices[${index}][time]`, price.time);
//   });

//   return formDataToSend;
// };

export const createUpdateActivityFormData = (
  data: IUpdateActivityDto
): FormData => {
  const formDataToSend = new FormData();

  if (data.name) formDataToSend.append("name", data.name); //
  if (data.description) formDataToSend.append("description", data.description); //

  // // Handle the mixed 'images' array using a consistent indexed notation
  if (data.images && data.images.length > 0) {
    //
    data.images.forEach((imageOrFile, index) => {
      if (imageOrFile instanceof File) {
        // For a new image, append the File object with an indexed key.
        // The backend must be configured to handle files in this format.
        formDataToSend.append(`images`, imageOrFile);
      } else if (imageOrFile && "id" in imageOrFile) {
        // For an existing image, append its id and image_url as indexed fields.
        formDataToSend.append(`images[${index}][id]`, imageOrFile.id);
        formDataToSend.append(
          `images[${index}][image_url]`,
          imageOrFile.image_url
        );
      }
    });
  }

  // The logic for activityprices remains unchanged, as it already uses the correct format.
  if (data.activityprices && data.activityprices.length > 0) {
    //
    data.activityprices.forEach((price, index) => {
      // formDataToSend.append(`activityprices[${index}][id]`, price?.id); //
      formDataToSend.append(`activityprices[${index}][price]`, price.price); //
      formDataToSend.append(`activityprices[${index}][time]`, price.time); //
    });
  }
  return formDataToSend;
};
// Create FormData for update activity
// const createFormDataForUpdate = (data: typeof formData): FormData => {
//   const formDataToSend = new FormData();

//   if (data.name) formDataToSend.append("name", data.name);
//   if (data.description) formDataToSend.append("description", data.description);

//   // Append new images if provided
//   if (data.images && data.images.length > 0) {
//     data.images.forEach((image) => {
//       formDataToSend.append("images", image);
//     });
//   }

//   // Append activity prices individually
//   if (data.activityprices && data.activityprices.length > 0) {
//     data.activityprices.forEach((price, index) => {
//       formDataToSend.append(`activityprices[${index}][price]`, price.price);
//       formDataToSend.append(`activityprices[${index}][time]`, price.time);
//     });
//   }

//   return formDataToSend;
// };

// Export Instance
export const BusinessActivityApi = createBusinessActivityApi();
