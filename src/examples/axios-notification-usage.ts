/**
 * Axios-Based Notification API Usage Examples
 *
 * This file demonstrates practical examples of using the new Axios-based
 * notification functions in different contexts.
 */

// ============================================================================
// Example 1: Background Cleanup Job
// ============================================================================

import notificationCleanup from "@/lib/notification-cleanup";

/**
 * Example: Daily cleanup job that can be run via cron or scheduled task
 */
export async function dailyNotificationCleanup() {
  console.log("🕐 Running daily notification cleanup job");

  try {
    // Run the complete maintenance routine
    await notificationCleanup.runNotificationMaintenance();

    console.log("✅ Daily cleanup completed successfully");
  } catch (error) {
    console.error("❌ Daily cleanup failed:", error);
  }
}

// ============================================================================
// Example 2: Admin Panel Functions
// ============================================================================

import { adminNotificationManager } from "@/lib/admin-notification-manager";

/**
 * Example: Admin function to send order updates to multiple customers
 */
export async function sendBulkOrderUpdates(
  orders: Array<{
    userId: string;
    orderId: string;
    status: string;
  }>,
) {
  console.log(`📦 Sending order updates to ${orders.length} customers`);

  const orderDtos = orders.map((order) => ({
    userId: order.userId,
    orderId: order.orderId,
    status: order.status,
  }));

  const results =
    await adminNotificationManager.batchSendOrderUpdates(orderDtos);

  console.log(
    `📊 Bulk order updates: ${results.successful} successful, ${results.failed} failed`,
  );
  return results;
}

/**
 * Example: Get admin dashboard stats
 */
export async function getNotificationDashboardStats() {
  console.log("📊 Fetching notification dashboard stats");

  const stats = await adminNotificationManager.getAdminNotificationStats();

  return {
    unreadCount: stats.unreadCount,
    totalNotifications: stats.totalNotifications,
    systemHealth: stats.systemHealth,
    healthStatus: stats.systemHealth ? "Healthy" : "Issues Detected",
  };
}

// ============================================================================
// Example 3: Service Worker Integration
// ============================================================================

import { serviceWorkerNotifications } from "@/lib/service-worker-notifications";

/**
 * Example: Update notification badge when user reads notifications
 */
export async function handleNotificationRead(notificationId: string) {
  console.log(`📖 User read notification: ${notificationId}`);

  try {
    // Try to mark as read via service worker first (non-blocking)
    const swSuccess =
      await serviceWorkerNotifications.markNotificationAsReadInServiceWorker(
        notificationId,
      );

    if (swSuccess) {
      // Update badge count
      await serviceWorkerNotifications.updateNotificationBadge();
      console.log("✅ Notification marked as read via service worker");
    } else {
      // Fallback to direct API call
      console.log("⚠️ Service worker unavailable, using direct API call");
      const { markNotificationAsRead } = await import(
        "@/services/api/notification-api"
      );
      await markNotificationAsRead(notificationId);

      // Manually get count and update badge
      const { getUnreadNotificationCount } = await import(
        "@/services/api/notification-api"
      );
      const count = await getUnreadNotificationCount();
      await serviceWorkerNotifications.updateNotificationBadge(count.count);
    }
  } catch (error) {
    console.error("❌ Failed to handle notification read:", error);
  }
}

/**
 * Example: Initialize notification system with service worker
 */
