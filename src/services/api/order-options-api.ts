/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiResponse } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { AddOrderOptionDTO, OrderOptions } from "@/types/order-options-types";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";

export const orderOptionsApi = () => {
    return {
        useGetAllOrderOptions: () =>
            useQuery<BaseApiResponse<OrderOptions>>({
                queryKey: ["order-options"],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<OrderOptions>
                    >(ENDPOINTS.ORDER_OPTIONS.GET_ALL);
                    return response.data;
                },
            }),
        useGetMyOrderOptions: () =>
            useQuery<BaseApiResponse<OrderOptions>>({
                queryKey: ["my-order-options"],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<OrderOptions>
                    >(ENDPOINTS.ORDER_OPTIONS.GET_MY_ORDER_OPTIONS);
                    return response.data;
                },
            }),
        useAddOrderOptions: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                AddOrderOptionDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.ORDER_OPTIONS.GET_MY_ORDER_OPTIONS, data);
                    return response.data;
                }
            });
        },
        useEnableOrderOptions: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                string
            >({
                mutationFn: async (id) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.ORDER_OPTIONS.ENABLE_ORDER_OPTION(id));
                    return response.data;
                }
            });
        },
        useDisableOrderOptions: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                string
            >({
                mutationFn: async (id) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.ORDER_OPTIONS.DISABLE_ORDER_OPTION(id));
                    return response.data;
                }
            });
        },
        useDeleteOrderOptions: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                string
            >({
                mutationFn: async (id) => {
                    const response = await apiClient.delete<
                        BaseApiResponse<any>
                    >(ENDPOINTS.ORDER_OPTIONS.UPDATE_ORDER_OPTION(id));
                    return response.data;
                }
            });
        },
        // useEditOrderOptions: () => {
        //     return useSafeMutation<
        //         BaseApiResponse<any>,
        //         { name: string, description?: string, id: string }
        //     >({
        //         mutationFn: async (data) => {
        //             const response = await apiClient.patch<
        //                 BaseApiResponse<any>
        //             >(ENDPOINTS.ORDER_OPTIONS.UPDATE_ORDER_OPTION(data.id), {
        //                 name: data.name,
        //                 description: data.description
        //             });
        //             return response.data;
        //         }
        //     });
        // },
    };
};

// Export the API hooks instance
export const OrderOptionsApi = orderOptionsApi();
