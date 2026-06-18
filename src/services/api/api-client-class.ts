// // API response type
// export interface ApiResponse<T> {
//   status: string;
//   message: string;
//   data: T;
// }

// // src/api/api-client.ts
// import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

// const API_BASE_URL =
//   process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1";

// class ApiClient {
//   private axiosInstance: AxiosInstance;

//   constructor() {
//     this.axiosInstance = axios.create({
//       baseURL: API_BASE_URL,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     // Add request interceptor to add auth token
//     this.axiosInstance.interceptors.request.use(
//       (config) => {
//         const token = localStorage.getItem("auth_token");
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => Promise.reject(error)
//     );
//   }

//   // Generic GET request
//   async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
//     const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
//     return response.data.data;
//   }

//   // Generic POST request
//   async post<T>(
//     url: string,
//     data?: any,
//     config?: AxiosRequestConfig
//   ): Promise<T> {
//     const response = await this.axiosInstance.post<ApiResponse<T>>(
//       url,
//       data,
//       config
//     );
//     return response.data.data;
//   }

//   // Generic PATCH request
//   async patch<T>(
//     url: string,
//     data?: any,
//     config?: AxiosRequestConfig
//   ): Promise<T> {
//     const response = await this.axiosInstance.patch<ApiResponse<T>>(
//       url,
//       data,
//       config
//     );
//     return response.data.data;
//   }

//   // Generic DELETE request
//   async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
//     const response = await this.axiosInstance.delete<ApiResponse<T>>(
//       url,
//       config
//     );
//     return response.data.data;
//   }

//   // Handle form data submissions (for file uploads)
//   async postFormData<T>(
//     url: string,
//     formData: FormData,
//     config?: AxiosRequestConfig
//   ): Promise<T> {
//     const response = await this.axiosInstance.post<ApiResponse<T>>(
//       url,
//       formData,
//       {
//         ...config,
//         headers: {
//           ...config?.headers,
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );
//     return response.data.data;
//   }

//   // Handle form data updates (for file uploads)
//   async patchFormData<T>(
//     url: string,
//     formData: FormData,
//     config?: AxiosRequestConfig
//   ): Promise<T> {
//     const response = await this.axiosInstance.patch<ApiResponse<T>>(
//       url,
//       formData,
//       {
//         ...config,
//         headers: {
//           ...config?.headers,
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );
//     return response.data.data;
//   }
// }

// export const apiClient = new ApiClient();

// // src/hooks/useServiceOfferingQueries.ts
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { ServiceOfferingApi } from "../api/service-offering-api";
// import {
//   CreateServiceCategoryDto,
//   UpdateServiceCategoryDto,
//   CreateServiceItemDto,
//   UpdateServiceItemDto,
//   CreateAccommodationDto,
//   UpdateAccommodationDto,
//   CreateAttractionDto,
//   UpdateAttractionDto,
// } from "../api/types";

// // Query key constants
// export const QUERY_KEYS = {
//   businessMenus: "businessMenus",
//   accommodations: "accommodations",
//   accommodation: (id: string) => ["accommodation", id],
//   businessAccommodations: (businessId: string) => [
//     "businessAccommodations",
//     businessId,
//   ],
//   attractions: "attractions",
//   attraction: (id: string) => ["attraction", id],
// };

// // Category Hooks
// export const useBusinessMenus = () => {
//   return useQuery({
//     queryKey: [QUERY_KEYS.businessMenus],
//     queryFn: ServiceOfferingApi.getBusinessMenus,
//   });
// };

// export const useCreateCategory = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (categoryData: CreateServiceCategoryDto) =>
//       ServiceOfferingApi.createCategory(categoryData),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.businessMenus] });
//     },
//   });
// };

// export const useCreateDefaultCategory = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (categoryData: CreateServiceCategoryDto) =>
//       ServiceOfferingApi.createDefaultCategory(categoryData),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.businessMenus] });
//     },
//   });
// };

