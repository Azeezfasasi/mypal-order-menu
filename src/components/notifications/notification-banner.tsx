"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  getPushSupportStatus,
  isMessagingSupportedAsync,
  safeRequestNotificationPermission,
} from "@/config/firebase";
import { useRegisterDeviceToken } from "@/examples/notification-api-usage";
import { Platform } from "@/types/enums";
import { Bell, Clock, TrendingUp, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

export function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  const registerToken = useRegisterDeviceToken("", Platform.WEB);

  useEffect(() => {
    // Show banner if:
    // 1. User has seen welcome modal (or dismissed it)
    // 2. Notifications are not granted
    // 3. Banner hasn't been dismissed for this session
    const hasSeenWelcome = localStorage.getItem("notification-welcome-seen");
    const bannerDismissed = sessionStorage.getItem(
      "notification-banner-dismissed",
    );

    (async () => {
      try {
        const sdkSupported = await isMessagingSupportedAsync();
        if (hasSeenWelcome && !bannerDismissed && !sdkSupported) return; // don't show if unsupported
        if (
          hasSeenWelcome &&
          !bannerDismissed &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification &&
          window.Notification.permission !== "granted"
        ) {
          // Show after a delay
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 5000); // 5 seconds after page load

          return () => clearTimeout(timer);
        }
      } catch {
        // fallback to sync helper
        const support = getPushSupportStatus();
        if (hasSeenWelcome && !bannerDismissed && !support.supported) return;
        if (
          hasSeenWelcome &&
          !bannerDismissed &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification &&
          window.Notification.permission !== "granted"
        ) {
          const timer = setTimeout(() => {
            setIsVisible(true);
          }, 5000);
          return () => clearTimeout(timer);
        }
      }
    })();
    // end async block
  }, []);

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      console.log("Banner: Starting notification permission request...");
      const result = await safeRequestNotificationPermission();

      if (result.token) {
        console.log("Banner: Token received, registering with backend...");
        registerToken.mutate(
          {
            token: result.token,
            platform: Platform.WEB,
            deviceInfo: navigator.userAgent,
          },
          {
            onSuccess: () => {
              console.log("Banner: Token registered successfully with backend");
              setIsVisible(false);
            },
            onError: (error) => {
              console.error(
                "Banner: Failed to register token with backend:",
                error,
              );
              // Hide banner anyway since notification permission was granted
              setIsVisible(false);
            },
          },
        );
      } else {
        console.error("Banner: No token received from Firebase");
        alert(
          "Failed to enable notifications. Please check your browser settings and try again.",
        );
      }
    } catch (error) {
      console.error("Banner: Error enabling notifications:", error);
      alert(
        "Error enabling notifications: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("notification-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="border-blue-200 bg-blue-50 shadow-lg">
        <Bell className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-semibold mb-1">
                Stay Connected with Your Business
              </p>
              <p className="text-sm mb-2">
                Enable notifications to get instant alerts for orders, customer
                messages, and important updates.
              </p>
              <div className="flex items-center space-x-4 text-xs text-blue-700 mb-3">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Grow revenue</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>Customer service</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Never miss opportunities</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  disabled={isEnabling}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isEnabling ? "Enabling..." : "Enable Notifications"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
