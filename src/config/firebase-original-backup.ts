import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  MessagePayload,
  Messaging,
  onMessage,
} from "firebase/messaging";

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
if (typeof window !== "undefined") {
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
if (typeof window !== "undefined") {
  try {
    // Use Firebase's isSupported() to check whether the current browser
    // supports the Messaging SDK. This is the reliable, recommended check.
    isMessagingSupported()
      .then((supported) => {
        if (supported && app) {
          try {
            messaging = getMessaging(app);
            // console.log(
            //   "Firebase messaging initialized in client (isSupported=true)",
            // );
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
const getWindow = () => (typeof window !== "undefined" ? window : undefined);

// Utility to reset cached token promise (manual retry)
export const resetFcmTokenPromise = () => {
  const w = getWindow();
  if (w) {
    delete w.__fcmTokenPromise;
    delete w.__registeredFCMToken;
  }
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

// Get current notification permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !window.Notification
  )
    return "denied";
  return window.Notification.permission;
};

// Check if push messaging is supported
export const isPushSupported = (): boolean => {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

// Debug function to check Firebase configuration
export const debugFirebaseConfig = () => {
  const browserInfo = getBrowserInfo();

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

  console.log("\n🌐 Browser Environment Debug:");
  console.log(`- Browser: ${browserInfo.name}`);
  console.log(`- Is Brave: ${browserInfo.isBrave ? "Yes" : "No"}`);
  console.log(`- Is macOS: ${browserInfo.isMacOS ? "Yes" : "No"}`);
  console.log(`- Is Mobile: ${browserInfo.isMobile ? "Yes" : "No"}`);
  console.log(`- Notification Permission: ${getNotificationPermission()}`);

  // Check service worker state
  if ("serviceWorker" in navigator) {
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

// --- Enhanced browser detection and user guidance ---
export interface BrowserInfo {
  name: string;
  version?: string;
  isIOS: boolean;
  isMobile: boolean;
  isBrave: boolean;
  isMacOS: boolean;
  isPrivateMode?: boolean;
}

export const getBrowserInfo = (): BrowserInfo => {
  if (typeof window === "undefined" || !navigator) {
    return {
      name: "Unknown",
      isIOS: false,
      isMobile: false,
      isBrave: false,
      isMacOS: false,
    };
  }

  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
  const isBrave = !!(navigator as { brave?: unknown }).brave;
  const isMacOS =
    /Mac|Macintosh/.test(userAgent) ||
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  let browserName = "Unknown";
  if (userAgent.includes("Chrome") && !isBrave) browserName = "Chrome";
  else if (userAgent.includes("Firefox")) browserName = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    browserName = "Safari";
  else if (userAgent.includes("Edge")) browserName = "Edge";
  else if (isBrave) browserName = "Brave";

  return {
    name: browserName,
    isIOS,
    isMobile,
    isBrave,
    isMacOS,
  };
};

export interface PushSupportInfo {
  supported: boolean;
  reason?: string;
  browserInfo: BrowserInfo;
  userGuidance?: {
    title: string;
    message: string;
    steps: string[];
    canRetry: boolean;
  };
}

// --- Enhanced client helpers for safe push registration ---
export const getPushSupportStatus = (): PushSupportInfo => {
  const browserInfo = getBrowserInfo();

  if (typeof window === "undefined") {
    return {
      supported: false,
      reason: "server",
      browserInfo,
    };
  }

  if (!isFirebaseConfigured()) {
    return {
      supported: false,
      reason: "firebase-config",
      browserInfo,
      userGuidance: {
        title: "Configuration Issue",
        message: "Push notifications are not configured for this app.",
        steps: ["Contact support for assistance"],
        canRetry: false,
      },
    };
  }

  // iOS Safari specific check
  if (browserInfo.isIOS && browserInfo.name === "Safari") {
    return {
      supported: false,
      reason: "ios-safari-not-supported",
      browserInfo,
      userGuidance: {
        title: "iOS Safari Limitation",
        message:
          "Push notifications are not supported in iOS Safari. You can still use all other app features.",
        steps: [
          "Use Chrome or Firefox on iOS for notification support",
          "Or add this website to your home screen (it will work like an app)",
        ],
        canRetry: false,
      },
    };
  }

  // General mobile browser check
  if (!isPushSupported()) {
    if (browserInfo.isMobile) {
      return {
        supported: false,
        reason: "mobile-browser-not-supported",
        browserInfo,
        userGuidance: {
          title: "Mobile Browser Limitation",
          message: "This mobile browser doesn't support push notifications.",
          steps: [
            "Try using Chrome, Firefox, or Samsung Internet browser",
            "All other app features work normally without notifications",
          ],
          canRetry: false,
        },
      };
    }

    return {
      supported: false,
      reason: "browser-not-supported",
      browserInfo,
      userGuidance: {
        title: "Browser Not Supported",
        message: "This browser doesn't support push notifications.",
        steps: [
          "Use Chrome, Firefox, Safari, or Edge for notification support",
          "All other app features work normally",
        ],
        canRetry: false,
      },
    };
  }

  return { supported: true, browserInfo };
};

// New: prefer Firebase SDK's async isSupported() check, fall back to feature-detection
export const isMessagingSupportedAsync = async (): Promise<boolean> => {
  try {
    const supported = await isMessagingSupported();
    return Boolean(supported);
  } catch (err) {
    console.warn(
      "isMessagingSupportedAsync: firebase.messaging.isSupported() failed, falling back to feature detection:",
      err,
    );
    try {
      return isPushSupported();
    } catch (e) {
      console.warn("isMessagingSupportedAsync fallback also failed:", e);
      return false;
    }
  }
};

// Enhanced error analysis for better user guidance
export const analyzeNotificationError = (
  error: Error,
): PushSupportInfo["userGuidance"] | null => {
  const browserInfo = getBrowserInfo();
  const errorMessage = error.message.toLowerCase();

  // Brave browser specific issues (enhanced for macOS)
  if (
    browserInfo.isBrave ||
    errorMessage.includes("registration failed") ||
    errorMessage.includes("aborterror") ||
    errorMessage.includes("push service error")
  ) {
    const isMac = browserInfo.isMacOS;

    return {
      title: "Brave Browser Privacy Settings",
      message: `Brave's privacy features are blocking push notifications.${isMac ? " This is common on macOS." : ""}`,
      steps: [
        "1. Click the Brave Shields icon (🛡️) in the address bar",
        "2. Turn OFF 'Block fingerprinting'",
        "3. Turn OFF 'Block trackers & ads' (temporarily)",
        "4. Turn OFF 'Block all cookies' if enabled",
        "5. Refresh the page and try again",
        ...(isMac
          ? [
              "6. If still failing: Go to Brave → Preferences → Privacy and Security",
              "7. Under 'Shields', set 'Trackers & ads blocking' to 'Standard'",
              "8. Under 'Shields', set 'Fingerprinting blocking' to 'Standard'",
              "9. Under 'Shields', set 'Cookie blocking' to 'Standard'",
              "10. Restart Brave and try again",
              "11. Alternative: Try Safari or Chrome to test if the issue is Brave-specific",
            ]
          : [
              "6. Alternative: Check Brave Settings → Privacy and Security → Notifications",
            ]),
      ],
      canRetry: true,
    };
  }

  // Firefox-specific DOMException issues
  if (
    browserInfo.name === "Firefox" &&
    (errorMessage.includes("domexception") ||
      errorMessage.includes("retrieving push subscription") ||
      errorMessage.includes("error retrieving push subscription"))
  ) {
    return {
      title: "Firefox Push Service Issue",
      message:
        "Firefox is having trouble connecting to the push notification service.",
      steps: [
        "1. Check if Firefox is up to date (Settings → General → Firefox Updates)",
        "2. Go to Settings → Privacy & Security → Notifications",
        "3. Make sure 'Block new requests asking to allow notifications' is OFF",
        "4. Clear Firefox cookies and site data for this site",
        "5. Restart Firefox completely",
        "6. If using Enhanced Tracking Protection: Click the shield icon → Turn off protection for this site",
        "7. Try again after these changes",
        "8. Alternative: Test in Chrome to verify the issue is Firefox-specific",
      ],
      canRetry: true,
    };
  }

  // Permission denied
  if (
    errorMessage.includes("permission denied") ||
    errorMessage.includes("denied")
  ) {
    return {
      title: "Notification Permission Denied",
      message: "Notifications were blocked by your browser settings.",
      steps: [
        "Click the lock/info icon (🔒) next to the website address",
        "Change notifications from 'Block' to 'Allow'",
        "Refresh the page and try again",
        "Alternative: Check browser Settings > Privacy & Security > Notifications",
      ],
      canRetry: true,
    };
  }

  // Service worker issues
  if (
    errorMessage.includes("service worker") ||
    errorMessage.includes("registration") ||
    errorMessage.includes("messaging/failed-service-worker-registration")
  ) {
    return {
      title: "Browser Security Settings",
      message: "Your browser's security settings are preventing notifications.",
      steps: [
        "1. Check if your browser is in private/incognito mode",
        "2. Try disabling browser extensions temporarily",
        "3. Clear browser cache and cookies for this site",
        "4. Go to browser Settings → Privacy & Security → Notifications",
        "5. Make sure notifications are allowed for this site",
        "6. Restart your browser and try again",
      ],
      canRetry: true,
    };
  }

  // FCM token null - common with aggressive privacy settings
  if (
    errorMessage.includes("fcm token null") ||
    errorMessage.includes("blocked by browser") ||
    errorMessage.includes("brave shields") ||
    errorMessage.includes("push service error")
  ) {
    const isMac = browserInfo.isMacOS;
    const isBrave = browserInfo.isBrave;

    return {
      title: `${isBrave ? "Brave Browser" : "Browser"} Privacy Settings`,
      message: `Your browser's privacy settings are blocking notification tokens.${isMac && isBrave ? " This is common with Brave on macOS." : ""}`,
      steps: [
        ...(isBrave
          ? [
              "1. Click the Brave Shields icon (🛡️) in the address bar",
              "2. Click 'Advanced controls'",
              "3. Turn OFF all blocking options temporarily",
              "4. Refresh the page and try again",
            ]
          : [
              "1. Check browser notification settings",
              "2. Allow notifications for this site",
            ]),
        "5. If still failing: Clear all browser data for this site",
        "6. Try in a different browser (Chrome/Firefox) to test",
        "7. Contact support if the issue persists",
      ],
      canRetry: true,
    };
  }

  // VAPID or Firebase config issues
  if (errorMessage.includes("vapid") || errorMessage.includes("sender id")) {
    return {
      title: "Configuration Issue",
      message: "There's a technical issue with notification setup.",
      steps: [
        "This appears to be a technical issue",
        "Please contact support for assistance",
        "All other app features work normally",
      ],
      canRetry: false,
    };
  }

  // Generic network/connection issues
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return {
      title: "Connection Issue",
      message: "Unable to connect to notification service.",
      steps: [
        "Check your internet connection",
        "Try again in a few moments",
        "If using VPN, try disabling it temporarily",
      ],
      canRetry: true,
    };
  }

  return null;
};

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

// Async helper: check SDK first, then show a user-friendly alert. Useful when
// the caller wants to await a check before rendering UI.
export const showPushUnsupportedAlertAsync = async (customMessage?: string) => {
  try {
    const sdkSupported = await isMessagingSupportedAsync();
    if (sdkSupported) {
      // If SDK says supported, still honor getPushSupportStatus in case of
      // missing config or feature detection differences.
      const status = getPushSupportStatus();
      if (status.supported) return; // nothing to show
    }
  } catch {
    // ignore and fallthrough to show sync alert
  }

  // Reuse the synchronous alert builder for consistent messaging
  showPushUnsupportedAlert(customMessage);
};

// Small UI helper to show a clear message when push is not available. App can call this when safeRequestNotificationPermission returns null.
export const showPushUnsupportedAlert = (customMessage?: string) => {
  const status = getPushSupportStatus();
  const reason = status.reason || "unsupported";
  const defaultMsg =
    {
      server: "Push is not available on the server.",
      "firebase-config":
        "Push notifications are not configured for this app (missing Firebase config).",
      "browser-not-supported":
        "This browser or device does not support push notifications.",
      unsupported: "Push notifications are not supported.",
    }[reason] || "Push notifications are not supported.";

  const msg = customMessage ? `${customMessage}\n\n${defaultMsg}` : defaultMsg;
  const w = typeof window !== "undefined" ? window : undefined;
  if (w && typeof w.alert === "function") {
    w.alert(msg);
  } else {
    console.warn("Push unsupported: ", msg);
  }
};

// Diagnostic helper to test push service connectivity
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
    if (!("serviceWorker" in navigator)) {
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

    if (!("Notification" in window)) {
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
    if ("serviceWorker" in navigator) {
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
