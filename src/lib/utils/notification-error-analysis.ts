/**
 * Notification Error Analysis and User Guidance
 *
 * Utilities for analyzing notification errors and providing
 * helpful user guidance based on browser and error type
 */

import { getBrowserInfo, type BrowserInfo } from "./browser-detection";
import type { PushSupportInfo } from "./push-notification-support";

/**
 * Enhanced error analysis for better user guidance
 */
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
      title: "Brave Browser Push Messaging Configuration",
      message: `Brave requires Google services for push notifications to be enabled.${isMac ? " This is the most common issue on macOS." : ""}`,
      steps: [
        "🔧 CRITICAL FIRST STEP:",
        "1. Go to Brave Settings → Privacy and Security",
        "2. Scroll down and TURN ON 'Use Google services for push messaging'",
        "3. Restart Brave browser completely",
        "4. Try enabling notifications again",
        "",
        "📱 If still not working, also try:",
        "5. Click the Brave Shields icon (🛡️) in the address bar",
        "6. Turn OFF 'Block fingerprinting'",
        "7. Turn OFF 'Block trackers & ads' (temporarily)",
        "8. Turn OFF 'Block all cookies' if enabled",
        "9. Refresh the page and try again",
        ...(isMac
          ? [
              "",
              "🍎 macOS Additional Steps:",
              "10. If still failing: Check System Preferences → Notifications → Brave",
              "11. Ensure Brave notifications are allowed at the system level",
              "12. Under Brave Shields, set all blocking to 'Standard' instead of 'Aggressive'",
              "13. Alternative: Try Safari or Chrome to confirm the issue is Brave-specific",
            ]
          : [
              "",
              "💡 Alternative: Check Brave Settings → Privacy and Security → Notifications",
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

/**
 * Get browser-specific troubleshooting steps
 */
export const getBrowserSpecificGuidance = (
  browserInfo: BrowserInfo,
): string[] => {
  const steps: string[] = [];

  if (browserInfo.isBrave) {
    steps.push(
      "🔧 CRITICAL: Brave Settings → Privacy and Security → Turn ON 'Use Google services for push messaging'",
      "Brave Browser: Restart browser after enabling Google services",
      "Brave Browser: Click the Shields icon and disable all blocking for this site",
      "Brave Browser: Check Settings → Privacy and Security → Notifications",
    );
  }

  if (browserInfo.name === "Firefox") {
    steps.push(
      "Firefox: Check Settings → Privacy & Security → Notifications",
      "Firefox: Disable Enhanced Tracking Protection for this site",
    );
  }

  if (browserInfo.name === "Safari") {
    steps.push(
      "Safari: Check Preferences → Websites → Notifications",
      "Safari: Ensure notifications are allowed for this domain",
    );
  }

  if (browserInfo.isMacOS) {
    steps.push(
      "macOS: Check System Preferences → Notifications → Browser",
      "macOS: Ensure notifications are enabled for your browser",
    );
  }

  return steps;
};
