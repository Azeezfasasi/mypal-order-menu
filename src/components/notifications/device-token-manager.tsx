"use client";

import NotificationGuidance from "@/components/notification-guidance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPushSupportStatus,
  isMessagingSupportedAsync,
  PushSupportInfo,
  resetFcmTokenPromise,
  safeRequestNotificationPermission,
  showPushUnsupportedAlertAsync,
} from "@/config/firebase";
import { useRegisterDeviceToken } from "@/examples/notification-api-usage";
import { Platform } from "@/types/enums";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  RefreshCw,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "fcm_device_token";
const REGISTERED_TOKEN_KEY = "fcm_token_registered";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000; // Initial delay, doubles on each retry

// Error interpretation helper to provide user-friendly messages
interface ErrorInfo {
  title: string;
  message: string;
  details?: string;
  canRetry: boolean;
  suggestion?: string;
}

const interpretRegistrationError = (err: unknown, retryAttempt: number): ErrorInfo => {
  let httpStatus: number | undefined;
  let errorMessage = "Unknown error";
  
  // Extract HTTP status and error message
  if (err && typeof err === "object") {
    const errObj = err as Record<string, unknown>;
    httpStatus = errObj.status as number | undefined;
    
    // Try to get a meaningful message
    if (errObj.data && typeof errObj.data === "string") {
      try {
        const jsonData = JSON.parse(errObj.data);
        errorMessage = jsonData.message || errorMessage;
      } catch {
        errorMessage = errObj.data as string;
      }
    } else if (errObj.message) {
      errorMessage = errObj.message as string;
    }
  } else if (err instanceof Error) {
    errorMessage = err.message;
  } else {
    errorMessage = String(err);
  }

  // Map specific errors to user-friendly messages
  if (httpStatus === 400 && errorMessage.includes("User not found")) {
    return {
      title: "Session Issue",
      message: "We're still initializing your session. This usually happens when you just logged in.",
      details: `Attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS}`,
      canRetry: retryAttempt < MAX_RETRY_ATTEMPTS,
      suggestion: "The system will automatically retry in a moment. Please keep this page open.",
    };
  }

  if (httpStatus === 401) {
    return {
      title: "Authentication Expired",
      message: "Your session has expired. You'll need to log in again.",
      canRetry: false,
      suggestion: "Please refresh the page and log in again.",
    };
  }

  if (httpStatus === 403) {
    return {
      title: "Permission Denied",
      message: "Your account doesn't have permission to register notifications.",
      canRetry: false,
      suggestion: "Please contact support if you believe this is an error.",
    };
  }

  if (httpStatus === 500) {
    return {
      title: "Server Error",
      message: "Our servers are temporarily having issues. Please try again in a moment.",
      canRetry: true,
      suggestion: "The error is on our end, not yours. We're working to fix it.",
    };
  }

  if (httpStatus === 503) {
    return {
      title: "Service Temporarily Unavailable",
      message: "Our notification service is currently undergoing maintenance.",
      canRetry: true,
      suggestion: "Please try again in a few moments.",
    };
  }

  if (httpStatus === 400) {
    return {
      title: "Bad Request",
      message: `There was an issue with the request: ${errorMessage}`,
      canRetry: retryAttempt < MAX_RETRY_ATTEMPTS,
      suggestion: retryAttempt < MAX_RETRY_ATTEMPTS 
        ? "Retrying may fix this issue."
        : "If this persists, please contact support.",
    };
  }

  // Generic error handling
  return {
    title: "Registration Error",
    message: errorMessage,
    canRetry: true,
    suggestion: "Try clicking 'Retry Registration' to attempt again.",
  };
};

// Helper to create simple error info from a string message
const createErrorInfo = (message: string, canRetry = true): ErrorInfo => ({
  title: "Information",
  message,
  canRetry,
});

