import { NotificationType, Platform, SortType } from "./enums";

export interface RegisterTokenDto {
  token: string;
  platform: Platform;
  deviceInfo?: string;
}

export interface CreateNotificationDto {
  userId: string;
  businessId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
}

export interface Notification {
  id: string;
  userId: string;
  businessId?: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationDto {
  page?: number;
  limit?: number;
}

export interface NotificationQuery extends PaginationDto {
  sort?: string;
  order?: SortType;
}

export interface NotificationResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  notifications?: Notification[];
}

export interface UnreadCountResponse {
  count: number;
}

export interface OrderUpdateDto {
  userId: string;
  orderId: string;
  status: string;
}

export interface EventReminderDto {
  userId: string;
  eventId: string;
  eventTitle: string;
  reminderTime: string;
}

export interface ReservationConfirmationDto {
  userId: string;
  reservationId: string;
  businessName: string;
  dateTime: string;
}
