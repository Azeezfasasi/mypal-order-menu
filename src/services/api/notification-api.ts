import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSafeMutation } from "@/hooks/useEnhancedMutation";
import type {
  BaseApiResponse,
  IBusinessErrorResponse,
  IBusinessSuccessResponse,
} from "@/types/api";
import { NotificationType } from "@/types/enums";
import type {
  EventReminderDto,
  NotificationQuery,
  NotificationResponse,
  OrderUpdateDto,
  RegisterTokenDto,
  ReservationConfirmationDto,
  UnreadCountResponse,
} from "@/types/notification-types";
import { notificationQueryKeys } from "../notification-query-keys";
import { apiClient, safeApiCall } from "./api-client";
import { ENDPOINTS } from "./endpoints";

// ============================================================================
// STANDALONE AXIOS-BASED NOTIFICATION FUNCTIONS (for use outside TanStack Query)
// ============================================================================

/**
 * Register FCM device token - Standalone Axios function
 * Use this when you need to register a token outside of React components
 */
export const registerDeviceToken = async (
  data: RegisterTokenDto,
): Promise<{ message: string }> => {
  return safeApiCall(() =>
    apiClient.post<
      IBusinessSuccessResponse<{ message: string }> | IBusinessErrorResponse
    >(ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, data),
  );
};

/**
 * Remove all device tokens for current user - Standalone Axios function
 */
export const removeUserTokens = async (): Promise<{ message: string }> => {
  return safeApiCall(() =>
    apiClient.delete<
      IBusinessSuccessResponse<{ message: string }> | IBusinessErrorResponse
    >(ENDPOINTS.NOTIFICATIONS.REMOVE_USER_TOKENS),
  );
};

/**
 * Get user notifications with pagination - Standalone Axios function
 */
export const getUserNotifications = async (
  params?: NotificationQuery,
): Promise<NotificationResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.order) queryParams.append("order", params.order);

  const url = `${ENDPOINTS.NOTIFICATIONS.GET_ALL}${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  return safeApiCall(() =>
    apiClient.get<
      IBusinessSuccessResponse<NotificationResponse> | IBusinessErrorResponse
    >(url),
  );
};

/**
 * Get unread notifications count - Standalone Axios function
 */
export const getUnreadNotificationCount =
  async (): Promise<UnreadCountResponse> => {
    return safeApiCall(() =>
      apiClient.get<
        IBusinessSuccessResponse<UnreadCountResponse> | IBusinessErrorResponse
      >(ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT),
    );
  };

/**
 * Get notifications by type with pagination - Standalone Axios function
 */
export const getNotificationsByType = async (
  type: NotificationType,
  params?: NotificationQuery,
): Promise<NotificationResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.order) queryParams.append("order", params.order);

  const url = `${ENDPOINTS.NOTIFICATIONS.GET_BY_TYPE(type)}${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  return safeApiCall(() =>
    apiClient.get<
      IBusinessSuccessResponse<NotificationResponse> | IBusinessErrorResponse
    >(url),
  );
};

/**
 * Mark notification as read - Standalone Axios function
 */
export const markNotificationAsRead = async (
  notificationId: string,
): Promise<{ message: string }> => {
  return safeApiCall(() =>
    apiClient.patch<
      IBusinessSuccessResponse<{ message: string }> | IBusinessErrorResponse
    >(ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId)),
  );
};

/**
 * Mark all notifications as read - Standalone Axios function
 */
export const markAllNotificationsAsRead = async (): Promise<{
  message: string;
}> => {
  return safeApiCall(() =>
    apiClient.patch<
      IBusinessSuccessResponse<{ message: string }> | IBusinessErrorResponse
    >(ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ),
  );
};

/**
 * Delete a specific notification - Standalone Axios function
 */
export const deleteNotification = async (
  notificationId: string,
): Promise<{ message: string }> => {
  return safeApiCall(() =>
    apiClient.delete<
      IBusinessSuccessResponse<{ message: string }> | IBusinessErrorResponse
    >(ENDPOINTS.NOTIFICATIONS.DELETE(notificationId)),
  );
};

/**
 * Send order update notification - Standalone Axios function
 */
