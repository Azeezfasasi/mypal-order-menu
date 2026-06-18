/**
 * Browser Detection Utilities
 *
 * General-purpose browser detection and environment utilities
 * that can be used across the application
 */

export interface BrowserInfo {
  name: string;
  version?: string;
  isIOS: boolean;
  isMobile: boolean;
  isBrave: boolean;
  isMacOS: boolean;
  isPrivateMode?: boolean;
}

/**
 * Detect browser information and environment details
 */
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

/**
 * Check if running in a browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * Check if running on a mobile device
 */
export const isMobileDevice = (): boolean => {
  if (!isBrowser()) return false;
  return getBrowserInfo().isMobile;
};

/**
 * Check if running on iOS
 */
export const isIOSDevice = (): boolean => {
  if (!isBrowser()) return false;
  return getBrowserInfo().isIOS;
};

/**
 * Check if running on macOS
 */
export const isMacOSDevice = (): boolean => {
  if (!isBrowser()) return false;
  return getBrowserInfo().isMacOS;
};

/**
 * Check if running in Brave browser
 */
export const isBraveBrowser = (): boolean => {
  if (!isBrowser()) return false;
  return getBrowserInfo().isBrave;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isBrowser() || !("Notification" in window) || !window.Notification)
    return "denied";
  return window.Notification.permission;
};

/**
 * Check if the browser supports service workers
 */
export const isServiceWorkerSupported = (): boolean => {
  return isBrowser() && "serviceWorker" in navigator;
};

/**
 * Check if the browser supports push messaging
 */
export const isPushSupported = (): boolean => {
  return (
    isServiceWorkerSupported() &&
    "PushManager" in window &&
    "Notification" in window
  );
};

/**
 * Check if the browser supports the Notification API
 */
export const isNotificationAPISupported = (): boolean => {
  return isBrowser() && "Notification" in window;
};