export function DeviceTokenManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);
  const [showBusinessValue, setShowBusinessValue] = useState(true);
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);
  const [userGuidance, setUserGuidance] =
    useState<PushSupportInfo["userGuidance"]>();
  // Replace local isRegistering state with a small permission-request state and a ref mutex
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const isRegisteringRef = useRef(false);
  const tokenRestoredRef = useRef(false);
  const tokenIsNewRef = useRef(false); // Track if token is new (from Firebase) vs restored
  const retryCountRef = useRef(0); // Track retry attempts
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const registerToken = useRegisterDeviceToken(token || "", Platform.WEB);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const retryRegistration = () => {
    if (!token) return;
    // guard concurrent attempts
    if (isRegisteringRef.current || registerToken.status === "pending") return;
    isRegisteringRef.current = true;
    registerToken.mutate(
      {
        token,
        platform: Platform.WEB,
        deviceInfo: navigator.userAgent,
      },
      {
        onSettled: () => {
          isRegisteringRef.current = false;
        },
      },
    );
  };

  useEffect(() => {
    // Prefer the Firebase SDK's async support check, fall back to sync helper.
    let mounted = true;
    (async () => {
      try {
        const sdkSupported = await isMessagingSupportedAsync();
        if (!mounted) return;
        if (typeof sdkSupported === "boolean") {
          setIsSupported(Boolean(sdkSupported));
        } else {
          // fallback to quick sync check
          const status = getPushSupportStatus();
          setIsSupported(Boolean(status.supported));
        }
      } catch {
        // fallback
        const status = getPushSupportStatus();
        setIsSupported(Boolean(status.supported));
      }

      // Check if Notification API is available before accessing it
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification
      ) {
        setPermission(window.Notification.permission);
      }

      // Restore token from localStorage on mount
      if (!tokenRestoredRef.current && typeof window !== "undefined") {
        const savedToken = localStorage.getItem(STORAGE_KEY);
        const wasRegistered = localStorage.getItem(REGISTERED_TOKEN_KEY);
        if (savedToken) {
          console.log("✅ Restored FCM token from localStorage");
          setToken(savedToken);
          setShowBusinessValue(false);
          tokenIsNewRef.current = false; // Token is restored, not new
          // Check if this token was already registered
          if (wasRegistered === savedToken) {
            console.log("✅ Token was already registered in previous session");
            const w = typeof window !== "undefined" ? window : undefined;
            if (w) w.__registeredFCMToken = savedToken;
          }
        }
        tokenRestoredRef.current = true;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Register token with backend exactly once per unique token.
  useEffect(() => {
    if (!token || token === "") return;

    const w = typeof window !== "undefined" ? window : undefined;
    
    // Check both memory cache and localStorage for registration status
    if (w && w.__registeredFCMToken && w.__registeredFCMToken === token) {
      console.log("Token already registered in memory, skipping mutate");
      setShowBusinessValue(false);
      return;
    }

    // Check localStorage for previous registration
    const registeredToken = localStorage.getItem(REGISTERED_TOKEN_KEY);
    if (registeredToken === token) {
      console.log("Token already registered in localStorage, skipping mutate");
      setShowBusinessValue(false);
      if (w) w.__registeredFCMToken = token;
      return;
    }

    // Skip registration for restored tokens - they were already attempted before
    // Only register NEW tokens that came from Firebase in this session
    if (!tokenIsNewRef.current) {
      console.log("🔄 Token was restored from localStorage - skipping registration attempt (likely already attempted)");
      setShowBusinessValue(false);
      return;
    }

    // Prevent concurrent registration attempts
    if (isRegisteringRef.current) {
      console.log("Registration already in progress, skipping duplicate call");
      return;
    }

    // Schedule the registration with a delay to ensure auth context is fully initialized
    const delay = RETRY_DELAY_MS * Math.pow(2, retryCountRef.current);
    console.log(`📅 Scheduling registration in ${delay}ms (retry attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`);

    retryTimeoutRef.current = setTimeout(() => {
      if (!isRegisteringRef.current) {
        isRegisteringRef.current = true;
        console.log("🚀 Attempting token registration with:", {
          token: token.substring(0, 20) + "...",
          retryAttempt: retryCountRef.current,
        });

        registerToken.mutate(
          {
            token,
            platform: Platform.WEB,
            deviceInfo: navigator.userAgent,
          },
          {
            onSuccess: () => {
              if (w) w.__registeredFCMToken = token;
              localStorage.setItem(REGISTERED_TOKEN_KEY, token);
              retryCountRef.current = 0; // Reset retry count on success
              setShowBusinessValue(false);
              setLastError(null);
              console.log("✅ Token registered successfully with backend");
            },
            onError: (err: unknown) => {
              console.error("❌ Failed to register token:", err);
              
              // Try to extract HTTP status from error object
              let httpStatus: number | undefined;
              if (err && typeof err === "object") {
                httpStatus = (err as Record<string, unknown>).status as number | undefined;
              }

              // Get user-friendly error information
              const errorInfo = interpretRegistrationError(err, retryCountRef.current);

              // Retry on 400 errors (User not found, auth context not ready)
              if (httpStatus === 400 && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
                retryCountRef.current++;
                console.log(`⏳ Will retry registration (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`);
                // Show the error with retry info
                setLastError(errorInfo);
              } else {
                // Final error or non-retriable error
                setLastError(errorInfo);
              }
            },
            onSettled: () => {
              isRegisteringRef.current = false;
              console.log("🏁 Registration mutation settled");
            },
          },
        );
      }
    }, delay);

    // Cleanup timeout on unmount or token change
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [token, registerToken]);

  const requestPermission = async () => {
    if (!isSupported) {
      console.log("Notifications not supported, aborting request");
      return;
    }

    setLastError(null);
    console.log("Starting notification permission request...");

    try {
      setIsRequestingPermission(true);

      // Add timeout to prevent hanging UI (increased to 120s for service worker initialization)
      const result = await Promise.race([
        safeRequestNotificationPermission(),
        new Promise<{
          token?: string;
          error?: string;
          userGuidance?: PushSupportInfo["userGuidance"];
        }>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error("Permission request timeout after 120 seconds. The service worker may be taking longer to initialize.")),
            120000,
          ),
        ),
      ]);
      console.log("safeRequestNotificationPermission returned:", result);

      // Update permission status immediately so UI reflects granted state without reload
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification
      ) {
        const currentPerm = window.Notification.permission;
        setPermission(currentPerm);
      }

      if (result.token) {
        // Update token state; actual backend registration is handled in the effect above.
        tokenIsNewRef.current = true; // Mark as new token from Firebase
        retryCountRef.current = 0; // Reset retry count for new token
        setToken(result.token);
        // Persist token to localStorage
        localStorage.setItem(STORAGE_KEY, result.token);
        console.log("💾 Saved FCM token to localStorage");
        setShowBusinessValue(false);
        setLastError(null);
        setUserGuidance(undefined);
      } else {
        console.log("No FCM token received (yet)");
        // Do NOT flip permission to denied — permission may be granted while token
        // retrieval is still pending (service worker / network). Leave permission
        // as the browser reports and show guidance / an informative error.
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification &&
          window.Notification.permission === "granted"
        ) {
          setLastError(
            createErrorInfo("Permission granted but device token not yet available. The service worker or network may still be initializing. Try again in a moment or use Clear & Retry."),
          );
        } else if (result.userGuidance) {
          console.log(
            "Setting user guidance from result:",
            result.userGuidance,
          );
          setUserGuidance(result.userGuidance);
          setLastError(null);
        } else {
          // If not supported, show friendly message
          await showPushUnsupportedAlertAsync();
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      // Only mark permission denied if browser reports it.
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        window.Notification
      ) {
        setPermission(window.Notification.permission as NotificationPermission);
      }

      // Try to analyze the error for user guidance
      if (error instanceof Error) {
        // Import and use the analyzer function
        import("@/config/firebase")
          .then(({ analyzeNotificationError }) => {
            const guidance = analyzeNotificationError(error as Error);
            if (guidance) {
              console.log(
                "Setting user guidance from error analysis:",
                guidance,
              );
              setUserGuidance(guidance);
              setLastError(null);
            } else {
              setLastError(createErrorInfo(error.message));
              setUserGuidance(undefined);
            }
          })
          .catch(() => {
            setLastError(createErrorInfo(error.message));
            setUserGuidance(undefined);
          });
      } else {
        setLastError(
          createErrorInfo("Failed to enable notifications. Please check your browser settings."),
        );
        setUserGuidance(undefined);
      }
    } finally {
      // ensure permission spinner is off
      setIsRequestingPermission(false);
    }
  };

  const handleRetryWithCacheClear = async () => {
    resetFcmTokenPromise();
    setToken(null);
    setLastError(null);
    // Reset retry tracking for fresh attempt
    retryCountRef.current = 0;
    tokenIsNewRef.current = false;
    // Clear stored token and registration status so a fresh one is fetched
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REGISTERED_TOKEN_KEY);
    console.log("🔄 Cleared cached FCM token and registration status from localStorage");

    // Clear the existing push subscription so Firebase creates a new one.
    // We intentionally do NOT unregister the service worker here — that would
    // destroy the PWA caching layer and require a full page reload to restore it.
    if (await isMessagingSupportedAsync()) {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            console.log("🔄 Unsubscribed existing push subscription");
          }
        }
      } catch (error) {
        console.warn("Failed to clear push subscription (non-fatal):", error);
      }
    }

    // Clear any pending registration attempt
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    await requestPermission();
  };

  const getStatusIcon = () => {
    if (!isSupported) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (permission === "granted" && token)
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Smartphone className="h-5 w-5 text-gray-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) return "Not Supported";
    if (permission === "denied") return "Permission Denied";
    if (permission === "granted" && token) return "Registered";
    if (permission === "granted") return "Permission Granted";
    return "Not Registered";
  };

  const getStatusColor = () => {
    if (!isSupported || permission === "denied") return "destructive";
    if (permission === "granted" && token) return "default";
    return "secondary";
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Push Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Business Value Alert - Show when notifications not enabled */}
      {showBusinessValue && permission !== "granted" && (
        <Alert className="border-blue-200 bg-blue-50 overflow-hidden">
          <Bell className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-semibold break-words">
                🚀 Boost Your Business Performance
              </p>
              <div className="grid grid-cols-3 md:grid-cols-1 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">Real-time order alerts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">Customer engagement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">Never miss opportunities</span>
                </div>
              </div>
              <p className="text-xs mt-2 break-words">
                Enable notifications to stay connected with your customers and
                grow your business!
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 break-words">
            <Smartphone className="h-5 w-5 flex-shrink-0" />
            <span>Push Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
            </div>
          </div>

          {/* Show user guidance when available, regardless of permission state */}
          {userGuidance && (
            <NotificationGuidance
              userGuidance={userGuidance}
              onRetry={userGuidance.canRetry ? requestPermission : undefined}
              onDismiss={() => setUserGuidance(undefined)}
            />
          )}

          {permission === "default" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 overflow-hidden">
                <h4 className="font-semibold text-blue-900 mb-2 break-words">
                  Why Enable Notifications?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="break-words">
                    ✅ Instant alerts for new orders and reservations
                  </li>
                  <li className="break-words">
                    ✅ Real-time customer inquiries and messages
                  </li>
                  <li className="break-words">
                    ✅ Important business updates and deadlines
                  </li>
                  <li className="break-words">
                    ✅ Never miss time-sensitive opportunities
                  </li>
                  <li className="break-words">
                    ✅ Stay connected with your customers 24/7
                  </li>
                </ul>
              </div>
              <Button
                onClick={requestPermission}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={
                  registerToken.status === "pending" || isRequestingPermission
                }
              >
                <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="break-words">
                  {isRequestingPermission
                    ? "Enabling..."
                    : registerToken.status === "pending"
                      ? "Registering..."
                      : "Enable Business Notifications"}
                </span>
              </Button>
            </div>
          )}

          {permission === "denied" && (
            <div className="space-y-4">
              {/* Enhanced User Guidance */}
              {userGuidance ? (
                <NotificationGuidance
                  userGuidance={userGuidance}
                  onRetry={
                    userGuidance.canRetry ? requestPermission : undefined
                  }
                  onDismiss={() => setUserGuidance(undefined)}
                />
              ) : (
                <>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 overflow-hidden">
                    <h4 className="font-semibold text-red-900 mb-2 break-words">
                      Notifications Disabled
                    </h4>
                    <p className="text-sm text-red-800 mb-3 break-words">
                      Notifications are essential for managing your business
                      effectively. Without them, you may miss:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li className="break-words">
                        • New customer orders and bookings
                      </li>
                      <li className="break-words">
                        • Important system updates and alerts
                      </li>
                      <li className="break-words">
                        • Time-sensitive business opportunities
                      </li>
                      <li className="break-words">
                        • Customer service requests
                      </li>
                    </ul>

                    {lastError && (
                      <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800 break-words overflow-hidden">
                        <strong>{lastError.title}:</strong> {lastError.message}
                        {lastError.suggestion && (
                          <div className="mt-1 text-xs italic">💡 {lastError.suggestion}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground break-words">
                      Please enable notifications in your browser settings to
                      stay connected with your business.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={requestPermission}
                        className="flex-1 whitespace-nowrap min-w-0"
                        disabled={
                          registerToken.status === "pending" ||
                          isRequestingPermission
                        }
                      >
                        Try Again
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRetryWithCacheClear}
                        className="flex-1 whitespace-nowrap min-w-0"
                        size="sm"
                        disabled={
                          registerToken.status === "pending" ||
                          isRequestingPermission
                        }
                      >
                        <RefreshCw className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span>Clear & Retry</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {permission === "granted" && !token && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground break-words">
                {isRequestingPermission
                  ? "Enabling... waiting for device token."
                  : lastError
                    ? lastError.message
                    : "Permission granted. Waiting for device token — this can take a few seconds while the service worker initializes."}
              </p>

              <div className="flex gap-2 pt-2 flex-wrap">
                <Button
                  onClick={requestPermission}
                  disabled={
                    registerToken.status === "pending" || isRequestingPermission
                  }
                  className="whitespace-nowrap flex-1 min-w-0"
                >
                  {isRequestingPermission ? "Waiting..." : "Fetch token"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRetryWithCacheClear}
                  className="flex-1 whitespace-nowrap min-w-0"
                  size="sm"
                  disabled={
                    registerToken.status === "pending" || isRequestingPermission
                  }
                >
                  <RefreshCw className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>Clear & Retry</span>
                </Button>
              </div>
            </div>
          )}

          {permission === "granted" && token && (
            <div className="space-y-4">
              {registerToken.status === "pending" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground break-words">
                    {retryCountRef.current > 0 
                      ? `Retrying registration... (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`
                      : "Registering device token..."}
                  </p>
                  {retryCountRef.current > 0 && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded break-words">
                      This usually resolves after a few attempts once your session is fully initialized.
                    </div>
                  )}
                </div>
              )}

              {registerToken.status === "error" && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 overflow-hidden">
                  <h4 className="font-semibold text-red-900 mb-2 break-words">
                    {lastError?.title || "Registration Failed"}
                  </h4>
                  <p className="text-sm text-red-800 mb-3 break-words">
                    {lastError?.message || "We could not register your device. Please try again."}
                  </p>
                  
                  {lastError?.details && (
                    <div className="text-xs text-red-700 mb-2 bg-red-100 p-2 rounded break-words">
                      {lastError.details}
                    </div>
                  )}

                  {lastError?.suggestion && (
                    <div className="text-xs text-red-700 mb-3 italic break-words">
                      💡 <strong>Tip:</strong> {lastError.suggestion}
                    </div>
                  )}
                  
                  <div className="flex gap-2 flex-wrap">
                    {lastError?.canRetry && (
                      <Button
                        onClick={retryRegistration}
                        disabled={registerToken.isPending}
                        variant="outline"
                        className="whitespace-nowrap flex-1 min-w-0"
                      >
                        Retry Registration
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleRetryWithCacheClear}
                      className="flex-1 whitespace-nowrap min-w-0"
                      size="sm"
                      disabled={registerToken.isPending}
                    >
                      <RefreshCw className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>Clear & Retry</span>
                    </Button>
                  </div>
                </div>
              )}

              {!(registerToken.status === "pending") &&
                !(registerToken.status === "error") && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 overflow-hidden">
                      <h4 className="font-semibold text-green-900 mb-2 break-words">
                        ✅ Notifications Active!
                      </h4>
                      <p className="text-sm text-green-800 break-words">
                        Your device is now registered for push notifications.
                        You&apos;ll receive real-time updates about:
                      </p>
                      <ul className="text-sm text-green-700 mt-2 space-y-1">
                        <li className="break-words">
                          • New orders and reservations
                        </li>
                        <li className="break-words">
                          • Customer messages and inquiries
                        </li>
                        <li className="break-words">
                          • Business performance updates
                        </li>
                        <li className="break-words">
                          • Important system notifications
                        </li>
                      </ul>
                    </div>
                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded break-all overflow-hidden">
                      Token: {token.substring(0, 20)}...
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryWithCacheClear}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2 flex-shrink-0" />
                      Clear & Re-enroll
                    </Button>
                  </>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
