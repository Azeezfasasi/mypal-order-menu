"use client";

import {
  debugFirebaseConfig,
  getPushSupportStatus,
  isMessagingSupportedAsync,
  PushSupportInfo,
  safeRequestNotificationPermission,
} from "@/config/firebase";
import { useRegisterDeviceToken } from "@/examples/notification-api-usage";
import { Platform } from "@/types/enums";
import { useEffect, useState } from "react";

export function useNotificationWelcome() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const registerToken = useRegisterDeviceToken("", Platform.WEB);

  useEffect(() => {
    // Early return if we're not in a browser environment
    if (typeof window === "undefined") return;

    // Early return if localStorage is not available (some privacy modes)
    try {
      if (!window.localStorage) return;
    } catch {
      return;
    }
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem("notification-welcome-seen");
    // Check if Notification API is available before accessing it
    const notificationPermission =
      typeof window !== "undefined" &&
      "Notification" in window &&
      window.Notification
        ? window.Notification.permission
        : "denied";

    // Show modal if:
    // 1. User hasn't seen it before
    // 2. Notifications are not granted
    // 3. Browser and Firebase config support push
    (async () => {
      try {
        const sdkSupported = await isMessagingSupportedAsync();
        if (!hasSeenWelcome || notificationPermission === "granted") return;
        if (sdkSupported) {
          const timer = setTimeout(() => {
            setShowWelcomeModal(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } catch {
        // Fallback to sync helper
        const support = getPushSupportStatus();
        if (
          !hasSeenWelcome &&
          notificationPermission !== "granted" &&
          support.supported
        ) {
          const timer = setTimeout(() => {
            setShowWelcomeModal(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    })();
  }, []);

  const handleEnableNotifications = async (): Promise<{
    success: boolean;
    userGuidance?: PushSupportInfo["userGuidance"];
    error?: Error;
  }> => {
    try {
      console.log("Starting notification permission request...");
      debugFirebaseConfig(); // Debug Firebase configuration

      const result = await safeRequestNotificationPermission();

      if (result.token) {
        console.log("Token received, registering with backend...");

        // Register the token with backend
        try {
          await new Promise((resolve, reject) => {
            registerToken.mutate(
              {
                token: result.token!,
                platform: Platform.WEB,
                deviceInfo: navigator.userAgent,
              },
              {
                onSuccess: () => {
                  console.log("Token registered successfully with backend");
                  resolve(true);
                },
                onError: (error) => {
                  console.error(
                    "Failed to register token with backend:",
                    error,
                  );
                  reject(error);
                },
              },
            );
          });
        } catch (backendError) {
          console.error("Backend registration failed:", backendError);
          // Continue anyway - token might still work for notifications
        }

        // Mark as seen and close modal
        localStorage.setItem("notification-welcome-seen", "true");
        setShowWelcomeModal(false);
        setHasShownWelcome(true);

        return { success: true };
      } else {
        console.error("No token received from Firebase");
        return {
          success: false,
          userGuidance: result.userGuidance,
          error: result.error,
        };
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  };

  const handleSkip = () => {
    localStorage.setItem("notification-welcome-seen", "true");
    setShowWelcomeModal(false);
    setHasShownWelcome(true);
  };

  const handleClose = () => {
    setShowWelcomeModal(false);
  };

  return {
    showWelcomeModal,
    hasShownWelcome,
    handleEnableNotifications,
    handleSkip,
    handleClose,
  };
}
