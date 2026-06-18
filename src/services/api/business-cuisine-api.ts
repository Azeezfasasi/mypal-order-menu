/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { BaseApiResponse } from "@/types/api";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { toast } from "sonner";
import { AddCuisineDTO, Cuisine, RemoveCuisineDTO } from "@/types/business-cuisine-types";


export const businessCuisineApi = () => {

    return {
        useGetMyIconicDelicacyCuisine: () =>
            useQuery<BaseApiResponse<Cuisine[]>>({
                queryKey: ["business-cuisines", "iconic-del", "my-cuisines"],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<Cuisine[]>
                    >(ENDPOINTS.BUSINESS_CUISINE.GET_MY_ICONIC_DELICACY_CUISINES);
                    return response.data;
                },
            }),

        useGetAllIconicDelicacyCuisine: () =>
            useQuery<BaseApiResponse<Cuisine[]>>({
                queryKey: ["business-cuisines", "iconic-del", 'all'],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<Cuisine[]>
                    >(ENDPOINTS.BUSINESS_CUISINE.GET_ALL_ICONIC_DELICACY_CUISINES);
                    return response.data;
                },
            }),

        useAddIconicDelicacyCuisine: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                AddCuisineDTO
            >({
                mutationFn: async (data) => {

                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.BUSINESS_CUISINE.ADD_ICONIC_DELICACY_CUISINES, data);
                    return response.data;

                },
                onError: (error) => {
                    toast.error("Failed to add cuisine", {
                        description: error.response?.data?.message || "An error occurred",
                    });
                },
            });
        },
        useRemoveIconicDelicacyCuisine: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                RemoveCuisineDTO
            >({
                mutationFn: async (data) => {

                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.BUSINESS_CUISINE.REMOVE_ICONIC_DELICACY_CUISINES, data);
                    return response.data;

                },
                onError: () => {
                    toast.error("failed to remove cuisine");
                },
            });
        },
        useGetMyBuffetCuisine: () =>
            useQuery<BaseApiResponse<Cuisine[]>>({
                queryKey: ["business-cuisines", "buffet", "my-cuisines"],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<Cuisine[]>
                    >(ENDPOINTS.BUSINESS_CUISINE.GET_MY_BUFFET_CUISINES);
                    return response.data;
                },
            }),

        useGetAllBuffetCuisine: () =>
            useQuery<BaseApiResponse<Cuisine[]>>({
                queryKey: ["business-cuisines", "buffet", 'all'],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<Cuisine[]>
                    >(ENDPOINTS.BUSINESS_CUISINE.GET_ALL_BUFFET_CUISINES);
                    return response.data;
                },
            }),

        useAddBuffetCuisine: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                AddCuisineDTO
            >({
                mutationFn: async (data) => {

                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.BUSINESS_CUISINE.ADD_BUFFET_CUISINES, data);
                    return response.data;

                },
                onError: (error) => {
                    toast.error("Failed to add cuisine", {
                        description: error.response?.data?.message || "An error occurred",
                    });
                },
            });
        },
        useRemoveBuffetCuisine: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                RemoveCuisineDTO
            >({
                mutationFn: async (data) => {

                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.BUSINESS_CUISINE.REMOVE_BUFFET_CUISINES, data);
                    return response.data;

                },
                onError: () => {
                    toast.error("failed to remove cuisine");
                },
            });
        },
    };
};

// Export the API hooks instance
export const BusinessCuisineApi = businessCuisineApi();
