// src/services/api/business-reviews-api.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import type { BaseApiResponse, PaginationResult } from "@/types/api";
import { ENDPOINTS } from "./endpoints";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { toast } from "sonner";
import { IBusiness } from "@/types/auth-types";
import { REVIEWS_QUERY_KEYS } from "../query-keys";
import { ReactionType } from "@/types/enums";

// ==================================
// Review API Types (Updated to match backend)
// ==================================
export interface IUserReviewer {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  image_url: string | null;
}

export interface IComment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  user?: IUserReviewer;
  business?: IBusiness;
  parentComment?: IComment;
  replies?: IComment[];
  isBusinessReplyPublic?: boolean;
  reviewId?: string; // Added for easier invalidation
}

export interface IReaction {
  id: string;
  type: ReactionType;
  createdAt: string;
  updatedAt: string;
  reviewId?: string; // Added for easier invalidation
}

export interface IBusinessReview {
  id: string;
  comment: string;
  rating: number;
  display_review: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: IUserReviewer;
  business: IBusiness;
  comments?: IComment[];
  reactions?: IReaction[];
}

// DTOs for creating/updating
export interface CreateReviewDto {
  comment: string;
  rating: number;
  business_id: string;
}

export interface UpdateReviewDto {
  comment?: string;
  rating?: number;
}

export interface CreateCommentDto {
  text: string;
  parentCommentId?: string;
  isBusinessReplyPublic?: boolean;
}

export interface UpdateCommentDto {
  text: string;
}

export interface CreateReactionDto {
  type?: ReactionType;
}

export interface ReactionCounts {
  useful: number;
  cool: number;
  funny: number;
}

export interface AverageRatingResponse {
  businessId: string;
  averageRating: number;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================================
// Review API Hooks Factory
// ==================================
export const createBusinessReviewApi = () => {
  return {
    /**
     * Hook to fetch reviews for a specific business
     */
    useGetBusinessReviews: (businessId: string, params?: PaginationParams) =>
      useQuery<BaseApiResponse<PaginationResult<IBusinessReview[]>>>({
        queryKey: [...REVIEWS_QUERY_KEYS.businessList(businessId), params],
        queryFn: async () => {
          const queryParams = new URLSearchParams();
          if (params?.page) queryParams.append("page", String(params.page));
          if (params?.limit) queryParams.append("limit", String(params.limit));

          const url = `${ENDPOINTS.REVIEW.GET_BY_BUSINESS(
            businessId
          )}?${queryParams.toString()}`;

          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IBusinessReview[]>>
          >(url);

          return response.data;
        },
        enabled: !!businessId,
      }),

    /**
     * Hook to fetch a single review by ID
     */
    useGetReviewById: (reviewId: string | undefined | null) =>
      useQuery<BaseApiResponse<IBusinessReview>>({
        queryKey: REVIEWS_QUERY_KEYS.detail(reviewId!),
        queryFn: async () => {
          if (!reviewId) throw new Error("Review ID is required.");

          const response = await apiClient.get<
            BaseApiResponse<IBusinessReview>
          >(ENDPOINTS.REVIEW.GET_ONE(reviewId));
          return response.data;
        },
        enabled: !!reviewId,
      }),

    /**
     * Hook to get average rating for a business
     */
    useGetAverageRating: (businessId: string) =>
      useQuery<BaseApiResponse<AverageRatingResponse>>({
        queryKey: REVIEWS_QUERY_KEYS.averageRating(businessId),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<AverageRatingResponse>
          >(ENDPOINTS.REVIEW.GET_AVERAGE_RATING(businessId));
          return response.data;
        },
        enabled: !!businessId,
      }),

    /**
     * Hook to get comments for a review
     */
    useGetReviewComments: (reviewId: string) =>
      useQuery<BaseApiResponse<{ items: IComment[] }>>({
        queryKey: REVIEWS_QUERY_KEYS.comments(reviewId),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<{ items: IComment[] }>
          >(ENDPOINTS.REVIEW.GET_COMMENTS(reviewId));
          return response.data;
        },
        enabled: !!reviewId,
      }),

    /**
     * Hook to get reactions for a review
     */
    useGetReviewReactions: (reviewId: string) =>
      useQuery<BaseApiResponse<ReactionCounts>>({
        queryKey: REVIEWS_QUERY_KEYS.reactions(reviewId),
        queryFn: async () => {
          const response = await apiClient.get<BaseApiResponse<ReactionCounts>>(
            ENDPOINTS.REVIEW.GET_REACTIONS(reviewId)
          );
          return response.data;
        },
        enabled: !!reviewId,
      }),