// export const useUpdateCategory = (categoryId: string) => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (categoryData: UpdateServiceCategoryDto) =>
//       ServiceOfferingApi.updateCategory(categoryId, categoryData),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.businessMenus] });
//     },
//   });
// };

// export const useDeleteCategory = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (categoryId: string) =>
//       ServiceOfferingApi.deleteCategory(categoryId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.businessMenus] });
//     },
//   });
// };

// // Service Item Hooks
// export const useCreateServiceItem = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       itemData,
//       image,
//     }: {
//       itemData: CreateServiceItemDto;
//       image?: File;
//     }) => ServiceOfferingApi.createServiceItem(itemData, image),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.businessMenus] });
//     },
//   });
// };

// export const useUpdateServiceItem = (itemId: string) => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       itemData,
//       image,
//     }: {
//       itemData: UpdateServiceItemDto;
//       image?: File;
//     }) => ServiceOfferingApi.updateServiceItem(itemId, itemData, image),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.businessMenus] });
//     },
//   });
// };

// export const useDeleteServiceItem = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (itemId: string) =>
//       ServiceOfferingApi.deleteServiceItem(itemId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.businessMenus] });
//     },
//   });
// };

// // Accommodation Hooks
// export const useAllAccommodations = () => {
//   return useQuery({
//     queryKey: [QUERY_KEYS.accommodations],
//     queryFn: ServiceOfferingApi.getAllAccommodations,
//   });
// };

// export const useAccommodation = (id: string) => {
//   return useQuery({
//     queryKey: QUERY_KEYS.accommodation(id),
//     queryFn: () => ServiceOfferingApi.getAccommodationById(id),
//     enabled: !!id,
//   });
// };

// export const useBusinessAccommodations = (businessId: string) => {
//   return useQuery({
//     queryKey: QUERY_KEYS.businessAccommodations(businessId),
//     queryFn: () => ServiceOfferingApi.getAccommodationsByBusinessId(businessId),
//     enabled: !!businessId,
//   });
// };

// export const useCreateAccommodation = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       accommodationData,
//       image,
//     }: {
//       accommodationData: CreateAccommodationDto;
//       image: File;
//     }) => ServiceOfferingApi.createAccommodation(accommodationData, image),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.accommodations] });
//     },
//   });
// };

// export const useUpdateAccommodation = (id: string) => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       accommodationData,
//       image,
//     }: {
//       accommodationData: UpdateAccommodationDto;
//       image?: File;
//     }) => ServiceOfferingApi.updateAccommodation(id, accommodationData, image),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.accommodations] });
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accommodation(id) });
//     },
//   });
// };

// export const useDeleteAccommodation = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => ServiceOfferingApi.deleteAccommodation(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.accommodations] });
//     },
//   });
// };

// // Attraction Hooks
// export const useAllAttractions = () => {
//   return useQuery({
//     queryKey: [QUERY_KEYS.attractions],
//     queryFn: ServiceOfferingApi.getAllAttractions,
//   });
// };

// export const useAttraction = (id: string) => {
//   return useQuery({
//     queryKey: QUERY_KEYS.attraction(id),
//     queryFn: () => ServiceOfferingApi.getAttractionById(id),
//     enabled: !!id,
//   });
// };

// export const useCreateAttraction = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (attractionData: CreateAttractionDto) =>
//       ServiceOfferingApi.createAttraction(attractionData),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.attractions] });
//     },
//   });
// };

// export const useUpdateAttraction = (id: string) => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (attractionData: UpdateAttractionDto) =>
//       ServiceOfferingApi.updateAttraction(id, attractionData),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.attractions] });
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attraction(id) });
//     },
//   });
// };

// export const useDeleteAttraction = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => ServiceOfferingApi.deleteAttraction(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.attractions] });
//     },
//   });
// };

// export const useToggleAttractionStatus = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => ServiceOfferingApi.toggleAttractionStatus(id),
//     onSuccess: (data, id) => {
//       queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.attractions] });
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attraction(id) });
//     },
//   });
// };
