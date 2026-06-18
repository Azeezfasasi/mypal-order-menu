/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { BaseApiResponse } from "@/types/api";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { toast } from "sonner";
import { Attribute } from "@/types/business-attribute-types";
import { useQuery } from "@tanstack/react-query";
import { AddBuffetSportDTO, AddIconicDelicacySportDTO } from "@/types/business-sport-types";


export const businessSportApi = () => {

    return {
        useAddIconicDelicacySport: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                AddIconicDelicacySportDTO
            >({
                mutationFn: async (data) => {

                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.SERVICE_OFFERING.CREATE_ICONIC_DEL_ATTRACTION_SPORT, data);
                    return response.data;

                },
                onError: () => {
                    toast.error("Failed to add attribute ");
                },
            });
        },

        useGetIconicDelicacySports: () =>
            useQuery<BaseApiResponse<Attribute[]>>({
                queryKey: ["sports", "iconic-del"],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<Attribute[]>
                    >(ENDPOINTS.SERVICE_OFFERING.GET_ALL_ICONIC_DEL_ATTRACTION_SPORT);
                    return response.data;
                },
            }),

        useUpdateIconicDelicacySport: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                {
                    attraction_id: string,
                    label: string
                }
            >({
                mutationFn: async ({ attraction_id, label }) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.SERVICE_OFFERING.UPDATE_ATTRACTION(attraction_id), {
                        id: attraction_id,
                        label: label
                    });
                    return response.data;

                },
                onError: () => {
                    toast.error("Failed to update sport");
                },
            });
        },

        useDeleteIconicDelicacySport: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                string
            >({
                mutationFn: async (attraction_id) => {
                    const response = await apiClient.delete<
                        BaseApiResponse<any>
                    >(ENDPOINTS.SERVICE_OFFERING.DELETE_ATTRACTION(attraction_id));
                    return response.data;
                },
                onError: () => {
                    toast.error("Failed to delete sport");
                },
            });
        },

        useToggleIconicDelicacySportStatus: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                {
                    status: 'On' | 'Off',
                    attraction_id: string
                }
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(`${ENDPOINTS.SERVICE_OFFERING.TOGGLE_ATTRACTION_STATUS(data.attraction_id)}?status=${data.status}`);
                    return response.data;
                },
                onError: () => {
                    toast.error("Failed to switch sport status");
                },
            });
        },

        useAddBuffetSport: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                AddBuffetSportDTO
            >({
                mutationFn: async (data) => {

                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.SERVICE_OFFERING.CREATE_BUFFET_ATTRACTION_SPORT, data);
                    return response.data;

                },
                onError: () => {
                    toast.error("Failed to add sport ");
                },
            });
        },

        useGetBuffetSports: () =>
            useQuery<BaseApiResponse<Attribute[]>>({
                queryKey: ["sports", "buffet"],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<Attribute[]>
                    >(ENDPOINTS.SERVICE_OFFERING.GET_ALL_BUFFET_ATTRACTION_SPORT);
                    return response.data;
                },
            }),

        useUpdateBuffetSport: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                {
                    attraction_id: string,
                    label: string
                }
            >({
                mutationFn: async ({ attraction_id, label }) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.SERVICE_OFFERING.UPDATE_ATTRACTION(attraction_id), {
                        id: attraction_id,
                        label: label
                    });
                    return response.data;

                },
                onError: () => {
                    toast.error("Failed to update sport");
                },
            });
        },

        useDeleteBuffetSport: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                string
            >({
                mutationFn: async (attraction_id) => {
                    const response = await apiClient.delete<
                        BaseApiResponse<any>
                    >(ENDPOINTS.SERVICE_OFFERING.DELETE_ATTRACTION(attraction_id));
                    return response.data;
                },
                onError: () => {
                    toast.error("Failed to delete sport");
                },
            });
        },

        useToggleBuffetSportStatus: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                {
                    status: 'On' | 'Off',
                    attraction_id: string
                }
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(`${ENDPOINTS.SERVICE_OFFERING.TOGGLE_ATTRACTION_STATUS(data.attraction_id)}?status=${data.status}`);
                    return response.data;
                },
                onError: () => {
                    toast.error("Failed to switch sport status");
                },
            });
        },

    };
};

// Export the API hooks instance
export const BusinessSportApi = businessSportApi();
