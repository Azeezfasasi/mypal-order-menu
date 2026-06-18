// src/services/api/business-context-api.ts
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import {
  BUSINESS_QUERY_KEYS,
  MEDIA_QUERY_KEYS,
  SERVICE_OFFERING_QUERY_KEYS,
} from "@/services/query-keys";
import type { BaseApiResponse } from "@/types/api";
import type { IBusiness, VerificationRequirements } from "@/types/auth-types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "./api-client";
import type { IBusinessCategory } from "./business-categories-api";
import { ENDPOINTS } from "./endpoints";

/*
  API hooks for business context operations:
  - addCategory: allow a business owner to expand into another category
  - switchBusiness: switch the active business context for an owner
*/

export interface AddCategoryRequest {
  categoryId: string;
}

export interface SwitchBusinessRequest {
  businessId: string;
}

// ----- Response types -----
export interface AddCategoryResponseData {
  existingBusiness: IBusiness;
  newBusiness: IBusiness;
  assignedCategory: IBusinessCategory;
  instructions?: string;
}

export type AddCategoryResponse = BaseApiResponse<AddCategoryResponseData>;

export type SwitchBusinessResponse = BaseApiResponse<IBusiness> & {
  data: {
    business: IBusiness;
    access_token: string;
    needs_onboarding: boolean;
    requires_verification_update: boolean;
    is_verified: string | null;
    verification_requirements: VerificationRequirements | null;
    verification_notes: string | null;
    primaryBusinessId?: string | null;
    linkedBusinesses?: Array<{
      id: string;
      business_name: string;
      category: { id: string; name: string };
      is_primary: boolean;
    }>;
  };
};

export const createBusinessContextApi = () => {
  return {
    useAddCategory: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<AddCategoryResponse, AddCategoryRequest>({
        mutationFn: async (body) => {
          const response = await apiClient.post<AddCategoryResponse>(
            ENDPOINTS.BUSINESS.ME_ADD_CATEGORY,
            body,
          );
          return response.data;
        },
        onSuccess: (data) => {
          // Invalidate relevant queries so UI refreshes with new category/business data
          queryClient.invalidateQueries({
            queryKey: BUSINESS_QUERY_KEYS.current(),
          });
          queryClient.invalidateQueries({ queryKey: ["businessCategories"] });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.all,
          });
          queryClient.invalidateQueries({
            queryKey: MEDIA_QUERY_KEYS.businessList(),
          });

          toast.success(data.message || "Category added successfully");
        },
        onError: (error) => {
          toast.error("Failed to add category", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },

    useSwitchBusiness: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<SwitchBusinessResponse, SwitchBusinessRequest>({
        mutationFn: async (body) => {
          const response = await apiClient.post<SwitchBusinessResponse>(
            ENDPOINTS.BUSINESS.SWITCH,
            body,
          );
          return response.data;
        },
        onSuccess: (data) => {
          // When switching business, invalidate business-scoped data so the app reloads fresh data
          queryClient.invalidateQueries({
            queryKey: BUSINESS_QUERY_KEYS.current(),
          });
          queryClient.invalidateQueries({
            queryKey: SERVICE_OFFERING_QUERY_KEYS.all,
          });
          queryClient.invalidateQueries({
            queryKey: MEDIA_QUERY_KEYS.businessList(),
          });
          // Also invalidate other broad caches that are business-specific
          queryClient.invalidateQueries({ queryKey: ["transactions"] });

          toast.success(data.message || "Business switched successfully");
        },
        onError: (error) => {
          toast.error("Failed to switch business", {
            description: error.response?.data?.message || "An error occurred",
          });
        },
      });
    },
  };
};

export const BusinessContextApi = createBusinessContextApi();
