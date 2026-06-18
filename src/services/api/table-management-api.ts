/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiResponse } from "@/types/api";
// import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { AllTablesResponse, AvailableTablesResponse, BlockSlotDTO, BookingRulesDTO, CreateBulkTableDTO, DayGridResponse, IMakeExternalReservationDTO, InsightsResponse, IReservation, MakeReservationDTO, MakeReservationResponse, SingleTableDTO, TableViewResponse, UpdateDateTableQuantity, WeekGridResponse } from "@/types/table-management-types";
import { useQuery } from "@tanstack/react-query";

const OPERATING_DAYS_QUERY_KEYS = {
    all: ["operatingDays"] as const,
    lists: () => [...OPERATING_DAYS_QUERY_KEYS.all, "list"] as const,
    // Specific list for business
    businessList: () => ["businessOperatingDays"] as const, // Matches current usage
    details: () => [...OPERATING_DAYS_QUERY_KEYS.all, "detail"] as const,
    detail: (id: string) => [...OPERATING_DAYS_QUERY_KEYS.details(), id] as const,
};

interface IOperatingDay {
    id: string;
    day: string;
    opening_time: string;
    closing_time: string;
    closes_next_day: boolean;
    is_24_hours: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export const tableManagementApi = () => {

    return {

        useGetBusinessOperatingDays: () =>
            useQuery<BaseApiResponse<IOperatingDay[]>>({
                queryKey: OPERATING_DAYS_QUERY_KEYS.businessList(), // Use constant
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<IOperatingDay[]>
                    >(ENDPOINTS.OPERATING_DAYS.BUSINESS_OP_DAYS);
                    return response.data;
                },
            }),

        useUpdateBookingRules: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                BookingRulesDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.TABLE_MANAGEMENT.UPDATE_BOOKING_RULES, data);
                    return response.data;
                }
            });
        },

        useCreateBulkTable: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                CreateBulkTableDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.TABLE_MANAGEMENT.CREATE_BULK_TABLE, {
                        tables: data
                    });
                    return response.data;
                }
            });
        },
        useGetInsights: ({ data, trigger }: { data: { start_date: string; end_date: string }, trigger: boolean }) =>
            useQuery<BaseApiResponse<InsightsResponse>>({
                queryKey: ['tables', 'insights', data.start_date, data.end_date],
                queryFn: async () => {
                    const response = await apiClient.get<BaseApiResponse<InsightsResponse>>(
                        ENDPOINTS.TABLE_MANAGEMENT.GET_INSIGHTS(data)
                    );
                    return response.data;
                },
                enabled: trigger && (!!data.start_date || !!data.end_date),
            }),
        useGetWeekGrid: ({ data, trigger }: { data: { start_date: string; end_date: string }, trigger: boolean }) =>
            useQuery<BaseApiResponse<WeekGridResponse>>({
                queryKey: ['tables', 'week', data.start_date, data.end_date],
                queryFn: async () => {
                    const response = await apiClient.get<BaseApiResponse<WeekGridResponse>>(
                        ENDPOINTS.TABLE_MANAGEMENT.GET_WEEK_GRID(data)
                    );
                    return response.data;
                },
                enabled: trigger && (!!data.start_date || !!data.end_date),
            }),

        useGetDayGrid: ({ day, trigger }: { day: string, trigger: boolean }) =>
            useQuery<BaseApiResponse<DayGridResponse>>({
                queryKey: ['tables', 'day', day],
                queryFn: async () => {
                    const response = await apiClient.get<BaseApiResponse<DayGridResponse>>(
                        ENDPOINTS.TABLE_MANAGEMENT.GET_DAY_GRID(day)
                    );
                    return response.data;
                },
                enabled: trigger && !!day,
            }),
        useGetTableView: ({ day, trigger }: { day: string, trigger: boolean }) =>
            useQuery<BaseApiResponse<TableViewResponse>>({
                queryKey: ['tables', 'table-view', day],
                queryFn: async () => {
                    const response = await apiClient.get<BaseApiResponse<TableViewResponse>>(
                        ENDPOINTS.TABLE_MANAGEMENT.GET_TABLE_VIEW(day)
                    );
                    return response.data;
                },
                enabled: trigger && !!day,
            }),

        useUpdateDateTableQuantity: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                UpdateDateTableQuantity
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.TABLE_MANAGEMENT.UPDATE_DATE_TABLE_QUANTITY, data);
                    return response.data;
                }
            });
        },

        useGetAvailableTables: ({ date, start_time, end_time, party_size }: { date: string; start_time: string; end_time: string; party_size: string }) =>
            useQuery<BaseApiResponse<AvailableTablesResponse>>({
                queryKey: ['tables', 'available', date, start_time, end_time, party_size],
                queryFn: async () => {
                    const response = await apiClient.get<BaseApiResponse<AvailableTablesResponse>>(
                        ENDPOINTS.TABLE_MANAGEMENT.GET_AVAILABLE_TABLES({ date, start_time, end_time, party_size })
                    );
                    return response.data;
                },
                enabled: !!date && !!start_time && !!end_time,
                retry: 0,
            }),

        useGetReservations: ({ date, start_time, end_time, table_id }: { date: string; start_time: string; end_time: string; table_id?: string }) =>
            useQuery<BaseApiResponse<IReservation[]>>({
                queryKey: ['tables', 'reservations', date, start_time, end_time, table_id],
                queryFn: async () => {
                    const response = await apiClient.get<BaseApiResponse<IReservation[]>>(
                        ENDPOINTS.TABLE_MANAGEMENT.GET_RESERVATIONS({ date, start_time, end_time, table_id })
                    );
                    return response.data;
                },
                enabled: !!date && !!start_time && !!end_time,
                retry: 0,
            }),

        useMakeReservation: () => {
            return useSafeMutation<
                BaseApiResponse<MakeReservationResponse>,
                MakeReservationDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.post<
                        BaseApiResponse<MakeReservationResponse>
                    >(ENDPOINTS.TABLE_MANAGEMENT.MAKE_RESERVATION, data);
                    return response.data;
                }
            });
        },
        useMakeExternalReservation: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                IMakeExternalReservationDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.TABLE_MANAGEMENT.MAKE_EXTERNAL_RESERVATION, data);
                    return response.data;
                }
            });
        },
        useCheckHasTableStatus: () =>
            useQuery<BaseApiResponse<boolean>>({
                queryKey: ['tables', 'status'],
                queryFn: async () => {
                    const response = await apiClient.get<BaseApiResponse<boolean>>(
                        ENDPOINTS.TABLE_MANAGEMENT.CHECK_HAS_TABLE_STATUS
                    );
                    return response.data;
                },
                enabled: true
            }),
        useGetAllTables: () =>
            useQuery<BaseApiResponse<AllTablesResponse>>({
                queryKey: ['tables', 'list'],
                queryFn: async () => {
                    const response = await apiClient.get<BaseApiResponse<AllTablesResponse>>(
                        ENDPOINTS.TABLE_MANAGEMENT.GET_ALL_TABLES
                    );
                    return response.data;
                },
                enabled: true
            }),

        useAddSingleTable: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                SingleTableDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.TABLE_MANAGEMENT.ADD_TABLE, data);
                    return response.data;
                }
            });
        },

        useUpdateSingleTable: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                {
                    table_id: string;
                    data: SingleTableDTO
                }

            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.TABLE_MANAGEMENT.UPDATE_TABLE(data.table_id), data.data);
                    return response.data;
                }
            });
        },

        useDeleteSingleTable: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                {
                    table_id: string;
                }

            >({
                mutationFn: async (data) => {
                    const response = await apiClient.delete<
                        BaseApiResponse<any>
                    >(ENDPOINTS.TABLE_MANAGEMENT.DELETE_TABLE(data.table_id));
                    return response.data;
                }
            });
        },
        useBlockSlot: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                BlockSlotDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.TABLE_MANAGEMENT.BLOCK_SLOT, data);
                    return response.data;
                }
            });
        },


    };
};

// Export the API hooks instance
export const TableManagementApi = tableManagementApi();