    /**
     * Hook to create a new review
     */
    useCreateReview: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<IBusinessReview>, CreateReviewDto>(
        {
          mutationFn: async (createReviewDto) => {
            const response = await apiClient.post<
              BaseApiResponse<IBusinessReview>
            >(ENDPOINTS.REVIEW.CREATE, createReviewDto);
            return response.data;
          },
          onSuccess: (data, variables) => {
            toast.success(data.message || "Review created successfully");

            // Invalidate related queries
            // Invalidate the list of reviews for the business
            queryClient.invalidateQueries({
              queryKey: REVIEWS_QUERY_KEYS.businessList(variables.business_id),
            });
            // Invalidate the average rating for the business
            queryClient.invalidateQueries({
              queryKey: REVIEWS_QUERY_KEYS.averageRating(variables.business_id),
            });
            // If the new review immediately appears in its own detail view, invalidate that too
            if (data.data?.id) {
              queryClient.invalidateQueries({
                queryKey: REVIEWS_QUERY_KEYS.detail(data.data.id),
              });
            }
          },
          onError: (error) => {
            console.error("Failed to create review:", error);
            toast.error("Failed to create review", {
              description:
                error?.response?.data?.message ||
                "An unexpected error occurred.",
            });
          },
        }
      );
    },

    /**
     * Hook to update a review
     */
    useUpdateReview: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessReview>,
        { reviewId: string; data: UpdateReviewDto; businessId: string } // Added businessId to variables for invalidation
      >({
        mutationFn: async ({ reviewId, data }) => {
          const response = await apiClient.patch<
            BaseApiResponse<IBusinessReview>
          >(ENDPOINTS.REVIEW.UPDATE(reviewId), data);
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(data.message || "Review updated successfully");

          // Invalidate the specific review's detail query
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.detail(variables.reviewId),
          });
          // Invalidate the list of reviews for the business (if businessId is available)
          if (variables.businessId) {
            queryClient.invalidateQueries({
              queryKey: REVIEWS_QUERY_KEYS.businessList(variables.businessId),
            });
          }
          // If rating changed, invalidate average rating
          if (variables.data.rating !== undefined && variables.businessId) {
            queryClient.invalidateQueries({
              queryKey: REVIEWS_QUERY_KEYS.averageRating(variables.businessId),
            });
          }
        },
        onError: (error) => {
          console.error("Failed to update review:", error);
          toast.error("Failed to update review", {
            description:
              error?.response?.data?.message || "An unexpected error occurred.",
          });
        },
      });
    },

    /**
     * Hook to delete a review
     */
    useDeleteReview: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<void>,
        { reviewId: string; businessId: string } // Added businessId to variables for invalidation
      >({
        mutationFn: async ({ reviewId }) => {
          const response = await apiClient.delete<BaseApiResponse<void>>(
            ENDPOINTS.REVIEW.DELETE(reviewId)
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(data.message || "Review deleted successfully");

          // Invalidate the specific review's detail query (it might no longer exist)
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.detail(variables.reviewId),
          });
          // Invalidate the list of reviews for the business
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.businessList(variables.businessId),
          });
          // Invalidate the average rating for the business
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.averageRating(variables.businessId),
          });
        },
        onError: (error) => {
          console.error("Failed to delete review:", error);
          toast.error("Failed to delete review", {
            description:
              error?.response?.data?.message || "An unexpected error occurred.",
          });
        },
      });
    },

    /**
     * Hook to toggle review display status (for admins/businesses)
     */
    useToggleReviewDisplay: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IBusinessReview>,
        { reviewId: string; businessId: string } // Added businessId for invalidation
      >({
        mutationFn: async ({ reviewId }) => {
          const response = await apiClient.patch<
            BaseApiResponse<IBusinessReview>
          >(ENDPOINTS.REVIEW.TOGGLE_DISPLAY(reviewId));
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(
            data.message || "Review display status updated successfully"
          );

          // Invalidate the specific review's detail query
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.detail(variables.reviewId),
          });
          // Invalidate the list of reviews for the business
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.businessList(variables.businessId),
          });
          // If toggling display could affect average rating (e.g., if hidden reviews aren't counted),
          // you might also invalidate averageRating. This depends on backend logic.
          // queryClient.invalidateQueries({
          //   queryKey: REVIEWS_QUERY_KEYS.averageRating(variables.businessId),
          // });
        },
        onError: (error) => {
          console.error("Failed to toggle review display:", error);
          toast.error("Failed to update review display status", {
            description:
              error?.response?.data?.message || "An unexpected error occurred.",
          });
        },
      });
    },

    /**
     * Hook to add a comment to a review
     */
    useAddComment: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IComment>,
        { reviewId: string; data: CreateCommentDto }
      >({
        mutationFn: async ({ reviewId, data }) => {
          const response = await apiClient.post<BaseApiResponse<IComment>>(
            ENDPOINTS.REVIEW.ADD_COMMENT(reviewId),
            data
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(data.message || "Comment added successfully");

          // Invalidate the comments list for the specific review
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.comments(variables.reviewId),
          });
          // Invalidate the review detail itself, as it might contain the comments array
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.detail(variables.reviewId),
          });
        },
        onError: (error) => {
          console.error("Failed to add comment:", error);
          toast.error("Failed to add comment", {
            description:
              error?.response?.data?.message || "An unexpected error occurred.",
          });
        },
      });
    },

    /**
     * Hook to update a comment
     */
    useUpdateComment: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IComment>,
        { commentId: string; data: UpdateCommentDto; reviewId: string } // Added reviewId for invalidation
      >({
        mutationFn: async ({ commentId, data }) => {
          const response = await apiClient.patch<BaseApiResponse<IComment>>(
            ENDPOINTS.REVIEW.UPDATE_COMMENT(commentId),
            data
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(data.message || "Comment updated successfully");

          // Invalidate the comments list for the associated review
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.comments(variables.reviewId),
          });
          // Invalidate the review detail itself
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.detail(variables.reviewId),
          });
          // Also invalidate the specific comment's data if it had a dedicated query (unlikely, but good practice)
          // For now, we assume comments are usually fetched as part of a review or comment list.
          // If you had a REVIEWS_QUERY_KEYS.comment(commentId) you'd invalidate that too.
        },
        onError: (error) => {
          console.error("Failed to update comment:", error);
          toast.error("Failed to update comment", {
            description:
              error?.response?.data?.message || "An unexpected error occurred.",
          });
        },
      });
    },

    /**
     * Hook to delete a comment
     */
    useDeleteComment: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<void>,
        { commentId: string; reviewId: string } // Added reviewId for invalidation
      >({
        mutationFn: async ({ commentId }) => {
          const response = await apiClient.delete<BaseApiResponse<void>>(
            ENDPOINTS.REVIEW.DELETE_COMMENT(commentId)
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(data.message || "Comment deleted successfully");

          // Invalidate the comments list for the associated review
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.comments(variables.reviewId),
          });
          // Invalidate the review detail itself
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.detail(variables.reviewId),
          });
        },
        onError: (error) => {
          console.error("Failed to delete comment:", error);
          toast.error("Failed to delete comment", {
            description:
              error?.response?.data?.message || "An unexpected error occurred.",
          });
        },
      });
    },

    /**
     * Hook to add a reaction to a review
     */
    useAddReaction: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IReaction>,
        { reviewId: string; data: CreateReactionDto }
      >({
        mutationFn: async ({ reviewId, data }) => {
          const response = await apiClient.post<BaseApiResponse<IReaction>>(
            ENDPOINTS.REVIEW.ADD_REACTION(reviewId),
            data
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(data.message || "Reaction added successfully");

          // Invalidate the reactions count for the specific review
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.reactions(variables.reviewId),
          });
          // Invalidate the review detail itself, as it might contain reaction counts
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.detail(variables.reviewId),
          });
        },
        onError: (error) => {
          console.error("Failed to add reaction:", error);
          toast.error("Failed to add reaction", {
            description:
              error?.response?.data?.message || "An unexpected error occurred.",
          });
        },
      });
    },

    /**
     * Hook to remove a reaction
     */
    useRemoveReaction: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<void>,
        { reactionId: string; reviewId: string } // Added reviewId for invalidation
      >({
        mutationFn: async ({ reactionId }) => {
          const response = await apiClient.delete<BaseApiResponse<void>>(
            ENDPOINTS.REVIEW.REMOVE_REACTION(reactionId)
          );
          return response.data;
        },
        onSuccess: (data, variables) => {
          toast.success(data.message || "Reaction removed successfully");

          // Invalidate the reactions count for the specific review
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.reactions(variables.reviewId),
          });
          // Invalidate the review detail itself
          queryClient.invalidateQueries({
            queryKey: REVIEWS_QUERY_KEYS.detail(variables.reviewId),
          });
        },
        onError: (error) => {
          console.error("Failed to remove reaction:", error);
          toast.error("Failed to remove reaction", {
            description:
              error?.response?.data?.message || "An unexpected error occurred.",
          });
        },
      });
    },
  };
};

// ==================================
// Export API Hooks Instance
// ==================================
export const BusinessReviewApi = createBusinessReviewApi();