export const sendOrderUpdateNotification = async (
  data: OrderUpdateDto,
): Promise<{ message: string }> => {
  return safeApiCall(() =>
    apiClient.post<
      IBusinessSuccessResponse<{ message: string }> | IBusinessErrorResponse
    >(ENDPOINTS.NOTIFICATIONS.SEND_ORDER_UPDATE, data),
  );
};

/**
 * Send event reminder notification - Standalone Axios function
 */
export const sendEventReminderNotification = async (
  data: EventReminderDto,
): Promise<{ message: string }> => {
  return safeApiCall(() =>
    apiClient.post<
      IBusinessSuccessResponse<{ message: string }> | IBusinessErrorResponse
    >(ENDPOINTS.NOTIFICATIONS.SEND_EVENT_REMINDER, data),
  );
};

/**
 * Send reservation confirmation notification - Standalone Axios function
 */
export const sendReservationConfirmationNotification = async (
  data: ReservationConfirmationDto,
): Promise<{ message: string }> => {
  return safeApiCall(() =>
    apiClient.post<
      IBusinessSuccessResponse<{ message: string }> | IBusinessErrorResponse
    >(ENDPOINTS.NOTIFICATIONS.SEND_RESERVATION_CONFIRMATION, data),
  );
};

// ============================================================================
// TANSTACK QUERY HOOKS (existing implementation with enhancements)
// ============================================================================

