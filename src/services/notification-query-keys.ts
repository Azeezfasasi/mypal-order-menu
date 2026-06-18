import { NotificationType } from "@/types/enums";
import type { NotificationQuery } from "@/types/notification-types";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationQueryKeys.all, "list"] as const,
  list: (params?: NotificationQuery) =>
    [...notificationQueryKeys.lists(), params] as const,
  details: () => [...notificationQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationQueryKeys.details(), id] as const,
  unreadCount: () => [...notificationQueryKeys.all, "unread-count"] as const,
  byType: (type: NotificationType, params?: NotificationQuery) =>
    [...notificationQueryKeys.all, "type", type, params] as const,
} as const;
