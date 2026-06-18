// src/services/api/deals-api.ts
// Following the unified key system pattern

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type { BaseApiResponse, PaginationResult } from "@/types/api";
import {
  ICreateDealDto,
  IDeal,
  IDealListItem,
  IUpdateDealDto,
} from "@/types/deal-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DEAL_QUERY_KEYS,
  DealInvalidationPresets,
  invalidateDealQueries,
} from "../deal-query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// Create the Deal API module
export const createDealApi = () => {
  return {
    // ===== QUERY HOOKS (using unified keys) =====

    useGetDeals: (options?: { page?: number; limit?: number }) =>
      useQuery<BaseApiResponse<PaginationResult<IDealListItem[]>>>({
        queryKey: DEAL_QUERY_KEYS.list(options),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IDealListItem[]>>
          >(`${ENDPOINTS.DEALS.GET_ALL}?${params.toString()}`);
          return response.data;
        },
      }),

    useGetBusinessDeals: (options?: { page?: number; limit?: number }) =>
      useQuery<BaseApiResponse<PaginationResult<IDealListItem[]>>>({
        queryKey: DEAL_QUERY_KEYS.businessList(options),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IDealListItem[]>>
          >(`${ENDPOINTS.DEALS.GET_BUSINESS_DEALS}?${params.toString()}`);
          return response.data;
        },
      }),

    useGetUpcomingDeals: () =>
      useQuery<BaseApiResponse<IDealListItem[]>>({
        queryKey: DEAL_QUERY_KEYS.upcoming(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IDealListItem[]>
          >(ENDPOINTS.DEALS.GET_UPCOMING);
          return response.data;
        },
      }),

    useGetBusinessUpcomingDeals: (options?: {
      page?: number;
      limit?: number;
    }) =>
      useQuery<BaseApiResponse<PaginationResult<IDealListItem[]>>>({
        queryKey: DEAL_QUERY_KEYS.businessUpcoming(options),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (options?.page) params.append("page", options.page.toString());
          if (options?.limit) params.append("limit", options.limit.toString());

          const response = await apiClient.get<
            BaseApiResponse<PaginationResult<IDealListItem[]>>
          >(`${ENDPOINTS.DEALS.GET_BUSINESS_UPCOMING}?${params.toString()}`);
          return response.data;
        },
      }),

    useGetDealById: (dealId: string | undefined | null) =>
      useQuery<BaseApiResponse<IDeal>>({
        queryKey: DEAL_QUERY_KEYS.detail(dealId!),
        queryFn: async () => {
          if (!dealId) throw new Error("Deal ID is required.");
          const response = await apiClient.get<BaseApiResponse<IDeal>>(
            ENDPOINTS.DEALS.GET_ONE(dealId)
          );
          return response.data;
        },
        enabled: !!dealId,
      }),

    // ===== MUTATION HOOKS (using unified invalidation) =====

    useCreateDeal: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<IDeal>, FormData>({
        mutationFn: async (formData) => {
          const response = await apiClient.post<BaseApiResponse<IDeal>>(
            ENDPOINTS.DEALS.CREATE,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          return response.data;
        },
        onSuccess: (data) => {
          toast.success(data.message || "Deal created successfully.");

          // Guaranteed to invalidate the SAME keys used by queries
          invalidateDealQueries(queryClient, DealInvalidationPresets.CREATE);
        },
        onError: (error) => {
          console.error("Failed to create deal:", error);
          toast.error(
            error.response?.data?.message || "Failed to create deal."
          );
        },
      });
    },

    useUpdateDeal: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        BaseApiResponse<IDeal>,
        { dealId: string; data: FormData }
      >({
        mutationFn: async ({ dealId, data }) => {
          const response = await apiClient.patch<BaseApiResponse<IDeal>>(
            ENDPOINTS.DEALS.UPDATE(dealId),
            data,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          return response.data;
        },
        onSuccess: (data, { dealId }) => {
          toast.success(data.message || "Deal updated successfully.");

          // Guaranteed to invalidate the SAME keys used by queries
          invalidateDealQueries(
            queryClient,
            DealInvalidationPresets.UPDATE(dealId)
          );
        },
        onError: (error) => {
          console.error("Failed to update deal:", error);
        },
      });
    },

    useDeleteDeal: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<BaseApiResponse<null>, string>({
        mutationFn: async (dealId) => {
          const response = await apiClient.delete<BaseApiResponse<null>>(
            ENDPOINTS.DEALS.DELETE(dealId)
          );
          return response.data;
        },
        onSuccess: (data, dealId) => {
          toast.success(data.message || "Deal deleted successfully.");

          // Guaranteed to invalidate the SAME keys used by queries
          invalidateDealQueries(
            queryClient,
            DealInvalidationPresets.DELETE(dealId)
          );
        },
        onError: (error) => {
          console.error("Failed to delete deal:", error);
        },
      });
    },

    // Utility hooks for form data creation
    useDealFormData: () => {
      return {
        createDealFormData: (dealData: ICreateDealDto): FormData => {
          const formData = new FormData();

          // Basic deal fields
          formData.append("deal_title", dealData.deal_title);
          formData.append("location", dealData.location);
          formData.append("start_date", dealData.start_date);
          formData.append("end_date", dealData.end_date);
          formData.append("start_time", dealData.start_time);
          formData.append("end_time", dealData.end_time);
          formData.append("duration", dealData.duration);
          formData.append("about_deal", dealData.about_deal);
          formData.append("price", dealData.price.toString());
          formData.append(
            "is_eighteen_plus",
            dealData.is_eighteen_plus.toString()
          );

          // Image file
          if (dealData.image) {
            formData.append("image", dealData.image);
          }

          // Optional business ID (for admin)
          if (dealData.business_id) {
            formData.append("business_id", dealData.business_id);
          }

          // Deal benefits
          if (dealData.benefits && dealData.benefits.length > 0) {
            dealData.benefits.forEach((benefit, index) => {
              formData.append(
                `benefits[${index}][description]`,
                benefit.description
              );
              if (benefit.id) {
                formData.append(`benefits[${index}][id]`, benefit.id);
              }
            });
          }

          // Deal agendas
          if (dealData.agendas && dealData.agendas.length > 0) {
            dealData.agendas.forEach((agenda, index) => {
              formData.append(`agendas[${index}][title]`, agenda.title);
              if (agenda.event_id) {
                formData.append(`agendas[${index}][event_id]`, agenda.event_id);
              }
              if (agenda.id) {
                formData.append(`agendas[${index}][id]`, agenda.id);
              }
            });
          }

          // Refine description (new field)
          formData.append(
            "refine_description",
            dealData.refine_description.toString()
          );

          return formData;
        },

        updateDealFormData: (dealData: IUpdateDealDto): FormData => {
          const formData = new FormData();

          // Only append fields that are provided (partial update)
          if (dealData.deal_title !== undefined) {
            formData.append("deal_title", dealData.deal_title);
          }
          if (dealData.location !== undefined) {
            formData.append("location", dealData.location);
          }
          if (dealData.start_date !== undefined) {
            formData.append("start_date", dealData.start_date);
          }
          if (dealData.end_date !== undefined) {
            formData.append("end_date", dealData.end_date);
          }
          if (dealData.start_time !== undefined) {
            formData.append("start_time", dealData.start_time);
          }
          if (dealData.end_time !== undefined) {
            formData.append("end_time", dealData.end_time);
          }
          if (dealData.duration !== undefined) {
            formData.append("duration", dealData.duration);
          }
          if (dealData.about_deal !== undefined) {
            formData.append("about_deal", dealData.about_deal);
          }
          if (dealData.price !== undefined) {
            formData.append("price", dealData.price.toString());
          }
          if (dealData.is_eighteen_plus !== undefined) {
            formData.append(
              "is_eighteen_plus",
              dealData.is_eighteen_plus.toString()
            );
          }

          // Image file (if provided)
          if (dealData.image) {
            formData.append("image", dealData.image);
          }

          // Handle benefits update
          if (dealData.benefits && dealData.benefits.length > 0) {
            dealData.benefits.forEach((benefit, index) => {
              formData.append(
                `benefits[${index}][description]`,
                benefit.description
              );
              if (benefit.id) {
                formData.append(`benefits[${index}][id]`, benefit.id);
              }
            });
          }

          // Handle agendas update
          if (dealData.agendas && dealData.agendas.length > 0) {
            dealData.agendas.forEach((agenda, index) => {
              formData.append(`agendas[${index}][title]`, agenda.title);
              if (agenda.event_id) {
                formData.append(`agendas[${index}][event_id]`, agenda.event_id);
              }
              if (agenda.id) {
                formData.append(`agendas[${index}][id]`, agenda.id);
              }
            });
          }

          // Refine description (update if provided)
          if (dealData.refine_description !== undefined) {
            formData.append(
              "refine_description",
              dealData.refine_description.toString()
            );
          }

          return formData;
        },
      };
    },
  };
};

export const DealsApi = createDealApi();
