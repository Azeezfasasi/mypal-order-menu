/**
 * Push Notification Support Detection Utilities
 *
 * Utilities for detecting and analyzing push notification support
 * across different browsers and environments
 */

import {
  getBrowserInfo,
  isBrowser,
  isPushSupported,
  type BrowserInfo,
} from "./browser-detection";

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

/**
 * Get comprehensive push notification support status
 */
export const getPushSupportStatus = (): PushSupportInfo => {
  const browserInfo = getBrowserInfo();

  if (!isBrowser()) {
    return {
      supported: false,
      reason: "server",
      browserInfo,
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

/**
 * Check if Firebase messaging is supported (async)
 * Falls back to feature detection if Firebase check fails
 */
export const isMessagingSupportedAsync = async (): Promise<boolean> => {
  try {
    // Import Firebase messaging support check dynamically
    const { isSupported } = await import("firebase/messaging");
    const supported = await isSupported();
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

/**
 * Show alert when push is not supported
 */
export const showPushUnsupportedAlert = (customMessage?: string) => {
  const status = getPushSupportStatus();
  const reason = status.reason || "unsupported";
  const defaultMsg =
    {
      server: "Push is not available on the server.",
      "browser-not-supported":
        "This browser or device does not support push notifications.",
      unsupported: "Push notifications are not supported.",
    }[reason] || "Push notifications are not supported.";

  const msg = customMessage ? `${customMessage}\n\n${defaultMsg}` : defaultMsg;
  const w = isBrowser() ? window : undefined;
  if (w && typeof w.alert === "function") {
    w.alert(msg);
  } else {
    console.warn("Push unsupported: ", msg);
  }
};

/**
 * Async version of showPushUnsupportedAlert that checks Firebase support first
 */
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
