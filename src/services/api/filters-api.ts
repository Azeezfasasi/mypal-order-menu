"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BaseApiResponse } from "@/types/api";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import type { AxiosError } from "axios";

export interface FilterOption {
  id: string;
  label: string;
  group_label?: string | null;
}

export interface FilterCategory {
  id: string;
  name: string;
  options: FilterOption[];
}

/**
 * Debug helper to diagnose business context issues
 */
const debugBusinessContext = async () => {
  const business = useAuthStore.getState().business;
  const token = useAuthStore.getState().token;

  console.log("🔍 [FILTERS-API] Business Context Check:", {
    hasToken: !!token,
    hasBusiness: !!business,
    businessId: business?.id,
    businessName: business?.business_name,
    categoryId: business?.category?.id,
    categoryName: business?.category?.name,
    isVerified: business?.is_verified,
  });

  if (!business) {
    console.error("❌ [FILTERS-API] No business in auth store - user may not be authenticated");
    return { missing: "business" };
  }

  if (!business.category?.id) {
    console.error(
      "❌ [FILTERS-API] Business has no category assigned - backend cannot determine available filters",
      { businessId: business.id, business: business.business_name }
    );
    return { missing: "category" };
  }

  // fetch business from server to compare
  try {
    const res = await apiClient.get<BaseApiResponse<{ id: string; category?: { id: string; name?: string } }>>(ENDPOINTS.BUSINESS.ME);
    const serverBiz = res.data.data;
    console.log("📡 [FILTERS-API] Server business record:", serverBiz);
    if (serverBiz) {
      if (serverBiz.category?.id !== business.category?.id) {
        console.warn(
          "⚠️ [FILTERS-API] Category mismatch between client and server:",
          { client: business.category, server: serverBiz.category },
        );
      }
    }
  } catch (err) {
    console.warn("⚠️ [FILTERS-API] Failed to fetch server business details", err);
  }

  return { valid: true };
};

