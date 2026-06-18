/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiResponse } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { ENDPOINTS } from "./endpoints";
import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import { ICreateMenuCategoryDTO, ICreateMenuItemDTO, ICreateOrder, IEditMenuItemDTO, IKitchenTicketList, IOrdersResponse, MenuCategoryResponse } from "@/types/fine-din-menu-orders-types";

export const menuAndOrdersApi = () => {

    return {
        useGetMenuCategories: () =>
            useQuery<BaseApiResponse<MenuCategoryResponse>>({
                queryKey: ["menu-orders", 'categories'],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<MenuCategoryResponse>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.GET_MENU_CATEGORIES);
                    return response.data;
                },
            }),

        useCreateMenuCategory: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                ICreateMenuCategoryDTO
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.CREATE_MENU_CATEGORIES, data);
                    return response.data;
                }
            });
        },
        useUpdateMenuCategory: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                { id: string; payload: ICreateMenuCategoryDTO }
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.UPDATE_MENU_CATEGORY(data.id), data.payload);
                    return response.data;
                }
            });
        },
        useDeleteMenuCategory: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                string
            >({
                mutationFn: async (id) => {
                    const response = await apiClient.delete<
                        BaseApiResponse<any>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.DELETE_MENU_CATEGORY(id));
                    return response.data;
                }
            });
        },
        useCreateMenuItem: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                ICreateMenuItemDTO
            >({
                mutationFn: async (data) => {

                    const formData = new FormData();

                    formData.append('category_id', data.category_id);
                    formData.append('name', data.name);
                    formData.append('description', data.description);
                    formData.append('price', String(data.price));
                    formData.append('stock_quantity', String(data.stock_quantity));
                    formData.append('unit_type', data.unit_type);
                    formData.append('is_available', String(data.is_available));
                    formData.append('image', data.image);

                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(
                        ENDPOINTS.FINE_DINING_MENU_ORDERS.CREATE_MENU_ITEM,
                        formData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        }
                    );

                    return response.data;
                }
            });
        },
        useUpdateMenuItem: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                { id: string; payload: IEditMenuItemDTO }
            >({
                mutationFn: async (data) => {
                    const formData = new FormData();

                    formData.append("category_id", data.payload.category_id);
                    formData.append("name", data.payload.name);
                    formData.append("description", data.payload.description);
                    formData.append("price", String(data.payload.price));
                    formData.append("stock_quantity", String(data.payload.stock_quantity));
                    formData.append("unit_type", data.payload.unit_type);
                    formData.append("is_available", String(data.payload.is_available));

                    // only append image if it exists
                    if (data.payload.image) {
                        formData.append("image", data.payload.image);
                    }

                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(
                        ENDPOINTS.FINE_DINING_MENU_ORDERS.UPDATE_MENU_ITEM(data.id),
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data"
                            }
                        }
                    );

                    return response.data;
                }
            });
        },
        useDeleteMenuItem: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                string
            >({
                mutationFn: async (id) => {
                    const response = await apiClient.delete<
                        BaseApiResponse<any>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.DELETE_MENU_ITEM(id));
                    return response.data;
                }
            });
        },
        useRestockMenuItem: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                { id: string, payload: { quantity_to_add: number } }
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.RESTOCK_MENU_ITEM(data.id), data.payload);
                    return response.data;
                }
            });
        },
        useCreateOrder: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                ICreateOrder
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.post<
                        BaseApiResponse<any>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.CREATE_ORDER, data);
                    return response.data;
                }
            });
        },
        useGetAllOrders: () =>
            useQuery<BaseApiResponse<IOrdersResponse>>({
                queryKey: ["menu-orders", 'orders'],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<IOrdersResponse>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.GET_ALL_ORDERS);
                    return response.data;
                },
            }),
        useMarkOrderAsPaid: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                {
                    id: string;
                    payload: {
                        payment_method: string;
                    }
                }
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.MARK_ORDER_AS_PAID(data.id), data.payload);
                    return response.data;
                }
            });
        },
        useGetKitchenTickets: (status?: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED') =>
            useQuery<BaseApiResponse<IKitchenTicketList>>({
                queryKey: ["menu-orders", 'kitchen-tickets', status],
                queryFn: async () => {
                    const response = await apiClient.get<
                        BaseApiResponse<IKitchenTicketList>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.GET_KITCHEN_TICKETS(status));
                    return response.data;
                },
            }),
        useUpdateKitchenTicketStatus: () => {
            return useSafeMutation<
                BaseApiResponse<any>,
                {
                    id: string;
                    payload: {
                        status: string;
                    }
                }
            >({
                mutationFn: async (data) => {
                    const response = await apiClient.patch<
                        BaseApiResponse<any>
                    >(ENDPOINTS.FINE_DINING_MENU_ORDERS.UPDATE_KITCHEN_TICKET_STATUS(data.id), data.payload);
                    return response.data;
                }
            });
        },
    };
};

// Export the API hooks instance
export const MenuAndOrdersApi = menuAndOrdersApi();
