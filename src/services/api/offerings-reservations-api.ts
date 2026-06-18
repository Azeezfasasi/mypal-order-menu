/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiResponse } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { IBlockUnblockInventorySlotDTO, ICreateManualReservationDTO, ILiveReservationResponse, IOverrideSlotPriceDTO, IReservationGridResponse, IRetireveReservationResponse, } from "@/types/offerings-reservations-types";


export const offeringsReservationApi = () => {

    return {
        useGetInventoryGrid: ({ start_date, end_date, category }: { start_date: string; end_date: string; category?: string }) =>
            useQuery<IReservationGridResponse>({
                queryKey: ['offerings-res', 'grid', start_date, end_date, category],
                queryFn: async () => {
                    const response = await apiClient.get<
                        IReservationGridResponse
                    >(ENDPOINTS.OFFERINGS_RESERVATIONS.GET_GRID({
                        start_date,
                        end_date,
                        category
                    }));
                    return response.data;
                },
            }),

        useBlockUnblockInventorySlot: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                IBlockUnblockInventorySlotDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.OFFERINGS_RESERVATIONS.BLOCK_UNBLOCK_INVENTORY_SLOT, data);
                    return response.data;
                }
            });
        },

        useOverrideSlotPrice: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                IOverrideSlotPriceDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.OFFERINGS_RESERVATIONS.OVERRIDE_PRICE, data);
                    return response.data;
                }
            });
        },

        useGetLiveReservations: () =>
            useQuery<ILiveReservationResponse>({
                queryKey: ['offerings-res', 'live'],
                queryFn: async () => {
                    const response = await apiClient.get<
                        ILiveReservationResponse
                    >(ENDPOINTS.OFFERINGS_RESERVATIONS.GET_LIVE_RESERVATIONS);
                    return response.data;
                },
                refetchInterval: 5000,
            }),

        useRetrieveReservation: ({ entity_id, entity_type, start_date, end_date, isEnabled }: { entity_id: string; entity_type: string; start_date: string; end_date: string; isEnabled: boolean }) =>
            useQuery<IRetireveReservationResponse>({
                queryKey: ['offerings-res', 'retrieve', entity_id, entity_type, start_date, end_date],
                queryFn: async () => {
                    const response = await apiClient.get<
                        IRetireveReservationResponse
                    >(ENDPOINTS.OFFERINGS_RESERVATIONS.RETRIEVE_RESERVATIONS({
                        entity_id,
                        entity_type,
                        start_date,
                        end_date
                    }));
                    return response.data;
                },
                enabled: isEnabled
            }),
        useCreateReservation: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                ICreateManualReservationDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.OFFERINGS_RESERVATIONS.CREATE_RESERVATIONS, data);
                    return response.data;
                }
            });
        },

    };
};

// Export the API hooks instance
export const OfferingsReservationApi = offeringsReservationApi();
