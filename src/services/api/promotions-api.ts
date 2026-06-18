"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BaseApiResponse } from "@/types/api";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export type PromotionType =
  | "deal"
  | "event"
  | "service_item"
  | "service_category"
  | "accommodation"
  | "fine_dining_menu";

export type PromotionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "REJECTED";

export interface TimeRemaining {
  total_hours: number;
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

export interface CreatePromotionDto {
  promotion_type: PromotionType;
  title: string;
  description?: string;
  duration_hours: number; // Range: 1-168

  // Include exactly one target ID based on promotion_type:
  deal_id?: string;
  event_id?: string;
  service_item_id?: string;
  service_category_id?: string;
  accommodation_id?: string;
  fine_dining_menu_id?: string;
}

export interface PromotionResponse {
  id: string;
  promotion_type: PromotionType;
  title: string;
  description?: string;
  status: PromotionStatus;
  duration_hours: number;
  views_count: number;
  clicks_count: number;
  createdAt: string;
  start_datetime?: string;
  end_datetime?: string;
  service_item?: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
  service_category?: {
    id: string;
    name: string;
  };
  business_category?: {
    id: string;
    name: string;
  };
  accommodation?: {
    id: string;
    apartment_name: string;
    apartment_type?: string;
    image_url?: string;
    pricing?: {
      cautionFee?: number;
      basePricePerNight?: number;
    };
  };
  fine_dining_menu?: {
    id: string;
    name: string;
    menu_url?: string;
    minimum_price?: number;
    maximum_price?: number;
  };
  time_remaining?: TimeRemaining;
}

export const PromotionsApi = {
  /**
   * Create a new promotion
   * POST /v1/promotions/business
   */
  useCreatePromotion: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: CreatePromotionDto) => {
        const response = await apiClient.post<BaseApiResponse<PromotionResponse>>(
          ENDPOINTS.PROMOTIONS.CREATE,
          data
        );
        return response.data;
      },
      onSuccess: () => {
        // Invalidate the promotions list to refresh
        queryClient.invalidateQueries({
          queryKey: ["promotions", "business"],
        });

        toast.success("Promotion created successfully!", {
          description: "Your promotion is pending approval from the admin.",
        });
      },
      onError: (error: unknown) => {
        console.error("Error creating promotion:", error);
        const message =
          error instanceof Error ? error.message : "Failed to create promotion";
        toast.error("Failed to create promotion", {
          description: message,
        });
      },
    });
  },

  /**
   * Get all business promotions
   * GET /v1/promotions/business
   */
  useListPromotions: () => {
    return useQuery<BaseApiResponse<PromotionResponse[]>>({
      queryKey: ["promotions", "business"],
      queryFn: async () => {
        const response = await apiClient.get<BaseApiResponse<PromotionResponse[]>>(
          ENDPOINTS.PROMOTIONS.LIST
        );
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
};
