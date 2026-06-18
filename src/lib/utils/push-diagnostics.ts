/**
 * Push Notification Diagnostics and Testing Utilities
 *
 * Comprehensive utilities for testing and diagnosing push notification issues
 */

import {
  getBrowserInfo,
  getNotificationPermission,
  isBrowser,
  isNotificationAPISupported,
  isServiceWorkerSupported,
} from "./browser-detection";

/**
 * Diagnostic helper to test push service connectivity
 */
export const testPushServiceConnectivity = async (): Promise<{
  success: boolean;
  details: string[];
  recommendations: string[];
}> => {
  const details: string[] = [];
  const recommendations: string[] = [];
  let success = true;

  try {
    // Test 1: Basic feature detection
    if (!isServiceWorkerSupported()) {
      details.push("❌ Service Worker not supported");
      recommendations.push(
        "Use a modern browser (Chrome, Firefox, Safari, Edge)",
      );
      success = false;
    } else {
      details.push("✅ Service Worker supported");
    }

    if (!("PushManager" in window)) {
      details.push("❌ Push API not supported");
      recommendations.push("Use a browser that supports push notifications");
      success = false;
    } else {
      details.push("✅ Push API supported");
    }

    if (!isNotificationAPISupported()) {
      details.push("❌ Notification API not supported");
      recommendations.push("Enable notifications in browser settings");
      success = false;
    } else {
      details.push("✅ Notification API supported");
    }

    // Test 2: Permission state
    const permission = getNotificationPermission();
    if (permission === "denied") {
      details.push("❌ Notification permission denied");
      recommendations.push("Allow notifications in browser settings");
      success = false;
    } else if (permission === "granted") {
      details.push("✅ Notification permission granted");
    } else {
      details.push("⚠️ Notification permission not requested");
    }

    // Test 3: Service worker registration
    if (isServiceWorkerSupported()) {
      try {
        const registration = await navigator.serviceWorker.ready;
        details.push("✅ Service worker registered and ready");

        // Test 4: Push manager
        if ("pushManager" in registration) {
          details.push("✅ Push manager available");

          // Test 5: Current subscription
          try {
            const subscription =
              await registration.pushManager.getSubscription();
            if (subscription) {
              details.push("✅ Active push subscription found");
              details.push(
                `📍 Endpoint: ${subscription.endpoint.substring(0, 50)}...`,
              );
            } else {
              details.push("⚠️ No active push subscription");
            }
          } catch (subErr) {
            details.push(
              `❌ Cannot check push subscription: ${(subErr as Error).message}`,
            );
            recommendations.push("Clear browser data and try again");
            success = false;
          }
        } else {
          details.push("❌ Push manager not available");
          success = false;
        }
      } catch (swErr) {
        details.push(`❌ Service worker error: ${(swErr as Error).message}`);
        recommendations.push("Clear browser cache and reload");
        success = false;
      }
    }

    // Test 6: Browser-specific checks
    const browserInfo = getBrowserInfo();
    if (browserInfo.isBrave) {
      details.push(
        "⚠️ Brave browser detected - may require shield adjustments",
      );
      recommendations.push("Disable Brave Shields for this site");
    }

    if (browserInfo.name === "Firefox") {
      details.push("⚠️ Firefox detected - may have push service issues");
      recommendations.push(
        "Ensure Firefox is up to date and Enhanced Tracking Protection is off",
      );
    }

    return { success, details, recommendations };
  } catch (error) {
    details.push(`❌ Test failed: ${(error as Error).message}`);
    recommendations.push("Contact support with these details");
    return { success: false, details, recommendations };
  }
};

/**
 * Debug configuration and environment
 */
export const debugEnvironment = () => {
  const browserInfo = getBrowserInfo();

  console.log("\n🌐 Browser Environment Debug:");
  console.log(`- Browser: ${browserInfo.name}`);
  console.log(`- Is Brave: ${browserInfo.isBrave ? "Yes" : "No"}`);
  console.log(`- Is macOS: ${browserInfo.isMacOS ? "Yes" : "No"}`);
  console.log(`- Is Mobile: ${browserInfo.isMobile ? "Yes" : "No"}`);
  console.log(`- Notification Permission: ${getNotificationPermission()}`);

  // Check service worker state
  if (isServiceWorkerSupported()) {
    navigator.serviceWorker.ready
      .then((registration) => {
        console.log("- Service Worker: ✓ Ready");
        console.log(`- SW Scope: ${registration.scope}`);
        console.log(`- SW State: ${registration.active?.state || "unknown"}`);

        // Check push manager
        if ("pushManager" in registration) {
          registration.pushManager
            .getSubscription()
            .then((subscription) => {
              console.log(
                `- Push Subscription: ${subscription ? "✓ Active" : "✗ None"}`,
              );
              if (subscription) {
                console.log(
                  `- Push Endpoint: ${subscription.endpoint.substring(0, 50)}...`,
                );
              }
            })
            .catch((err) => {
              console.log(`- Push Subscription Check Failed: ${err.message}`);
            });
        } else {
          console.log("- Push Manager: ✗ Not Available");
        }
      })
      .catch((err) => {
        console.log(`- Service Worker: ✗ Error - ${err.message}`);
      });
  } else {
    console.log("- Service Worker: ✗ Not Supported");
  }
};

/**
 * Test if a specific browser feature is available
 */
export const testBrowserFeature = (feature: string): boolean => {
  if (!isBrowser()) return false;

  const features: Record<string, () => boolean> = {
    serviceWorker: () => "serviceWorker" in navigator,
    pushManager: () => "PushManager" in window,
    notification: () => "Notification" in window,
    messageChannel: () => "MessageChannel" in window,
    indexedDB: () => "indexedDB" in window,
    localStorage: () => "localStorage" in window,
    sessionStorage: () => "sessionStorage" in window,
    webWorker: () => "Worker" in window,
    fetch: () => "fetch" in window,
  };

  const test = features[feature];
  if (!test) {
    console.warn(`Unknown feature test: ${feature}`);
    return false;
  }

  try {
    return test();
  } catch (error) {
    console.warn(`Feature test failed for ${feature}:`, error);
    return false;
  }
};

/**
 * Get a summary of all available browser features
 */
export const getBrowserFeatureSummary = (): Record<string, boolean> => {
  const features = [
    "serviceWorker",
    "pushManager",
    "notification",
    "messageChannel",
    "indexedDB",
    "localStorage",
    "sessionStorage",
    "webWorker",
    "fetch",
  ];

  const summary: Record<string, boolean> = {};
  features.forEach((feature) => {
    summary[feature] = testBrowserFeature(feature);
  });

  return summary;
};