export async function initializeNotificationSystem() {
  console.log("🚀 Initializing notification system");

  try {
    // Check service worker health
    const health = await serviceWorkerNotifications.checkServiceWorkerHealth();
    console.log("🔍 Service worker health:", health);

    if (health.available && health.notifications) {
      // Update initial badge count
      await serviceWorkerNotifications.updateNotificationBadge();

      // Schedule background sync if supported
      const syncScheduled =
        await serviceWorkerNotifications.scheduleNotificationSync();
      if (syncScheduled) {
        console.log("✅ Background sync scheduled");
      }

      console.log("✅ Notification system initialized with service worker");
    } else {
      console.log(
        "⚠️ Service worker not available, using direct API calls only",
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize notification system:", error);
  }
}

// ============================================================================
// Example 4: Direct API Usage (Non-React Context)
// ============================================================================

import {
  getUserNotifications,
  markAllNotificationsAsRead,
  registerDeviceToken,
} from "@/services/api/notification-api";
import { Platform, SortType } from "@/types/enums";

/**
 * Example: Register FCM token in a web worker or service worker
 */
export async function registerTokenInWorker(token: string, userAgent: string) {
  console.log("🔧 Registering FCM token in worker context");

  try {
    const result = await registerDeviceToken({
      token,
      platform: Platform.WEB,
      deviceInfo: userAgent,
    });

    console.log("✅ Token registered in worker:", result.message);
    return true;
  } catch (error) {
    console.error("❌ Failed to register token in worker:", error);
    return false;
  }
}

/**
 * Example: Fetch notifications for server-side rendering or API route
 */
export async function getNotificationsForSSR(page: number = 1) {
  console.log(`📄 Fetching notifications for SSR (page ${page})`);

  try {
    const notifications = await getUserNotifications({
      page,
      limit: 10,
      sort: "createdAt",
      order: SortType.DESC,
    });

    console.log(
      `✅ Fetched ${notifications.notifications.length} notifications for SSR`,
    );
    return notifications;
  } catch (error) {
    console.error("❌ Failed to fetch notifications for SSR:", error);
    return {
      notifications: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

/**
 * Example: Bulk mark as read for admin operations
 */
export async function adminMarkAllAsRead() {
  console.log("👨‍💼 Admin marking all notifications as read");

  try {
    const result = await markAllNotificationsAsRead();
    console.log("✅ Admin bulk mark as read:", result.message);
    return result;
  } catch (error) {
    console.error("❌ Admin bulk mark as read failed:", error);
    throw error;
  }
}

// ============================================================================
// Example 5: Error Handling and Retry Logic
// ============================================================================

/**
 * Example: Robust notification sending with retry logic
 */
export async function sendCriticalOrderUpdate(
  userId: string,
  orderId: string,
  status: string,
) {
  console.log(`🚨 Sending critical order update: ${orderId} -> ${status}`);

  try {
    const result = await adminNotificationManager.sendNotificationWithRetry(
      "order",
      { userId, orderId, status },
      3, // Max 3 retries
    );

    if (result.success) {
      console.log("✅ Critical order update sent successfully");
      return result;
    } else {
      console.error(
        "❌ Critical order update failed after retries:",
        result.error,
      );
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("❌ Critical order update error:", error);
    throw error;
  }
}

// ============================================================================
// Example 6: Monitoring and Health Checks
// ============================================================================

/**
 * Example: Health monitoring that can run in a monitoring service
 */
export async function monitorNotificationHealth() {
  console.log("🔍 Running notification system health monitoring");

  try {
    const health = await notificationCleanup.notificationHealthCheck();

    if (!health.healthy) {
      console.warn("⚠️ Notification system issues detected:", health.issues);

      // Could send alerts to monitoring service here
      // await sendHealthAlert(health);
    }

    return health;
  } catch (error) {
    console.error("❌ Health monitoring failed:", error);
    return {
      healthy: false,
      stats: { total: 0, unread: 0, byType: {} },
      issues: ["Health check failed"],
    };
  }
}

// Export all examples
export const notificationExamples = {
  dailyNotificationCleanup,
  sendBulkOrderUpdates,
  getNotificationDashboardStats,
  handleNotificationRead,
  initializeNotificationSystem,
  registerTokenInWorker,
  getNotificationsForSSR,
  adminMarkAllAsRead,
  sendCriticalOrderUpdate,
  monitorNotificationHealth,
};

export default notificationExamples;
