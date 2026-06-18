/**
 * Notification Service - Axios-based utilities for notification management
 *
 * This service provides standalone Axios-based functions for notification operations
 * that can be used outside of React components, including:
 * - Service workers
 * - Server-side operations
 * - Background tasks
 * - Non-React contexts
 */

import type { IBusinessSuccessResponse } from "@/types/api";
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
import axios, { AxiosInstance } from "axios";
import { ENDPOINTS } from "./api/endpoints";

// Create a dedicated Axios instance for notification service
const createNotificationClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL:
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
    },
  });

  // Request interceptor for auth token (if available)
  client.interceptors.request.use(
    (config) => {
      // Try to get auth token from various sources
      if (typeof window !== "undefined") {
        const token =
          localStorage.getItem("auth-token") ||
          sessionStorage.getItem("auth-token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      console.log("🔔 Notification API Request:", {
        url: config.url,
        method: config.method?.toUpperCase(),
        hasAuth: !!config.headers.Authorization,
      });

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => {
      console.log("✅ Notification API Success:", {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
      return response;
    },
    (error) => {
      console.error("❌ Notification API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
      return Promise.reject(error);
    },
  );

  return client;
};

class NotificationService {
  private client: AxiosInstance;

  constructor() {
    this.client = createNotificationClient();
  }

  /**
   * Register FCM device token
   */
  async registerToken(data: RegisterTokenDto): Promise<{ message: string }> {
    try {
      const response = await this.client.post<
        IBusinessSuccessResponse<{ message: string }>
      >(ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, data);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to register device token");
    }
  }

  /**
   * Remove all device tokens for current user
   */
  async removeUserTokens(): Promise<{ message: string }> {
    try {
      const response = await this.client.delete<
        IBusinessSuccessResponse<{ message: string }>
      >(ENDPOINTS.NOTIFICATIONS.REMOVE_USER_TOKENS);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to remove device tokens");
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    params?: NotificationQuery,
  ): Promise<NotificationResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.sort) queryParams.append("sort", params.sort);
      if (params?.order) queryParams.append("order", params.order);

      const url = `${ENDPOINTS.NOTIFICATIONS.GET_ALL}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response =
        await this.client.get<IBusinessSuccessResponse<NotificationResponse>>(
          url,
        );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch notifications");
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.client.get<
        IBusinessSuccessResponse<UnreadCountResponse>
      >(ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT);
      return response.data.data.count;
    } catch (error) {
      throw this.handleError(error, "Failed to get unread count");
    }
  }

  /**
   * Get notifications by type
   */
  async getNotificationsByType(
    type: NotificationType,
    params?: NotificationQuery,
  ): Promise<NotificationResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.sort) queryParams.append("sort", params.sort);
      if (params?.order) queryParams.append("order", params.order);

      const url = `${ENDPOINTS.NOTIFICATIONS.GET_BY_TYPE(type)}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response =
        await this.client.get<IBusinessSuccessResponse<NotificationResponse>>(
          url,
        );
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch ${type} notifications`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ message: string }> {
    try {
      const response = await this.client.patch<
        IBusinessSuccessResponse<{ message: string }>
      >(ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId));
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string }> {
    try {
      const response = await this.client.patch<
        IBusinessSuccessResponse<{ message: string }>
      >(ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to mark all notifications as read");
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
  ): Promise<{ message: string }> {
    try {
      const response = await this.client.delete<
        IBusinessSuccessResponse<{ message: string }>
      >(ENDPOINTS.NOTIFICATIONS.DELETE(notificationId));
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to delete notification");
    }
  }

  /**
   * Send order update notification (Admin function)
   */
  async sendOrderUpdate(data: OrderUpdateDto): Promise<{ message: string }> {
    try {
      const response = await this.client.post<
        IBusinessSuccessResponse<{ message: string }>
      >(ENDPOINTS.NOTIFICATIONS.SEND_ORDER_UPDATE, data);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to send order update notification");
    }
  }

  /**
   * Send event reminder notification (Admin function)
   */
  async sendEventReminder(
    data: EventReminderDto,
  ): Promise<{ message: string }> {
    try {
      const response = await this.client.post<
        IBusinessSuccessResponse<{ message: string }>
      >(ENDPOINTS.NOTIFICATIONS.SEND_EVENT_REMINDER, data);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to send event reminder");
    }
  }

  /**
   * Send reservation confirmation notification (Admin function)
   */
  async sendReservationConfirmation(
    data: ReservationConfirmationDto,
  ): Promise<{ message: string }> {
    try {
      const response = await this.client.post<
        IBusinessSuccessResponse<{ message: string }>
      >(ENDPOINTS.NOTIFICATIONS.SEND_RESERVATION_CONFIRMATION, data);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error, "Failed to send reservation confirmation");
    }
  }

  /**
   * Batch operations
   */
  async markMultipleAsRead(
    notificationIds: string[],
  ): Promise<{ message: string; processed: number }> {
    try {
      const results = await Promise.allSettled(
        notificationIds.map((id) => this.markAsRead(id)),
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled",
      ).length;

      return {
        message: `Marked ${successful} of ${notificationIds.length} notifications as read`,
        processed: successful,
      };
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to mark multiple notifications as read",
      );
    }
  }

  async deleteMultiple(
    notificationIds: string[],
  ): Promise<{ message: string; processed: number }> {
    try {
      const results = await Promise.allSettled(
        notificationIds.map((id) => this.deleteNotification(id)),
      );

      const successful = results.filter(
        (result) => result.status === "fulfilled",
      ).length;

      return {
        message: `Deleted ${successful} of ${notificationIds.length} notifications`,
        processed: successful,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to delete multiple notifications");
    }
  }

  /**
   * Health check for notification service
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      //   const response = await this.client.get("/notifications/health");
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Error handler for consistent error formatting
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        defaultMessage;
      return new Error(message);
    }

    return error instanceof Error ? error : new Error(defaultMessage);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for custom instances
export { NotificationService };

// Note: Individual methods are not exported to avoid naming conflicts with notification-api.
// Use notificationService.methodName() instead of importing individual functions.
