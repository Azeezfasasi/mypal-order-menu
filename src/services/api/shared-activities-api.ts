import type {
  ILikeActivityItem,
  IShareActivityItem,
  ISharedExperience,
} from "@/types/activity-types";
import { PaginationResult, type BaseApiResponse } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { SHARED_ACTIVITY_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ==================================
// Business Activity API Hooks Factory
// ==================================

export const createBusinessSharedActivityApi = () => {
  return {
    useGetBusinessLikes: (page = 1, limit = 10) =>
      useQuery<BaseApiResponse<PaginationResult<ILikeActivityItem[]>>>({
        queryKey: [...SHARED_ACTIVITY_QUERY_KEYS.likesList(), page, limit],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<ILikeActivityItem[]>>
          >(
            ENDPOINTS.SHARED_ACTIVITIES.GET_LIKES +
              `?page=${page}&limit=${limit}`
          );
          return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    useGetBusinessShares: (page = 1, limit = 10) =>
      useQuery<BaseApiResponse<PaginationResult<IShareActivityItem[]>>>({
        queryKey: [...SHARED_ACTIVITY_QUERY_KEYS.sharesList(), page, limit],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IShareActivityItem[]>>
          >(
            ENDPOINTS.SHARED_ACTIVITIES.GET_SHARES +
              `?page=${page}&limit=${limit}`
          );
          return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    useGetBusinessSharesExperiences: (page = 1, limit = 10) =>
      useQuery<BaseApiResponse<PaginationResult<ISharedExperience[]>>>({
        queryKey: [
          ...SHARED_ACTIVITY_QUERY_KEYS.sharedActivityList(),
          page,
          limit,
        ],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<ISharedExperience[]>>
          >(
            ENDPOINTS.SHARED_ACTIVITIES.GET_SHARED_EXPERIENCES +
              `?page=${page}&limit=${limit}`
          );
          return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
  };
};

// Export Instance
export const BusinessSharedActivityApi = createBusinessSharedActivityApi();
