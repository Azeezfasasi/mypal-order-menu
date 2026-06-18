// // src/services/api/user-api.ts
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { apiClient } from "./api-client";
// import { ENDPOINTS } from "./endpoints";
// import type { BaseApiResponse } from "@/types/api";
// import { IUser, IUserExperience } from "@/types";

// // DTOs for API requests
// export interface CreateUserExperienceDto {
//   title: string;
//   description: string;
//   files: File[];
// }

// export interface SetPaymentPinDto {
//   pin: string;
// }

// export interface ChangePaymentPinDto {
//   current_pin: string;
//   new_pin: string;
// }

// const createUserApi = () => {
//   const queryClient = useQueryClient();

//   return {
//     // Get all users
//     useGetAllUsers: () =>
//       useQuery<IUser[]>({
//         queryKey: ["users"],
//         queryFn: async () => {
//           const response = await apiClient.get<BaseApiResponse<IUser[]>>(
//             ENDPOINTS.USER.USERS_GET_ALL
//           );
//           return response.data.data;
//         },
//       }),

//     // Get user by ID
//     useGetUserById: (id: string) =>
//       useQuery<IUser>({
//         queryKey: ["user", id],
//         queryFn: async () => {
//           const response = await apiClient.get<BaseApiResponse<IUser>>(
//             ENDPOINTS.USER.USER_GET_BY_ID(id)
//           );
//           return response.data.data;
//         },
//         enabled: !!id,
//       }),

//     // Get user experiences
//     useGetUserExperiences: () =>
//       useQuery<IUserExperience[]>({
//         queryKey: ["user-experiences"],
//         queryFn: async () => {
//           const response = await apiClient.get<
//             BaseApiResponse<IUserExperience[]>
//           >(ENDPOINTS.USER.EXPERIENCES_GET);
//           return response.data.data;
//         },
//       }),

//     // Create user experience
//     // useCreateUserExperience: () =>
//     //   useMutation<
//     //     BaseApiResponse<IUserExperience>,
//     //     Error,
//     //     CreateUserExperienceDto
//     //   >({
//     //     mutationFn: async (data) => {
//     //       const formData = new FormData();
//     //       formData.append("title", data.title);
//     //       formData.append("description", data.description);

//     //       data.files.forEach((file) => {
//     //         formData.append("files", file);
//     //       });

//     //       const response = await apiClient.uploadFiles<
//     //         BaseApiResponse<IUserExperience>
//     //       >(ENDPOINTS.USER.EXPERIENCE_CREATE, formData);
//     //       return response.data;
//     //     },
//     //     onSuccess: () => {
//     //       queryClient.invalidateQueries({ queryKey: ["user-experiences"] });
//     //     },
//     //   }),

//     // Delete user experience
//     useDeleteUserExperience: () =>
//       useMutation<BaseApiResponse<void>, Error, string>({
//         mutationFn: async (experienceId) => {
//           const response = await apiClient.delete<BaseApiResponse<void>>(
//             ENDPOINTS.USER.EXPERIENCE_DELETE_ALT(experienceId)
//           );
//           return response.data;
//         },
//         onSuccess: () => {
//           queryClient.invalidateQueries({ queryKey: ["user-experiences"] });
//         },
//       }),

//     // Delete user experience media
//     useDeleteUserExperienceMedia: () =>
//       useMutation<BaseApiResponse<void>, Error, string>({
//         mutationFn: async (experienceId) => {
//           const response = await apiClient.delete<BaseApiResponse<void>>(
//             ENDPOINTS.USER.EXPERIENCE_DELETE(experienceId)
//           );
//           return response.data;
//         },
//         onSuccess: () => {
//           queryClient.invalidateQueries({ queryKey: ["user-experiences"] });
//         },
//       }),

//     // Set payment PIN
//     useSetPaymentPin: () =>
//       useMutation<BaseApiResponse<void>, Error, SetPaymentPinDto>({
//         mutationFn: async (data) => {
//           const response = await apiClient.post<BaseApiResponse<void>>(
//             ENDPOINTS.PAYMENT.SET_PIN,
//             data
//           );
//           return response.data;
//         },
//       }),

//     // Change payment PIN
//     useChangePaymentPin: () =>
//       useMutation<BaseApiResponse<void>, Error, ChangePaymentPinDto>({
//         mutationFn: async (data) => {
//           const response = await apiClient.post<BaseApiResponse<void>>(
//             ENDPOINTS.PAYMENT.CHANGE_PIN,
//             data
//           );
//           return response.data;
//         },
//       }),
//   };
// };

// export const UserApi = createUserApi();
