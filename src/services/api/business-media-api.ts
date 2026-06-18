// src/services/api/business-media-api.ts (Example file name)

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse } from "@/types/api";
import type { IBusinessUploadItem } from "@/types/business-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MEDIA_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ==================================
// Business Media API Hooks Factory
// ==================================

export const createBusinessMediaApi = () => {
  return {
    useGetBusinessMedia: () =>
      useQuery<BaseApiResponse<IBusinessUploadItem[]>>({
        queryKey: MEDIA_QUERY_KEYS.businessList(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IBusinessUploadItem[]>
          >(ENDPOINTS.MEDIA.GET_ALL);
          return response.data;
        },
      }),

    useGetMediaById: (mediaId: string | number | undefined | null) =>
      useQuery<BaseApiResponse<IBusinessUploadItem>>({
        queryKey: MEDIA_QUERY_KEYS.detail(mediaId!),
        queryFn: async () => {
          if (!mediaId) throw new Error("Media ID is required.");
          const response = await apiClient.get<
            BaseApiResponse<IBusinessUploadItem>
          >(ENDPOINTS.MEDIA.GET_ONE(mediaId));
          return response.data;
        },
        enabled: !!mediaId, // Only run if mediaId is provided
      }),

    useUploadBusinessMedia: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessUploadItem | IBusinessUploadItem[]>, // Accept single or array response
        FormData // Input is FormData
      >({
        mutationFn: async (formData) => {
          const response = await apiClient.post<
            BaseApiResponse<IBusinessUploadItem | IBusinessUploadItem[]>
          >(ENDPOINTS.MEDIA.UPLOAD_MEDIA, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            // increase timeout for large/multiple uploads (10 minutes)
            timeout: 10 * 60 * 1000,
          });
          return response.data;
        },

        onSuccess: (data) => {
          toast.success(data.message || "Media uploaded successfully.");
          // Invalidate the media list to show the new item
          queryClient.invalidateQueries({
            queryKey: MEDIA_QUERY_KEYS.businessList(),
          });
        },
        onError: (error) => {
          console.error("Failed to upload media:", error);
        },
      });
    },

    // New hook: upload with progress callback using axios onUploadProgress
    useUploadBusinessMediaWithProgress: () => {
      const queryClient = useQueryClient();
      const uploadWithProgress = async (
        formData: FormData,
        onUploadProgress?: (ev: { loaded: number; total: number }) => void,
      ) => {
        const response = await apiClient.post<
          BaseApiResponse<IBusinessUploadItem | IBusinessUploadItem[]>
        >(ENDPOINTS.MEDIA.UPLOAD_MEDIA, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          // increase timeout for large/multiple uploads (10 minutes)
          timeout: 10 * 60 * 1000,
          onUploadProgress: (progressEvent) => {
            if (onUploadProgress) {
              onUploadProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total || 0,
              });
            }
          },
        });

        toast.success(response.data.message || "Media uploaded successfully.");
        // invalidate media list
        queryClient.invalidateQueries({
          queryKey: MEDIA_QUERY_KEYS.businessList(),
        });
        return response.data;
      };

      return uploadWithProgress;
    },

    useDeleteBusinessMedia: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<null>, // Response type might just be success message
        string | number // Input is the media ID
      >({
        mutationFn: async (mediaId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.MEDIA.DELETE_MEDIA(mediaId),
          );
          return response.data;
        },
        onSuccess: (data, mediaId) => {
          toast.success(data.message || "Media deleted successfully.");
          // Invalidate the media list
          queryClient.invalidateQueries({
            queryKey: MEDIA_QUERY_KEYS.businessList(),
          });
          // Also invalidate the specific detail query if cached
          queryClient.invalidateQueries({
            queryKey: MEDIA_QUERY_KEYS.detail(mediaId),
          });
          // Optional: Optimistically remove from cache using setQueryData
        },
        onError: (error) => {
          console.error("Failed to delete media:", error);
        },
      });
    },
  };
};

// Export Instance
export const BusinessMediaApi = createBusinessMediaApi();
