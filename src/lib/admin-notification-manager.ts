/**
 * Admin Notification Manager
 *
 * This utility provides admin functions for sending notifications
 * to users. Can be used in admin panels, API routes, or background jobs.
 */

import {
  sendEventReminderNotification,
  sendOrderUpdateNotification,
  sendReservationConfirmationNotification,
} from "@/services/api/notification-api";
import { notificationService } from "@/services/notification-service";
import type {
  EventReminderDto,
  OrderUpdateDto,
  ReservationConfirmationDto,
} from "@/types/notification-types";

interface NotificationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Send order update notification to a user
 */
export async function sendOrderUpdate(
  data: OrderUpdateDto,
): Promise<NotificationResult> {
  try {
    console.log(`📦 Sending order update notification to user ${data.userId}`);

    const result = await sendOrderUpdateNotification(data);

    console.log(
      `✅ Order update notification sent successfully: ${result.message}`,
    );
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Failed to send order update notification:`, errorMessage);

    return {
      success: false,
      message: "Failed to send order update notification",
      error: errorMessage,
    };
  }
}

/**
 * Send event reminder notification to a user
 */
export async function sendEventReminder(
  data: EventReminderDto,
): Promise<NotificationResult> {
  try {
    console.log(
      `📅 Sending event reminder notification to user ${data.userId}`,
    );

    const result = await sendEventReminderNotification(data);

    console.log(
      `✅ Event reminder notification sent successfully: ${result.message}`,
    );
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Failed to send event reminder notification:`,
      errorMessage,
    );

    return {
      success: false,
      message: "Failed to send event reminder notification",
      error: errorMessage,
    };
  }
}

/**
 * Send reservation confirmation notification to a user
 */
export async function sendReservationConfirmation(
  data: ReservationConfirmationDto,
): Promise<NotificationResult> {
  try {
    console.log(
      `🎟️ Sending reservation confirmation notification to user ${data.userId}`,
    );

    const result = await sendReservationConfirmationNotification(data);

    console.log(
      `✅ Reservation confirmation notification sent successfully: ${result.message}`,
    );
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `❌ Failed to send reservation confirmation notification:`,
      errorMessage,
    );

    return {
      success: false,
      message: "Failed to send reservation confirmation notification",
      error: errorMessage,
    };
  }
}

/**
 * Batch send order updates to multiple users
 */
export async function batchSendOrderUpdates(
  orders: OrderUpdateDto[],
): Promise<{
  successful: number;
  failed: number;
  results: NotificationResult[];
}> {
  console.log(`📦 Batch sending ${orders.length} order update notifications`);

  const results = await Promise.allSettled(
    orders.map((order) => sendOrderUpdate(order)),
  );

  const finalResults: NotificationResult[] = results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : {
          success: false,
          message: "Promise rejected",
          error: result.reason,
        },
  );

  const successful = finalResults.filter((r) => r.success).length;
  const failed = finalResults.length - successful;

  console.log(
    `📊 Batch order updates completed: ${successful} successful, ${failed} failed`,
  );

  return { successful, failed, results: finalResults };
}

/**
 * Batch send event reminders to multiple users
 */
export async function batchSendEventReminders(
  events: EventReminderDto[],
): Promise<{
  successful: number;
  failed: number;
  results: NotificationResult[];
}> {
  console.log(`📅 Batch sending ${events.length} event reminder notifications`);

  const results = await Promise.allSettled(
    events.map((event) => sendEventReminder(event)),
  );

  const finalResults: NotificationResult[] = results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : {
          success: false,
          message: "Promise rejected",
          error: result.reason,
        },
  );

  const successful = finalResults.filter((r) => r.success).length;
  const failed = finalResults.length - successful;

  console.log(
    `📊 Batch event reminders completed: ${successful} successful, ${failed} failed`,
  );

  return { successful, failed, results: finalResults };
}

/**
 * Send notification with retry logic
 */
export async function sendNotificationWithRetry<
  T extends OrderUpdateDto | EventReminderDto | ReservationConfirmationDto,
>(
  type: "order" | "event" | "reservation",
  data: T,
  maxRetries: number = 3,
): Promise<NotificationResult> {
  let lastError: string = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔄 Attempt ${attempt}/${maxRetries} to send ${type} notification`,
      );

      let result: NotificationResult;

      switch (type) {
        case "order":
          result = await sendOrderUpdate(data as OrderUpdateDto);
          break;
        case "event":
          result = await sendEventReminder(data as EventReminderDto);
          break;
        case "reservation":
          result = await sendReservationConfirmation(
            data as ReservationConfirmationDto,
          );
          break;
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      if (result.success) {
        if (attempt > 1) {
          console.log(
            `✅ ${type} notification succeeded on attempt ${attempt}`,
          );
        }
        return result;
      }

      lastError = result.error || result.message;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      console.warn(`⚠️ Attempt ${attempt} failed: ${lastError}`);
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, etc.
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(
    `❌ All ${maxRetries} attempts failed for ${type} notification`,
  );
  return {
    success: false,
    message: `Failed after ${maxRetries} attempts`,
    error: lastError,
  };
}

/**
 * Admin dashboard stats using direct Axios calls
 */
export async function getAdminNotificationStats(): Promise<{
  unreadCount: number;
  totalNotifications: number;
  systemHealth: boolean;
  error?: string;
}> {
  try {
    console.log("📊 Fetching admin notification stats");

    // Use the service for direct API calls
    const [unreadCount, notifications, health] = await Promise.allSettled([
      notificationService.getUnreadCount(),
      notificationService.getUserNotifications({ page: 1, limit: 1 }), // Just get total count
      notificationService.healthCheck(),
    ]);

    const stats = {
      unreadCount: unreadCount.status === "fulfilled" ? unreadCount.value : 0,
      totalNotifications:
        notifications.status === "fulfilled" ? notifications.value.total : 0,
      systemHealth:
        health.status === "fulfilled"
          ? health.value.status === "healthy"
          : false,
    };

    console.log("📊 Admin stats:", stats);
    return stats;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Failed to fetch admin stats:", errorMessage);

    return {
      unreadCount: 0,
      totalNotifications: 0,
      systemHealth: false,
      error: errorMessage,
    };
  }
}

// Export all functions
export const adminNotificationManager = {
  sendOrderUpdate,
  sendEventReminder,
  sendReservationConfirmation,
  batchSendOrderUpdates,
  batchSendEventReminders,
  sendNotificationWithRetry,
  getAdminNotificationStats,
};

export default adminNotificationManager;
