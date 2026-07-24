import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { BaseApiResponse } from "@/types/api";

export interface RoomManagementCalendarDay {
  date: string;
  day_of_week: string;
  day_number: number;
  status?: string;
}

export interface RoomManagementStatusRoom {
  id: string;
  name: string;
  floor?: number;
  bed_type?: string;
  sold_count?: number;
  status?: string;
  inventory_amount?: number;
  price?: number;
  min_nights?: number;
  max_nights?: number;
}

export interface RoomManagementStatusResponse {
  date: string;
  start_date?: string;
  end_date?: string;
  calendar?: RoomManagementCalendarDay[];
  rooms: RoomManagementStatusRoom[];
}

export interface UpdateDailyBlockDto {
  entity_id: string;
  entity_type: string;
  dates: string[];
  is_blocked: boolean;
}

export interface UpdateDailyQuantityDto {
  entity_id: string;
  entity_type: string;
  dates: string[];
  quantity_override: number;
}

export const roomManagementApi = () => ({
  useGetRoomManagementStatus: ({
    date,
    start_date,
    end_date,
    enabled,
  }: {
    date: string;
    start_date: string;
    end_date: string;
    enabled: boolean;
  }) =>
    useQuery<BaseApiResponse<RoomManagementStatusResponse>>({
      queryKey: ["roomManagement", "status", date, start_date, end_date],
      queryFn: async () => {
        const response = await apiClient.get<BaseApiResponse<RoomManagementStatusResponse>>(
          ENDPOINTS.ROOM_MANAGEMENT.STATUS({ date, start_date, end_date }),
        );
        return response.data;
      },
      enabled,
    }),

  useBlockRoomState: () =>
    useSafeMutation<BaseApiResponse<unknown>, UpdateDailyBlockDto>({
      mutationFn: async (data) => {
        const response = await apiClient.patch<BaseApiResponse<unknown>>(
          ENDPOINTS.ROOM_MANAGEMENT.BLOCK_STATE,
          data,
        );
        return response.data;
      },
    }),

  useUpdateRoomQuantity: () =>
    useSafeMutation<BaseApiResponse<unknown>, UpdateDailyQuantityDto>({
      mutationFn: async (data) => {
        const response = await apiClient.patch<BaseApiResponse<unknown>>(
          ENDPOINTS.ROOM_MANAGEMENT.QUANTITY_STATE,
          data,
        );
        return response.data;
      },
    }),
});
