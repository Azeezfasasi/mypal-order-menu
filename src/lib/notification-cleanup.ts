/**
 * Background Notification Cleanup Utility
 *
 * This utility handles background tasks for notification management:
 * - Cleanup old notifications
 * - Batch operations
 * - Health monitoring
 *
 * Usage: Can be called from cron jobs, scheduled tasks, or manually
 */

import { notificationService } from "@/services/notification-service";
import { NotificationType } from "@/types/enums";

interface CleanupStats {
  processed: number;
  deleted: number;
  errors: number;
  duration: number;
}

/**
 * Clean up notifications older than specified days
 */
export async function cleanupOldNotifications(
  olderThanDays: number = 30,
): Promise<CleanupStats> {
  const startTime = Date.now();
  let processed = 0;
  let deleted = 0;
  let errors = 0;

  console.log(
    `🧹 Starting notification cleanup (older than ${olderThanDays} days)`,
  );

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let page = 1;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await notificationService.getUserNotifications({
          page,
          limit,
        });

        const oldNotifications = response.notifications.filter(
          (notification) => new Date(notification.createdAt) < cutoffDate,
        );

        processed += response.notifications.length;

        if (oldNotifications.length > 0) {
          const result = await notificationService.deleteMultiple(
            oldNotifications.map((n) => n.id),
          );
          deleted += result.processed;
          console.log(
            `🗑️ Deleted ${result.processed} old notifications from page ${page}`,
          );
        }

        // Check if we have more pages
        hasMore = response.notifications.length === limit;
        page++;

        // Safety break to prevent infinite loops
        if (page > 100) {
          console.warn("⚠️ Reached maximum page limit (100), stopping cleanup");
          break;
        }
      } catch (error) {
        console.error(`❌ Error processing page ${page}:`, error);
        errors++;
        break;
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ Cleanup completed: ${deleted}/${processed} notifications deleted in ${duration}ms`,
    );

    return { processed, deleted, errors, duration };
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    const duration = Date.now() - startTime;
    return { processed, deleted, errors: errors + 1, duration };
  }
}

/**
 * Archive read notifications older than specified days
 */
export async function archiveReadNotifications(
  olderThanDays: number = 7,
): Promise<CleanupStats> {
  const startTime = Date.now();
  let processed = 0;
  let deleted = 0;
  let errors = 0;

  console.log(
    `📦 Starting read notification archival (older than ${olderThanDays} days)`,
  );

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let page = 1;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await notificationService.getUserNotifications({
          page,
          limit,
        });

        const readOldNotifications = response.notifications.filter(
          (notification) =>
            notification.isRead &&
            new Date(notification.createdAt) < cutoffDate,
        );

        processed += response.notifications.length;

        if (readOldNotifications.length > 0) {
          const result = await notificationService.deleteMultiple(
            readOldNotifications.map((n) => n.id),
          );
          deleted += result.processed;
          console.log(
            `📦 Archived ${result.processed} read notifications from page ${page}`,
          );
        }

        hasMore = response.notifications.length === limit;
        page++;

        if (page > 100) {
          console.warn(
            "⚠️ Reached maximum page limit (100), stopping archival",
          );
          break;
        }
      } catch (error) {
        console.error(`❌ Error processing page ${page}:`, error);
        errors++;
        break;
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ Archival completed: ${deleted}/${processed} notifications archived in ${duration}ms`,
    );

    return { processed, deleted, errors, duration };
  } catch (error) {
    console.error("❌ Archival failed:", error);
    const duration = Date.now() - startTime;
    return { processed, deleted, errors: errors + 1, duration };
  }
}

/**
 * Mark all notifications of a specific type as read
 */
export async function markAllTypeAsRead(
  type: NotificationType,
): Promise<{ processed: number; errors: number }> {
  console.log(`✅ Marking all ${type} notifications as read`);

  try {
    const response = await notificationService.getNotificationsByType(type, {
      page: 1,
      limit: 1000, // Get more at once for efficiency
    });

    const unreadNotifications = response.notifications.filter((n) => !n.isRead);

    if (unreadNotifications.length === 0) {
      console.log(`ℹ️ No unread ${type} notifications found`);
      return { processed: 0, errors: 0 };
    }

    const result = await notificationService.markMultipleAsRead(
      unreadNotifications.map((n) => n.id),
    );

    console.log(`✅ Marked ${result.processed} ${type} notifications as read`);
    return { processed: result.processed, errors: 0 };
  } catch (error) {
    console.error(`❌ Failed to mark ${type} notifications as read:`, error);
    return { processed: 0, errors: 1 };
  }
}

/**
 * Health check and monitoring
 */
export async function notificationHealthCheck(): Promise<{
  healthy: boolean;
  stats: {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
  };
  issues: string[];
}> {
  console.log("🔍 Running notification system health check");

  const issues: string[] = [];
  let healthy = true;

  try {
    // Check service health
    const healthResult = await notificationService.healthCheck();
    if (healthResult.status !== "healthy") {
      issues.push("Notification service is unhealthy");
      healthy = false;
    }

    // Get basic stats
    const unreadCount = await notificationService.getUnreadCount();
    const allNotifications = await notificationService.getUserNotifications({
      page: 1,
      limit: 1000,
    });

    // Count by type
    const byType: Record<NotificationType, number> = {
      [NotificationType.ORDER_UPDATE]: 0,
      [NotificationType.EVENT_REMINDER]: 0,
      [NotificationType.RESERVATION_CONFIRMATION]: 0,
      [NotificationType.PROMOTION]: 0,
      [NotificationType.GENERAL]: 0,
    };

    allNotifications.notifications.forEach((notification) => {
      if (byType[notification.type] !== undefined) {
        byType[notification.type]++;
      }
    });

    // Check for potential issues
    if (unreadCount > 100) {
      issues.push(`High number of unread notifications: ${unreadCount}`);
    }

    if (allNotifications.total > 10000) {
      issues.push(
        `Very high total notifications: ${allNotifications.total} (consider cleanup)`,
      );
    }

    const stats = {
      total: allNotifications.total,
      unread: unreadCount,
      byType,
    };

    console.log("📊 Health check stats:", stats);

    if (issues.length > 0) {
      console.warn("⚠️ Health check issues:", issues);
      healthy = false;
    } else {
      console.log("✅ Notification system is healthy");
    }

    return { healthy, stats, issues };
  } catch (error) {
    console.error("❌ Health check failed:", error);
    return {
      healthy: false,
      stats: {
        total: 0,
        unread: 0,
        byType: {} as Record<NotificationType, number>,
      },
      issues: [
        `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}

/**
 * Complete maintenance routine
 */
export async function runNotificationMaintenance(): Promise<void> {
  console.log("🔧 Starting notification maintenance routine");

  try {
    // 1. Health check first
    const health = await notificationHealthCheck();

    // 2. Archive read notifications older than 7 days
    await archiveReadNotifications(7);

    // 3. Clean up very old notifications (30+ days)
    await cleanupOldNotifications(30);

    // 4. Final health check
    const finalHealth = await notificationHealthCheck();

    console.log("✅ Maintenance routine completed");
    console.log("📊 Before:", health.stats);
    console.log("📊 After:", finalHealth.stats);
  } catch (error) {
    console.error("❌ Maintenance routine failed:", error);
  }
}

// Export for use in different contexts
const notificationCleanup = {
  cleanupOldNotifications,
  archiveReadNotifications,
  markAllTypeAsRead,
  notificationHealthCheck,
  runNotificationMaintenance,
};

export default notificationCleanup;