export const FiltersApi = {
  // Fetch all available filter categories and their options for the business's category
  useGetAvailableFilters: () => {
    return useQuery<FilterCategory[]>({
      queryKey: ["filters", "business", "available"],
      queryFn: async () => {
        const contextCheck = await debugBusinessContext();
        if ("missing" in contextCheck) {
          const message =
            contextCheck.missing === "category"
              ? "Your business doesn't have a category assigned. Please update your business profile with a category in order to manage filters."
              : "Authentication required. Please log in to manage filters.";

          throw new Error(message);
        }

        try {
          const res = await apiClient.get<BaseApiResponse<FilterCategory[]>>(ENDPOINTS.FILTERS.AVAILABLE);
          console.log("✅ [FILTERS-API] Available filters response:", {
            status: res.data.status,
            message: res.data.message,
            dataLength: res.data.data?.length,
            hasData: !!res.data.data,
          });
          // Ensure we return just the array
          let data: FilterCategory[] = [];
          
          if (Array.isArray(res.data.data)) {
            data = res.data.data;
          } else if (res.data.data && typeof res.data.data === 'object' && 'data' in res.data.data) {
            // Handle nested data structure: { data: [...] }
            const nestedData = (res.data.data as Record<string, unknown>).data;
            data = Array.isArray(nestedData) ? nestedData : [];
          }
          
          console.log("✅ [FILTERS-API] Returning data:", { isArray: Array.isArray(data), length: data.length });
          return data;
        } catch (error: unknown) {
          // Enhanced error logging
          if ((error as AxiosError).response?.status === 400 && ((error as AxiosError).response?.data as Record<string, unknown>)?.message?.toString().includes("Business not found")) {
            const business = useAuthStore.getState().business;
            const token = useAuthStore.getState().token;
            
            // Decode JWT to check business ID in token
            let tokenBusinessId = null;
            if (token) {
              try {
                const parts = token.split(".");
                if (parts.length === 3) {
                  const payload = JSON.parse(atob(parts[1]));
                  tokenBusinessId = payload.business_id || payload.sub || payload.id;
                  console.error("🔍 [FILTERS-API] JWT Token Analysis:", {
                    tokenBusinessId,
                    storeBusinessId: business?.id,
                    payloadKeys: Object.keys(payload),
                    fullPayload: payload,
                  });
                }
              } catch (jwtErr) {
                console.error("🔍 [FILTERS-API] Failed to decode JWT:", jwtErr);
              }
            }
            
            console.error("🚨 [FILTERS-API] Backend returned 'Business not found':", {
              businessId: business?.id,
              tokenBusinessId,
              businessName: business?.business_name,
              businessEmail: business?.email,
              isVerified: business?.is_verified,
              isActive: business?.is_active,
              categoryId: business?.category?.id,
              categoryName: business?.category?.name,
              fullError: (error as AxiosError).response?.data,
            });

            const suggestion =
              !business?.category?.id
                ? "Your business category is missing. This is required to fetch available filters."
                : business?.is_verified !== "Accepted"
                ? `Your business is not verified (status: ${business?.is_verified}). You need admin approval to access filters. Please complete KYB verification or contact support.`
                : tokenBusinessId && tokenBusinessId !== business?.id
                ? `Token contains different business ID (${tokenBusinessId}) than store (${business?.id}). Try logging out and back in.`
                : "The backend could not locate your business context. The business may be deactivated or the token may be invalid.";

            // Test if business exists by fetching it directly
            if (business) {
              try {
                console.log("🔍 [FILTERS-API] Testing business existence...");
                const bizRes = await apiClient.get(ENDPOINTS.BUSINESS.ME);
                console.log("✅ [FILTERS-API] Business exists on server:", bizRes.data);

                // Check if the business from server has the expected structure
                const serverBiz = bizRes.data.data;
                if (serverBiz) {
                  console.log("🔍 [FILTERS-API] Server business verification check:", {
                    serverIsVerified: serverBiz.is_verified,
                    serverIsActive: serverBiz.is_active,
                    serverCategoryId: serverBiz.category?.id,
                    serverCategoryName: serverBiz.category?.name,
                    hasAttractions: Array.isArray(serverBiz.attractions) && serverBiz.attractions.length > 0,
                  });

                  // Compare with client-side business
                  console.log("🔍 [FILTERS-API] Client vs Server comparison:", {
                    idMatch: serverBiz.id === business.id,
                    verifiedMatch: serverBiz.is_verified === business.is_verified,
                    activeMatch: serverBiz.is_active === business.is_active,
                    categoryMatch: serverBiz.category?.id === business.category?.id,
                  });
                }
              } catch (bizErr: unknown) {
                console.error("❌ [FILTERS-API] Business fetch failed:", {
                  status: (bizErr as AxiosError).response?.status,
                  message: ((bizErr as AxiosError).response?.data as Record<string, unknown>)?.message || (bizErr as Error).message,
                });
              }
            }

            throw new Error(`Failed to load filters: ${suggestion}`);
          }
          throw error;
        }
      },
      staleTime: 5 * 60 * 1000,
      retry: 1,
    });
  },

  useGetBusinessFilters: () => {
    return useQuery<FilterOption[]>({
      queryKey: ["filters", "business"],
      queryFn: async () => {
        const res = await apiClient.get<BaseApiResponse<FilterOption[]>>(ENDPOINTS.FILTERS.BUSINESS);
        console.log("✅ [FILTERS-API] Business filters response:", {
          status: res.data.status,
          message: res.data.message,
          dataLength: res.data.data?.length,
          hasData: !!res.data.data,
        });
        // Ensure we return just the array
        let data: FilterOption[] = [];
        
        if (Array.isArray(res.data.data)) {
          data = res.data.data;
        } else if (res.data.data && typeof res.data.data === 'object' && 'data' in res.data.data) {
          // Handle nested data structure: { data: [...] }
          const nestedData = (res.data.data as Record<string, unknown>).data;
          data = Array.isArray(nestedData) ? nestedData : [];
        }
        
        console.log("✅ [FILTERS-API] Returning business filters:", { isArray: Array.isArray(data), length: data.length });
        return data;
      },
      staleTime: 2 * 60 * 1000,
      retry: 1,
    });
  },

  useReplaceBusinessFilters: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data: { filter_option_ids: string[] }) => {
        // guard against empty payload
        if (!Array.isArray(data.filter_option_ids)) {
          throw new Error("Invalid filter ids");
        }
        if (data.filter_option_ids.length === 0) {
          // do not call backend when no filters selected
          // backend currently crashes with SQL syntax error when the list is empty
          throw new Error("At least one filter must be selected");
        }

        const res = await apiClient.patch<BaseApiResponse<null>>(ENDPOINTS.FILTERS.REPLACE, data);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["filters", "business"] });
        toast.success("Business filters updated successfully");
      },
      onError: (err: unknown) => {
        console.error("Failed to update filters", err);
        // display backend message if available
        const message: string =
          (((err as AxiosError).response?.data as Record<string, unknown>)?.message as string) ||
          ((err as Error).message as string) ||
          "Failed to update filters";
        toast.error(message);
      },
    });
  },
};
