/**
 * Example usage of the Notification API
 *
 * This file demonstrates how to use the notification API hooks
 * in React components.
 */

import { NotificationApi } from "@/services";
import { NotificationType, Platform, SortType } from "@/types/enums";

// Example: Register device token
export const useRegisterDeviceToken = (_token: string, _platform: Platform) => {
  const registerToken = NotificationApi.useRegisterToken();
  // keep signature stable for callers; reference to avoid unused param lint
  void _token;
  void _platform;

  // Do not auto-mutate here. Let consumers call registerToken.mutate when they
  // want to register (or rely on their own effect). Returning the mutation
  // object allows consumers to read isLoading/isSuccess/isError and call mutate.
  return registerToken;
};

// Example: Get user notifications
export const useUserNotifications = (page = 1, limit = 10) => {
  const { data, isLoading, error } = NotificationApi.useGetUserNotifications({
    page,
    limit,
    sort: "createdAt",
    order: SortType.DESC,
  });

  return {
    notifications: data?.data || [],
    pagination: {
      total: data?.total || 0,
      page: data?.page || 1,
      limit: data?.limit || 10,
      totalPages: data?.totalPages || 0,
      hasNext: data?.hasNext || false,
      hasPrevious: data?.hasPrevious || false,
    },
    isLoading,
    error,
  };
};

// Example: Get unread count
export const useUnreadNotificationCount = () => {
  const { data } = NotificationApi.useGetUnreadCount();
  return data?.count || 0;
};

// Example: Mark notification as read
export const useMarkNotificationAsRead = () => {
  const markAsRead = NotificationApi.useMarkAsRead();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  return { handleMarkAsRead, ...markAsRead };
};

// Example: Mark all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const markAllAsRead = NotificationApi.useMarkAllAsRead();

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return { handleMarkAllAsRead, ...markAllAsRead };
};

// Example: Delete notification
export const useDeleteNotification = () => {
  const deleteNotification = NotificationApi.useDeleteNotification();

  const handleDelete = (notificationId: string) => {
    deleteNotification.mutate(notificationId);
  };

  return { handleDelete, ...deleteNotification };
};

// Example: Get notifications by type
export const useNotificationsByType = (
  type: NotificationType,
  page = 1,
  limit = 10,
) => {
  const { data, isLoading, error } = NotificationApi.useGetNotificationsByType(
    type,
    { page, limit, sort: "createdAt", order: SortType.DESC },
  );

  return {
    notifications: data?.notifications || [],
    pagination: {
      total: data?.total || 0,
      page: data?.page || 1,
      limit: data?.limit || 10,
      totalPages: data?.totalPages || 0,
      hasNext: data?.hasNext || false,
      hasPrevious: data?.hasPrevious || false,
    },
    isLoading,
    error,
  };
};