export const createNotificationApi = () => {
  return {
    // Register FCM device token
    useRegisterToken: () =>
      useSafeMutation<BaseApiResponse<{ message: string }>, RegisterTokenDto>({
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<{ message: string }>
          >(ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, data);

          return response.data;
        },

        onSuccess: (data) => {
          console.log("Token registered successfully:", data);
          toast.success("Device token registered successfully");
        },
        onError: (error) => {
          toast.error("Failed to register device token", {
            description: error.response?.data?.message || error.message,
          });
          console.error("Token registration error:", error);
        },
      }),

    // Remove all device tokens for current user
    useRemoveUserTokens: () =>
      useSafeMutation<BaseApiResponse<{ message: string }>, void>({
        mutationFn: async () => {
          const response = await apiClient.delete<
            BaseApiResponse<{ message: string }>
          >(ENDPOINTS.NOTIFICATIONS.REMOVE_USER_TOKENS);

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Tokens removed successfully:", data);
          toast.success("All device tokens removed successfully");
        },
        onError: (error) => {
          toast.error("Failed to remove device tokens", {
            description: error.response?.data?.message || error.message,
          });
          console.error("Remove tokens error:", error);
        },
      }),

    // Get user notifications with pagination
    useGetUserNotifications: (params?: NotificationQuery) =>
      useQuery({
        queryKey: notificationQueryKeys.list(params),
        queryFn: async () => {
          const queryParams = new URLSearchParams();

          if (params?.page) queryParams.append("page", params.page.toString());
          if (params?.limit)
            queryParams.append("limit", params.limit.toString());
          if (params?.sort) queryParams.append("sort", params.sort);
          if (params?.order) queryParams.append("order", params.order);

          const url = `${ENDPOINTS.NOTIFICATIONS.GET_ALL}${
            queryParams.toString() ? `?${queryParams.toString()}` : ""
          }`;

          const response =
            await apiClient.get<BaseApiResponse<NotificationResponse>>(url);

          return response.data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    // Get unread notifications count
    useGetUnreadCount: () =>
      useQuery({
        queryKey: notificationQueryKeys.unreadCount(),
        queryFn: async () => {
          const response = await apiClient.get<
            BaseApiResponse<UnreadCountResponse>
          >(ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT);

          return response.data.data;
        },
        staleTime: 30 * 1000, // 30 seconds
      }),

    // Get notifications by type with pagination
    useGetNotificationsByType: (
      type: NotificationType,
      params?: NotificationQuery,
    ) =>
      useQuery({
        queryKey: notificationQueryKeys.byType(type, params),
        queryFn: async () => {
          const queryParams = new URLSearchParams();

          if (params?.page) queryParams.append("page", params.page.toString());
          if (params?.limit)
            queryParams.append("limit", params.limit.toString());
          if (params?.sort) queryParams.append("sort", params.sort);
          if (params?.order) queryParams.append("order", params.order);

          const url = `${ENDPOINTS.NOTIFICATIONS.GET_BY_TYPE(type)}${
            queryParams.toString() ? `?${queryParams.toString()}` : ""
          }`;

          const response =
            await apiClient.get<BaseApiResponse<NotificationResponse>>(url);

          return response.data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    // Mark notification as read
    useMarkAsRead: () =>
      useSafeMutation<BaseApiResponse<{ message: string }>, string>({
        mutationFn: async (notificationId) => {
          const response = await apiClient.patch<
            BaseApiResponse<{ message: string }>
          >(ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId));

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Notification marked as read:", data);
          toast.success("Notification marked as read");
        },
        onError: (error) => {
          toast.error("Failed to mark notification as read", {
            description: error.response?.data?.message || error.message,
          });
          console.error("Mark as read error:", error);
        },
      }),

    // Mark all notifications as read
    useMarkAllAsRead: () =>
      useSafeMutation<BaseApiResponse<{ message: string }>, void>({
        mutationFn: async () => {
          const response = await apiClient.patch<
            BaseApiResponse<{ message: string }>
          >(ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ);

          return response.data;
        },
        onSuccess: (data) => {
          console.log("All notifications marked as read:", data);
          toast.success("All notifications marked as read");
        },
        onError: (error) => {
          toast.error("Failed to mark all notifications as read", {
            description: error.response?.data?.message || error.message,
          });
          console.error("Mark all as read error:", error);
        },
      }),

    // Delete a specific notification
    useDeleteNotification: () =>
      useSafeMutation<BaseApiResponse<{ message: string }>, string>({
        mutationFn: async (notificationId) => {
          const response = await apiClient.delete<
            BaseApiResponse<{ message: string }>
          >(ENDPOINTS.NOTIFICATIONS.DELETE(notificationId));

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Notification deleted successfully:", data);
          toast.success("Notification deleted successfully");
        },
        onError: (error) => {
          toast.error("Failed to delete notification", {
            description: error.response?.data?.message || error.message,
          });
          console.error("Delete notification error:", error);
        },
      }),

    // Helper methods for specific notification types (for admin use)
    useSendOrderUpdate: () =>
      useSafeMutation<BaseApiResponse<{ message: string }>, OrderUpdateDto>({
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<{ message: string }>
          >(ENDPOINTS.NOTIFICATIONS.SEND_ORDER_UPDATE, data);

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Order update notification sent:", data);
          toast.success("Order update notification sent successfully");
        },
        onError: (error) => {
          toast.error("Failed to send order update notification", {
            description: error.response?.data?.message || error.message,
          });
          console.error("Send order update error:", error);
        },
      }),

    useSendEventReminder: () =>
      useSafeMutation<BaseApiResponse<{ message: string }>, EventReminderDto>({
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<{ message: string }>
          >(ENDPOINTS.NOTIFICATIONS.SEND_EVENT_REMINDER, data);

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Event reminder sent:", data);
          toast.success("Event reminder sent successfully");
        },
        onError: (error) => {
          toast.error("Failed to send event reminder", {
            description: error.response?.data?.message || error.message,
          });
          console.error("Send event reminder error:", error);
        },
      }),

    useSendReservationConfirmation: () =>
      useSafeMutation<
        BaseApiResponse<{ message: string }>,
        ReservationConfirmationDto
      >({
        mutationFn: async (data) => {
          const response = await apiClient.post<
            BaseApiResponse<{ message: string }>
          >(ENDPOINTS.NOTIFICATIONS.SEND_RESERVATION_CONFIRMATION, data);

          return response.data;
        },
        onSuccess: (data) => {
          console.log("Reservation confirmation sent:", data);
          toast.success("Reservation confirmation sent successfully");
        },
        onError: (error) => {
          toast.error("Failed to send reservation confirmation", {
            description: error.response?.data?.message || error.message,
          });
          console.error("Send reservation confirmation error:", error);
        },
      }),
  };
};

// Usage:
export const NotificationApi = createNotificationApi();
