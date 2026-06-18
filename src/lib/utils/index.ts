/**
 * Notification and Browser Utilities Index
 *
 * Centralized exports for all notification and browser utilities
 */

// Browser Detection Utilities
export {
  getBrowserInfo,
  getNotificationPermission,
  isBraveBrowser,
  isBrowser,
  isIOSDevice,
  isMacOSDevice,
  isMobileDevice,
  isNotificationAPISupported,
  isPushSupported,
  isServiceWorkerSupported,
  type BrowserInfo,
} from "./browser-detection";

// Push Notification Support Utilities
export {
  getPushSupportStatus,
  isMessagingSupportedAsync,
  showPushUnsupportedAlert,
  showPushUnsupportedAlertAsync,
  type PushSupportInfo,
} from "./push-notification-support";

// Error Analysis and User Guidance
export {
  analyzeNotificationError,
  getBrowserSpecificGuidance,
} from "./notification-error-analysis";

// Diagnostics and Testing
export {
  debugEnvironment,
  getBrowserFeatureSummary,
  testBrowserFeature,
  testPushServiceConnectivity,
} from "./push-diagnostics";
