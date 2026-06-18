/**
 * Firebase Configuration and Core FCM Functionality
 *
 * This file contains only Firebase-specific configuration and core FCM token management.
 * Browser detection and error analysis utilities have been moved to separate utility files.
 */

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  MessagePayload,
  Messaging,
  onMessage,
} from "firebase/messaging";

// Import utilities from separate modules
import { isBrowser, isPushSupported } from "@/lib/utils/browser-detection";
import { analyzeNotificationError } from "@/lib/utils/notification-error-analysis";
import { debugEnvironment } from "@/lib/utils/push-diagnostics";
import {
  getPushSupportStatus,
  isMessagingSupportedAsync,
  type PushSupportInfo,
} from "@/lib/utils/push-notification-support";

// Re-export utilities for backward compatibility
export {
  getBrowserInfo,
  getNotificationPermission,
  isBrowser,
  isPushSupported,
} from "@/lib/utils/browser-detection";
export { analyzeNotificationError } from "@/lib/utils/notification-error-analysis";
export { testPushServiceConnectivity } from "@/lib/utils/push-diagnostics";
export {
  getPushSupportStatus,
  isMessagingSupportedAsync,
  showPushUnsupportedAlert,
  showPushUnsupportedAlertAsync,
  type PushSupportInfo,
} from "@/lib/utils/push-notification-support";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (guarded to avoid duplicate initialization during SSR or
// multiple module imports). We initialize only on the client.
let app: ReturnType<typeof initializeApp> | undefined = undefined;
if (isBrowser()) {
  try {
    if (getApps().length) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.warn("Firebase app initialization warning:", e);
    try {
      app = getApp();
    } catch (err) {
      console.warn("Firebase app getApp fallback failed:", err);
      app = undefined;
    }
  }
}

// Initialize Firebase Cloud Messaging (only on client)
let messaging: Messaging | null = null;
if (isBrowser()) {
  try {
    // Use Firebase's isSupported() to check whether the current browser
    // supports the Messaging SDK. This is the reliable, recommended check.
    isMessagingSupported()
      .then((supported) => {
        if (supported && app) {
          try {
            messaging = getMessaging(app);
            console.log(
              "Firebase messaging initialized in client (isSupported=true)",
            );
          } catch (e) {
            console.warn("Firebase messaging getMessaging error:", e);
            messaging = null;
          }
        } else {
          console.warn(
            "Firebase messaging not initialized: firebase.messaging.isSupported() returned false or app not available",
          );
          messaging = null;
        }
      })
      .catch((err) => {
        console.warn("Error checking firebase.messaging.isSupported():", err);
        messaging = null;
      });
  } catch (e) {
    console.warn("Firebase messaging initialization error:", e);
    messaging = null;
  }
}

// Global declarations for window helpers (token promise caching)
declare global {
  interface Window {
    __fcmTokenPromise?: Promise<string | null>;
    __registeredFCMToken?: string | null;
  }
}

// Helper narrow type (avoid any)
const getWindow = () => (isBrowser() ? window : undefined);

// Utility to reset cached token promise (manual retry)
export const resetFcmTokenPromise = () => {
  const w = getWindow();
  if (w) {
    delete w.__fcmTokenPromise;
    delete w.__registeredFCMToken;
  }
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
};

// Debug function to check Firebase configuration
export const debugFirebaseConfig = () => {
  console.log("🔍 Firebase Configuration Debug:");
  console.log(
    "- API Key:",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✓ Set" : "✗ Missing",
  );
  console.log(
    "- Auth Domain:",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✓ Set" : "✗ Missing",
  );
  console.log(
    "- Project ID:",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✓ Set" : "✗ Missing",
  );
  console.log(
    "- Messaging Sender ID:",
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
      ? "✓ Set"
      : "✗ Missing",
  );
  console.log(
    "- App ID:",
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "✓ Set" : "✗ Missing",
  );
  console.log(
    "- VAPID Key:",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "✓ Set" : "✗ Missing",
  );
  console.log(
    "- Firebase configured:",
    isFirebaseConfigured() ? "✓ Yes" : "✗ No",
  );
  console.log("- Push supported:", isPushSupported() ? "✓ Yes" : "✗ No");
  console.log("- Messaging available:", messaging ? "✓ Yes" : "✗ No");

  // Also run environment debug
  debugEnvironment();

  // Show browser-specific guidance
  import("@/lib/utils/browser-detection").then(({ getBrowserInfo }) => {
    const browserInfo = getBrowserInfo();

    if (browserInfo.isBrave) {
      console.log("\n🦁 BRAVE BROWSER DETECTED:");
      console.log(
        "⚠️  CRITICAL: Enable 'Use Google services for push messaging'",
      );
      console.log("   → Go to Brave Settings → Privacy and Security");
      console.log("   → Toggle ON 'Use Google services for push messaging'");
      console.log("   → Restart Brave browser completely");
      console.log("   → Then try enabling notifications again");
    }
  });
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  const w = getWindow();
  if (!w) return null;

  if (w.__registeredFCMToken) return w.__registeredFCMToken;
  if (w.__fcmTokenPromise) return w.__fcmTokenPromise;

  w.__fcmTokenPromise = (async (): Promise<string | null> => {
    try {
      // Check configuration
      if (!isFirebaseConfigured()) {
        console.error("Firebase is not properly configured");
        debugFirebaseConfig(); // Show detailed config debug
        throw new Error("Firebase configuration is incomplete");
      }

      if (!messaging) {
        console.warn("Firebase messaging not available");
        throw new Error("Firebase messaging not initialized");
      }

      if (!isPushSupported()) {
        console.error("Push messaging is not supported in this browser");
        throw new Error("Push messaging not supported");
      }

      // Check if Notification API is available before using it
      if (!("Notification" in window) || !window.Notification) {
        console.error("Notification API not available");
        throw new Error("Notification API not supported");
      }

      const permission = await window.Notification.requestPermission();
      console.log("Notification permission:", permission);

      if (permission !== "granted") {
        console.warn("Notification permission denied:", permission);
        throw new Error("Notification permission denied");
      }

      let registration: ServiceWorkerRegistration;

      if ("serviceWorker" in navigator) {
        try {
          // Add a timeout to avoid hanging indefinitely
          console.log("Waiting for service worker ready...");
          registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("Service worker ready timeout")),
                60000,
              ),
            ),
          ]);
          console.log("Using ready service worker registration:", registration);
        } catch (swError) {
          console.error("Service Worker ready failed:", swError);
          // If service worker isn't ready, try to register one
          try {
            console.log("Attempting to register service worker...");
            registration = await navigator.serviceWorker.register("/sw.js");
            console.log("Service worker registered:", registration);
            // Wait for it to become ready with timeout
            await Promise.race([
              new Promise<void>((resolve) => {
                if (registration.active) {
                  resolve();
                } else {
                  registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "activated") {
                          resolve();
                        }
                      });
                    }
                  });
                }
              }),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(new Error("Service worker activation timeout")),
                  10000,
                ),
              ),
            ]);
          } catch (registerError) {
            console.error("Failed to register service worker:", registerError);
            throw new Error(
              `Service Worker registration failed: ${registerError instanceof Error ? registerError.message : "Unknown error"}`,
            );
          }
        }
      } else {
        console.error("Service Worker not supported in this browser");
        throw new Error("Service Worker not supported");
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("VAPID key is missing");
        throw new Error("VAPID key not configured");
      }

      let token: string | null = null;

      // Debug push subscription state before attempting FCM token
      try {
        const subscription = await registration.pushManager.getSubscription();
        console.log(
          "Current push subscription:",
          subscription ? "exists" : "none",
        );
        if (subscription) {
          console.log(
            "Push subscription endpoint:",
            subscription.endpoint.substring(0, 50) + "...",
          );
        }
      } catch (subErr) {
        console.warn("Cannot check push subscription:", subErr);
      }

      // Try multiple approaches for maximum browser compatibility
      const getTokenStrategies = [
        // Strategy 1: With explicit service worker registration (standard approach)
        async () => {
          console.log(
            "🔄 Strategy 1: getToken with service worker registration",
          );
          return await getToken(messaging!, {
            vapidKey,
            serviceWorkerRegistration: registration,
          });
        },

        // Strategy 2: Without explicit service worker registration (fallback)
        async () => {
          console.log("🔄 Strategy 2: getToken without explicit registration");
          return await getToken(messaging!, { vapidKey });
        },

        // Strategy 3: Force new push subscription first (aggressive fix)
        async () => {
          console.log("🔄 Strategy 3: Force new push subscription");
          try {
            // Unsubscribe existing subscription
            const existingSub =
              await registration.pushManager.getSubscription();
            if (existingSub) {
              await existingSub.unsubscribe();
              console.log("Unsubscribed existing push subscription");
            }

            // Wait a bit for cleanup
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Try to create new subscription manually first
            const newSub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidKey,
            });
            console.log(
              "Created new push subscription:",
              newSub.endpoint.substring(0, 50) + "...",
            );

            // Now try FCM token
            return await getToken(messaging!, { vapidKey });
          } catch (subError) {
            console.warn("Manual subscription creation failed:", subError);
            throw subError;
          }
        },
      ];

      // Try each strategy
      for (let i = 0; i < getTokenStrategies.length; i++) {
        try {
          console.log(
            `Getting FCM token with strategy ${i + 1}/3 (VAPID: ${vapidKey.substring(0, 20)}...)`,
          );
          token = await getTokenStrategies[i]();

          if (token) {
            console.log(
              `✅ Strategy ${i + 1} succeeded! Token: ${token.substring(0, 20)}...`,
            );
            break;
          } else {
            console.warn(
              `Strategy ${i + 1} returned null token, trying next...`,
            );
          }
        } catch (e) {
          const err = e as Error & { code?: string; name?: string };
          console.error(`❌ Strategy ${i + 1} failed:`, {
            code: err.code,
            name: err.name,
            message: err.message,
          });

          // If this is the last strategy, handle the error
          if (i === getTokenStrategies.length - 1) {
            // Enhanced error analysis for better user guidance
            if (
              err.name === "AbortError" ||
              err.message?.includes("AbortError")
            ) {
              throw new Error(
                "Browser blocked push notifications (likely privacy settings or Brave Shields). Please disable privacy blocking for this site and try again.",
              );
            } else if (
              err.message?.includes("retrieving push subscription") ||
              err.name === "DOMException"
            ) {
              throw new Error(
                "Browser push service unavailable. This may be due to network issues, privacy settings, or browser configuration. Try restarting your browser or disabling privacy extensions.",
              );
            } else if (
              err.code?.includes("messaging") ||
              err.message?.includes("messaging")
            ) {
              throw new Error(
                "Firebase messaging service error. Please check your internet connection and try again.",
              );
            } else {
              throw err;
            }
          }

          // Wait a bit between strategies
          if (i < getTokenStrategies.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (!token) {
        let subscription: PushSubscription | null = null;
        try {
          subscription = await registration.pushManager.getSubscription();
        } catch (subErr) {
          console.error("pushManager.getSubscription failed", subErr);
        }
        console.log("Push subscription after null token:", subscription);
        throw new Error(
          "FCM token null (may be blocked by browser settings, Brave Shields, or missing Web Push support)",
        );
      }

      w.__registeredFCMToken = token;
      console.log("FCM token obtained:", token.substring(0, 20) + "...");
      return token;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      resetFcmTokenPromise();
      throw error;
    }
  })();

  return w.__fcmTokenPromise;
};

