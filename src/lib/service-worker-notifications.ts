/**
 * Service Worker Notification Utilities
 * 
 * This utility provides functions to communicate with the service worker    // Update browser badge (if supported)
    if ('setAppBadge' in navigator) {
      const nav = navigator as typeof navigator & {
        setAppBadge?: (count: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
      };
      
      if (badgeCount > 0 && nav.setAppBadge) {
        await nav.setAppBadge(badgeCount);
        console.log(`📱 Browser badge updated: ${badgeCount}`);
      } else if (nav.clearAppBadge) {
        await nav.clearAppBadge();
        console.log('📱 Browser badge cleared');
      }
    }tification operations that can run in the background.
 */

/**
 * Check if service worker is available and active
 */
export function isServiceWorkerAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    !!navigator.serviceWorker.controller
  );
}

/**
 * Send a message to the service worker and get a response
 */
async function sendMessageToServiceWorker<T = unknown>(
  message: Record<string, unknown>,
  timeout: number = 5000,
): Promise<T> {
  if (!isServiceWorkerAvailable()) {
    throw new Error("Service worker not available");
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    const timeoutId = setTimeout(() => {
      reject(new Error("Service worker message timeout"));
    }, timeout);

    messageChannel.port1.onmessage = (event) => {
      clearTimeout(timeoutId);
      if (event.data.success) {
        resolve(event.data);
      } else {
        reject(
          new Error(event.data.error || "Service worker operation failed"),
        );
      }
    };

    navigator.serviceWorker.controller!.postMessage(message, [
      messageChannel.port2,
    ]);
  });
}

/**
 * Mark a notification as read using the service worker
 */
export async function markNotificationAsReadInServiceWorker(
  notificationId: string,
): Promise<boolean> {
  try {
    console.log(
      `🔄 Marking notification ${notificationId} as read via service worker`,
    );

    const result = await sendMessageToServiceWorker<{ success: boolean }>({
      type: "MARK_NOTIFICATION_READ",
      data: { notificationId },
    });

    console.log(
      `✅ Notification ${notificationId} marked as read via service worker`,
    );
    return result.success;
  } catch (error) {
    console.error(
      "❌ Failed to mark notification as read via service worker:",
      error,
    );
    return false;
  }
}

/**
 * Get unread notification count using the service worker
 */
export async function getUnreadCountFromServiceWorker(): Promise<number> {
  try {
    console.log("🔄 Getting unread count via service worker");

    const result = await sendMessageToServiceWorker<{
      success: boolean;
      count: number;
    }>({
      type: "GET_UNREAD_COUNT",
    });

    console.log(`✅ Got unread count via service worker: ${result.count}`);
    return result.count;
  } catch (error) {
    console.error("❌ Failed to get unread count via service worker:", error);
    return 0;
  }
}

/**
 * Get service worker version
 */
export async function getServiceWorkerVersion(): Promise<{
  version: string;
  buildTime: string;
} | null> {
  try {
    console.log("🔄 Getting service worker version");

    const result = await sendMessageToServiceWorker<{
      version: string;
      buildTime: string;
    }>({
      type: "GET_VERSION",
    });

    console.log(`✅ Service worker version: ${result.version}`);
    return result;
  } catch (error) {
    console.error("❌ Failed to get service worker version:", error);
    return null;
  }
}

/**
 * Utility to update badge count in the browser
 */
export async function updateNotificationBadge(count?: number): Promise<void> {
  try {
    // Get count from service worker if not provided
    const badgeCount =
      count !== undefined ? count : await getUnreadCountFromServiceWorker();

    // Update browser badge (if supported)
    if ("setAppBadge" in navigator) {
      const nav = navigator as typeof navigator & {
        setAppBadge?: (count: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
      };

      if (badgeCount > 0 && nav.setAppBadge) {
        await nav.setAppBadge(badgeCount);
        console.log(`📱 Browser badge updated: ${badgeCount}`);
      } else if (nav.clearAppBadge) {
        await nav.clearAppBadge();
        console.log("📱 Browser badge cleared");
      }
    }

    // Update favicon badge (fallback for browsers without setAppBadge)
    updateFaviconBadge(badgeCount);
  } catch (error) {
    console.warn("⚠️ Failed to update notification badge:", error);
  }
}

/**
 * Update favicon with notification count
 */
function updateFaviconBadge(count: number): void {
  try {
    const favicon = document.querySelector(
      'link[rel="icon"]',
    ) as HTMLLinkElement;
    if (!favicon) return;

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a new image for the original favicon
    const img = new Image();
    img.onload = () => {
      // Draw original favicon
      ctx.drawImage(img, 0, 0, 32, 32);

      // Draw badge if count > 0
      if (count > 0) {
        // Badge background
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(24, 8, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Badge text
        ctx.fillStyle = "white";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(count > 99 ? "99+" : count.toString(), 24, 8);
      }

      // Update favicon
      favicon.href = canvas.toDataURL("image/png");
    };

    img.src = favicon.href;
  } catch (error) {
    console.warn("⚠️ Failed to update favicon badge:", error);
  }
}

/**
 * Background sync for notifications (if supported)
 */
export async function scheduleNotificationSync(): Promise<boolean> {
  try {
    if (!isServiceWorkerAvailable()) return false;

    const registration = await navigator.serviceWorker.ready;

    if ("sync" in registration) {
      const syncReg = registration as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      };

      if (syncReg.sync) {
        await syncReg.sync.register("notification-sync");
        console.log("🔄 Notification background sync scheduled");
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn("⚠️ Failed to schedule notification sync:", error);
    return false;
  }
}

/**
 * Check service worker health and notification capabilities
 */
export async function checkServiceWorkerHealth(): Promise<{
  available: boolean;
  version?: string;
  notifications: boolean;
  badgeSupport: boolean;
  syncSupport: boolean;
}> {
  const health: {
    available: boolean;
    version?: string;
    notifications: boolean;
    badgeSupport: boolean;
    syncSupport: boolean;
  } = {
    available: isServiceWorkerAvailable(),
    notifications: false,
    badgeSupport: "setAppBadge" in navigator,
    syncSupport: false,
  };

  if (health.available) {
    try {
      // Get version
      const versionInfo = await getServiceWorkerVersion();
      if (versionInfo) {
        health.version = versionInfo.version;
      }

      // Test notification capability
      const testCount = await getUnreadCountFromServiceWorker();
      health.notifications = typeof testCount === "number";

      // Check sync support
      const registration = await navigator.serviceWorker.ready;
      health.syncSupport = "sync" in registration;
    } catch (error) {
      console.warn("⚠️ Service worker health check failed:", error);
    }
  }

  console.log("🔍 Service worker health:", health);
  return health;
}

// Export utilities
export const serviceWorkerNotifications = {
  isServiceWorkerAvailable,
  markNotificationAsReadInServiceWorker,
  getUnreadCountFromServiceWorker,
  getServiceWorkerVersion,
  updateNotificationBadge,
  scheduleNotificationSync,
  checkServiceWorkerHealth,
};

export default serviceWorkerNotifications;
