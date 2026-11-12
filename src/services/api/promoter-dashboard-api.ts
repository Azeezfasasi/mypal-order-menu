import type { BaseApiResponse } from "@/types/api";
import type { IPromoterDashboardOverview } from "@/types/promoter-dashboard-types";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export const createPromoterDashboardApi = () => {
  return {
    useGetOverview: () =>
      useQuery<BaseApiResponse<IPromoterDashboardOverview>>({
        queryKey: ["promoter", "dashboard", "overview"],
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<IPromoterDashboardOverview>
          >(ENDPOINTS.PROMOTER_DASHBOARD.GET_OVERVIEW);
          return response.data;
        },
      }),
  };
};

export const PromoterDashboardApi = createPromoterDashboardApi();