// Handle foreground messages
export const onMessageListener = () =>
  new Promise<MessagePayload>((resolve, reject) => {
    if (!messaging) {
      console.warn("Firebase messaging not available");
      reject(new Error("Firebase messaging not available"));
      return;
    }

    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

// Wrapper that verifies support before attempting to request permissions / get token
export const safeRequestNotificationPermission = async (): Promise<{
  token: string | null;
  error?: Error;
  userGuidance?: PushSupportInfo["userGuidance"];
}> => {
  // Check basic support first
  const supportStatus = getPushSupportStatus();
  if (!supportStatus.supported) {
    return {
      token: null,
      userGuidance: supportStatus.userGuidance || undefined,
    };
  }

  // Check Firebase configuration
  if (!isFirebaseConfigured()) {
    return {
      token: null,
      userGuidance: {
        title: "Configuration Issue",
        message: "Push notifications are not configured for this app.",
        steps: ["Contact support for assistance"],
        canRetry: false,
      },
    };
  }

  // Prefer SDK async check first
  try {
    const sdkSupported = await isMessagingSupportedAsync();
    if (!sdkSupported) {
      console.warn("Firebase messaging not supported by SDK check");
      return {
        token: null,
        userGuidance: supportStatus.userGuidance || undefined,
      };
    }
  } catch (err) {
    console.warn(
      "SDK support check failed, continuing with feature detection",
      err,
    );
  }

  try {
    const token = await requestNotificationPermission();
    return { token };
  } catch (error) {
    console.error("safeRequestNotificationPermission failed:", error);
    const userGuidance =
      error instanceof Error ? analyzeNotificationError(error) : null;

    return {
      token: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
      userGuidance: userGuidance || undefined,
    };
  }
};
