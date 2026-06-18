import { useSafeMutation } from "@/hooks/useEnhancedMutation";

import type {
  ICreateUpdateAvailabilityDto,
  IGetAllAvailabilityResponse,
  IGetAvailabilityParams,
} from "@/types/buffet-availability-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BUFFET_AVAILABILITY_QUERY_KEYS } from "../query-keys";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";

export const createBuffetAvailabilityApi = () => {
  return {
    // Get all availability slots for all buffet categories
    useGetAllAvailability: (params?: IGetAvailabilityParams) => {
      return useQuery<IGetAllAvailabilityResponse>({
        queryKey: BUFFET_AVAILABILITY_QUERY_KEYS.list(
          params as unknown as Record<string, unknown>,
        ),
        queryFn: async () => {
          const searchParams = new URLSearchParams();
          if (params?.business_id)
            searchParams.append("business_id", String(params.business_id));
          if (params?.page !== undefined)
            searchParams.append("page", String(params.page));
          if (params?.limit !== undefined)
            searchParams.append("limit", String(params.limit));

          const url = searchParams.toString()
            ? `${ENDPOINTS.AVAILABILITY.GET_ALL}?${searchParams.toString()}`
            : ENDPOINTS.AVAILABILITY.GET_ALL;

          const response =
            await apiClient.get<IGetAllAvailabilityResponse>(url);
          return response.data;
        },
        enabled: params !== undefined, // Only run query if params is defined
      });
    },

    // Update an availability slot
    useUpdateAvailability: () => {
      const queryClient = useQueryClient();
      return useSafeMutation<
        IGetAllAvailabilityResponse,
        { availabilityId: string; data: ICreateUpdateAvailabilityDto }
      >({
        mutationFn: async ({ availabilityId, data }) => {
          const response = await apiClient.patch<IGetAllAvailabilityResponse>(
            ENDPOINTS.AVAILABILITY.UPDATE(availabilityId),
            data,
          );
          return response.data;
        },
        onSuccess: (response) => {
          toast.success(response.message || "Availability updated");
          queryClient.invalidateQueries({
            queryKey: BUFFET_AVAILABILITY_QUERY_KEYS.all,
          });
        },
        onError: (error: unknown) => {
          let message = "An unexpected error occurred";
          if (error instanceof Error) {
            message = error.message;
          } else if (typeof error === "object" && error !== null) {
            const errObj = error as Record<string, unknown>;
            if (
              "response" in errObj &&
              typeof errObj.response === "object" &&
              errObj.response !== null
            ) {
              const resp = errObj.response as Record<string, unknown>;
              const data = resp["data"] as Record<string, unknown> | undefined;
              message =
                (data && (data["message"] as string)) ||
                (resp["message"] as string) ||
                message;
            }
          }
          toast.error("Failed to update availability", {
            description: message,
          });
        },
      });
    },
  };
};

export const BuffetAvailabilityApi = createBuffetAvailabilityApi();
