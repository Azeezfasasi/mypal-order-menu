// hooks/useAppVersion.ts
"use client";

import { useEffect, useState } from "react";

interface AppVersion {
  current: string;
  buildTime: string;
  isUpdateAvailable: boolean;
  isServiceWorkerSupported: boolean;
}

interface ServiceWorkerMessage {
  type: string;
  version?: string;
  buildTime?: string;
  timestamp?: number;
}

export function useAppVersion() {
  const [appVersion, setAppVersion] = useState<AppVersion>({
    current: process.env.BUILD_VERSION || "unknown",
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    isUpdateAvailable: false,
    isServiceWorkerSupported:
      typeof window !== "undefined" && "serviceWorker" in navigator,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!appVersion.isServiceWorkerSupported) return;

    // Listen for service worker updates
    const handleServiceWorkerMessage = (
      event: MessageEvent<ServiceWorkerMessage>
    ) => {
      if (event.data && event.data.type === "SW_UPDATED") {
        console.log(
          "🔄 Service Worker updated to version:",
          event.data.version
        );

        setAppVersion((prev) => ({
          ...prev,
          isUpdateAvailable: event.data.version !== prev.current,
        }));
      }
    };

    // Register message listener
    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage
    );

    // Check current service worker version
    const checkServiceWorkerVersion = async () => {
      if (navigator.serviceWorker.controller) {
        // Create a message channel to communicate with SW
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data) {
            console.log("📊 Current SW version:", event.data.version);
            setAppVersion((prev) => ({
              ...prev,
              current: event.data.version,
              buildTime: event.data.buildTime,
            }));
          }
        };

        // Ask SW for its version
        navigator.serviceWorker.controller.postMessage(
          { type: "GET_VERSION" },
          [messageChannel.port2]
        );
      }
    };

    checkServiceWorkerVersion();

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessage
      );
    };
  }, [appVersion.isServiceWorkerSupported]);

  const refreshApp = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      // If service worker is available, tell it to skip waiting
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SKIP_WAITING",
        });

        // Wait for the new service worker to take control
        await new Promise<void>((resolve) => {
          const handleControllerChange = () => {
            navigator.serviceWorker.removeEventListener(
              "controllerchange",
              handleControllerChange
            );
            resolve();
          };
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            handleControllerChange
          );

          // Fallback timeout
          setTimeout(resolve, 1000);
        });
      }

      // Clear all caches to ensure fresh content
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Hard reload the page
      window.location.reload();
    } catch (error) {
      console.error("Failed to refresh app:", error);
      // Fallback to simple reload
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearCache = async () => {
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.log("🗑️ All caches cleared");
        return true;
      } catch (error) {
        console.error("Failed to clear cache:", error);
        return false;
      }
    }
    return false;
  };

  const getVersionInfo = () => {
    const buildDate = new Date(appVersion.buildTime);
    const now = new Date();
    const ageInHours = Math.floor(
      (now.getTime() - buildDate.getTime()) / (1000 * 60 * 60)
    );

    return {
      version: appVersion.current,
      buildTime: appVersion.buildTime,
      buildDate: buildDate.toLocaleString(),
      ageInHours,
      isUpdateAvailable: appVersion.isUpdateAvailable,
      isServiceWorkerSupported: appVersion.isServiceWorkerSupported,
    };
  };

  return {
    ...appVersion,
    refreshApp,
    clearCache,
    getVersionInfo,
    isRefreshing,
  };
}
