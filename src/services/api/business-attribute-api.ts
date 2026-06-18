/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { BaseApiResponse } from "@/types/api";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { toast } from "sonner";
import { AddBuffetAttractionDTO, AddIconicDelicacyAttractionDTO, Attribute } from "@/types/business-attribute-types";
import { useQuery } from "@tanstack/react-query";


export const businessAttributeApi = () => {

    return {
        useAddIconicDelicacyAttribute: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                AddIconicDelicacyAttractionDTO
            >({
                mutationFn: async (data) => {

                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.SERVICE_OFFERING.CREATE_ICONIC_DEL_ATTRACTION_ATTRIBUTE, data);
                    return response.data;

                },
                onError: () => {
                    toast.error("Failed to add attribute ");
                },
            });
        },

        useUpdateIconicDelicacyAttribute: () => {
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
                    toast.error("Failed to update attribute ");
                },
            });
        },

        useDeleteIconicDelicacyAttribute: () => {
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
                    toast.error("Failed to delete attribute ");
                },
            });
        },

        useToggleIconicDelicacyAttributeStatus: () => {
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
                    toast.error("Failed to switch attribute");
                },
            });
        },

        useGetIconicDelicacyAttractions: () =>
            useQuery<BaseApiResponse<Attribute[]>>({
                queryKey: ["Attributes", "iconic-del"],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<Attribute[]>
                    >(ENDPOINTS.SERVICE_OFFERING.GET_ALL_ICONIC_DEL_ATTRACTION_ATTRIBUTE);
                    return response.data;
                },
            }),

        useAddBuffetAttribute: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                AddBuffetAttractionDTO
            >({
                mutationFn: async (data) => {

                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.SERVICE_OFFERING.CREATE_BUFFET_ATTRACTION_ATTRIBUTE, data);
                    return response.data;

                },
                onError: () => {
                    toast.error("Failed to add attribute ");
                },
            });
        },

        useUpdateBuffetAttribute: () => {
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
                    toast.error("Failed to update attribute ");
                },
            });
        },

        useDeleteBuffetAttribute: () => {
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
                    toast.error("Failed to delete attribute ");
                },
            });
        },

        useToggleBuffetAttributeStatus: () => {
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
                    toast.error("Failed to switch attribute");
                },
            });
        },

        useGetBuffetAttractions: () =>
            useQuery<BaseApiResponse<Attribute[]>>({
                queryKey: ["Attributes", "buffet"],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<Attribute[]>
                    >(ENDPOINTS.SERVICE_OFFERING.GET_ALL_BUFFET_ATTRACTION_ATTRIBUTE);
                    return response.data;
                },
            }),

    };
};

// Export the API hooks instance
export const BusinessAttributeApi = businessAttributeApi();
